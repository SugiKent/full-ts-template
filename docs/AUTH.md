# 認証アーキテクチャドキュメント

このドキュメントは、本システムにおける認証実装の詳細を説明します。

**関連ドキュメント:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 全体アーキテクチャ
- [BACKEND.md](./BACKEND.md) - バックエンド開発規約
- [DATABASE.md](./DATABASE.md) - データベース設計

## 目次
1. [認証システムの概要](#1-認証システムの概要)
2. [Better Auth設定](#2-better-auth設定)
3. [Fastify統合](#3-fastify統合)
4. [oRPC認証ミドルウェア](#4-orpc認証ミドルウェア)
5. [React認証統合](#5-react認証統合)
6. [ロールベースアクセス制御](#6-ロールベースアクセス制御)

## 1. 認証システムの概要

本システムは、**Better Auth** を使用した統一認証システムを実装します。
管理者とユーザーは**ロール（`admin` / `user`）**で区別されます。

```
┌─────────────────────────────────────┐
│          Better Auth                │
│  (PostgreSQL + Prisma Adapter)      │
│  - User/Session/Account テーブル    │
│  - Cookie ベースセッション          │
│  - Email/パスワード認証             │
│  - マジックリンク認証               │
│                                     │
│  ロールによる分離:                   │
│  - admin: 管理画面アクセス可能      │
│  - user: ユーザーページアクセス可能  │
└─────────────────────────────────────┘
```

### 1.1 認証方式

- **Email/パスワード認証**: 基本認証方式
- **マジックリンク認証**: パスワードレスログイン（15分有効）

### 1.2 対象ユーザー

| ロール | 対象 | アクセス可能領域 |
|--------|------|-----------------|
| `admin` | システム管理者 | 管理画面（`/admin/*`） |
| `user` | 一般ユーザー | ユーザーページ（`/user/*`） |

## 2. Better Auth設定

### 2.1 サーバー側設定

```typescript
// ✅ 実際の実装: src/server/auth/admin-auth.ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { magicLink } from 'better-auth/plugins'
import { prisma } from '../db/client'
import {
  sendMagicLinkEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../services/email.service'

export const adminAuth = betterAuth({
  // ベースパス設定
  basePath: '/api/auth',

  // ベースURL設定
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:8080',

  // 信頼するOrigins
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',').map((origin) => origin.trim())
    : process.env.NODE_ENV === 'production'
      ? [process.env.PRODUCTION_URL || 'https://yourdomain.com']
      : ['http://localhost:5173', 'http://localhost:8080'],

  // データベースアダプター（PostgreSQL + Prisma）
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  // Email/パスワード認証を有効化
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url)
    },
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url)
    },
  },

  // プラグイン
  plugins: [
    // マジックリンク認証（15分有効）
    magicLink({
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url)
      },
    }),
  ],

  // セッション設定（8時間有効）
  session: {
    expiresIn: 60 * 60 * 8,
    updateAge: 60 * 60 * 2,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  // セキュリティ設定
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: !!(
        process.env.NODE_ENV === 'production' ||
        process.env.BETTER_AUTH_URL?.startsWith('https')
      ),
      httpOnly: true,
    },
    crossSubDomainCookies: {
      enabled: false,
    },
  },

  // カスタムフィールド: ロール
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'user',
        input: true,
      },
    },
  },
})

export type AdminAuth = typeof adminAuth
```

### 2.2 環境変数

```bash
# Better Auth設定
BETTER_AUTH_URL=http://localhost:8080
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:8080

# 本番環境
# BETTER_AUTH_URL=https://yourdomain.com
# PRODUCTION_URL=https://yourdomain.com

# メール設定（開発環境: Mailpit）
SMTP_HOST=localhost
SMTP_PORT=1025
MAIL_FROM=noreply@example.com
MAIL_FROM_NAME=App
```

## 3. Fastify統合

### 3.1 認証プラグイン

```typescript
// ✅ 実際の実装: src/server/plugins/admin-auth.ts
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { adminAuth } from '../auth/admin-auth'

// 型定義
interface AdminUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
  image?: string
  role: string
  createdAt: Date
  updatedAt: Date
}

// Fastifyインスタンスの型拡張
declare module 'fastify' {
  interface FastifyInstance {
    adminAuth: typeof adminAuth
    authenticateAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireRole: (
      allowedRoles: string[],
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }

  interface FastifyRequest {
    user?: AdminUser
  }
}

const adminAuthPlugin: FastifyPluginAsync = async (fastify) => {
  // Better Authインスタンスをデコレート
  fastify.decorate('adminAuth', adminAuth)

  // Better AuthのAPIエンドポイントを公開（/api/auth/*）
  fastify.all('/api/auth/*', async (request, reply) => {
    const url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`)

    const requestInit: RequestInit = {
      method: request.method,
      headers: request.headers as HeadersInit,
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      requestInit.body = JSON.stringify(request.body)
    }

    const webRequest = new Request(url, requestInit)
    const response = await adminAuth.handler(webRequest)

    reply.status(response.status)
    response.headers.forEach((value: string, key: string) => {
      reply.header(key, value)
    })

    const body = await response.text()
    return reply.send(body)
  })

  // 認証ガード
  fastify.decorate('authenticateAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await adminAuth.api.getSession({
      headers: request.headers as Record<string, string>,
    })

    if (!session?.user) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    request.user = session.user as AdminUser
  })

  // ロールベース認証ガード
  fastify.decorate('requireRole', (allowedRoles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      await fastify.authenticateAdmin(request, reply)

      if (!request.user?.role || !allowedRoles.includes(request.user.role)) {
        return reply.status(403).send({ error: '権限がありません' })
      }
    }
  })
}

export default fp(adminAuthPlugin, {
  name: 'admin-auth-plugin',
})
```

### 3.2 ルートでの使用例

```typescript
// 認証が必要なルート
fastify.get('/admin/users', {
  preHandler: fastify.requireRole(['admin'])
}, async (request, reply) => {
  // request.user でユーザー情報にアクセス可能
  const users = await fastify.db.user.findMany()
  return reply.send(users)
})
```

## 4. oRPC認証ミドルウェア

### 4.1 コンテキスト型定義

```typescript
// ✅ 実際の実装: src/server/middleware/orpc-auth.ts
import { ORPCError, os } from '@orpc/server'
import type { PrismaClient } from '@prisma/client'

export interface ORPCContext {
  prisma: PrismaClient
  user?: {
    id: string
    email: string
    role: string
  }
}
```

### 4.2 認証ミドルウェア

```typescript
// 認証必須ミドルウェア
export const requireAuth = os.use(({ context, next }) => {
  const ctx = context as unknown as ORPCContext

  if (!ctx.user) {
    throw new ORPCError('UNAUTHORIZED')
  }

  return next({ context })
})

// ロールベース認証ミドルウェア
export const requireRole = (roles: string[]) =>
  os.use(({ context, next }) => {
    const ctx = context as unknown as ORPCContext

    if (!ctx.user) {
      throw new ORPCError('UNAUTHORIZED')
    }

    if (!roles.includes(ctx.user.role)) {
      throw new ORPCError('FORBIDDEN')
    }

    return next({ context })
  })
```

### 4.3 oRPCルートでの認証コンテキスト設定

```typescript
// ✅ 実際の実装: src/server/routes/admin/rpc.ts
fastify.all('/rpc/*', async (request, reply) => {
  // Better Authからセッション情報を取得
  const session = await adminAuth.api.getSession({
    headers: request.headers as Record<string, string>,
  })

  // contextを作成
  const context: ORPCContext = session?.user
    ? {
        prisma,
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
        },
      }
    : { prisma }

  // oRPCハンドラーを実行
  await handler.handle(request, reply, {
    prefix: '/api/admin/rpc',
    context,
  })
})
```

## 5. React認証統合

### 5.1 管理画面用認証フック

```typescript
// ✅ 実際の実装: src/client/hooks/useAdminAuth.ts
import { createAuthClient } from 'better-auth/client'
import { magicLinkClient } from 'better-auth/client/plugins'
import { useEffect, useState } from 'react'

export const adminAuthClient = createAuthClient({
  baseURL: window.location.origin,
  plugins: [magicLinkClient()],
})

export interface AdminUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
  image?: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // セッション取得時にロールチェック（adminのみ許可）
  useEffect(() => {
    async function loadSession() {
      const result = await adminAuthClient.getSession()
      if (result.data?.user) {
        const sessionUser = result.data.user as unknown as AdminUser
        if (sessionUser.role !== 'admin') {
          await adminAuthClient.signOut()
          setUser(null)
          setError('このアカウントでは管理画面にアクセスできません')
        } else {
          setUser(sessionUser)
        }
      }
      setLoading(false)
    }
    loadSession()
  }, [])

  const signUp = async (email: string, password: string, name: string) => {
    const result = await adminAuthClient.signUp.email({
      email,
      password,
      name,
      // @ts-expect-error - roleはサーバー側で設定されたカスタムフィールド
      role: 'admin',
    })
    // ...
  }

  const signIn = async (email: string, password: string) => {
    const result = await adminAuthClient.signIn.email({ email, password })
    // ロールチェック: adminロールのみ許可
    // ...
  }

  const signOut = async () => {
    await adminAuthClient.signOut()
    setUser(null)
  }

  const sendMagicLink = async (email: string) => {
    await adminAuthClient.signIn.magicLink({
      email,
      callbackURL: `${window.location.origin}/admin/dashboard`,
    })
  }

  return { user, loading, error, signUp, signIn, signOut, sendMagicLink }
}
```

### 5.2 ユーザー用認証フック

```typescript
// ✅ 実際の実装: src/client/hooks/useUserAuth.ts
import { createAuthClient } from 'better-auth/client'
import { magicLinkClient } from 'better-auth/client/plugins'

export const userAuthClient = createAuthClient({
  baseURL: window.location.origin,
  plugins: [magicLinkClient()],
})

export function useUserAuth() {
  // userロールのみ許可（adminはサインアウトしてエラー）
  // ...signUp時は role: 'user' を設定
  // ...signIn時はロールチェック
}
```

## 6. ロールベースアクセス制御

### 6.1 ロール定義

| ロール | 説明 | アクセス可能領域 |
|--------|------|-----------------|
| `admin` | 管理者 | `/admin/*`, `/api/admin/*` |
| `user` | 一般ユーザー | `/user/*`, `/api/user/*` |

### 6.2 クライアント側のロールチェック

- **管理画面（`useAdminAuth`）**: `admin`ロールのみ許可
- **ユーザーページ（`useUserAuth`）**: `user`ロールのみ許可

ロールが一致しない場合は自動的にサインアウトし、エラーメッセージを表示します。

### 6.3 サーバー側のロールチェック

```typescript
// Fastifyルート
fastify.requireRole(['admin'])

// oRPCプロシージャ
requireRole(['admin'])
```

---

## エンドポイント一覧

```
認証エンドポイント（Better Auth）:
  POST /api/auth/sign-up/email      - Email/パスワードでサインアップ
  POST /api/auth/sign-in/email      - Email/パスワードでサインイン
  POST /api/auth/sign-in/magic-link - マジックリンク送信
  POST /api/auth/sign-out           - サインアウト
  GET  /api/auth/session            - セッション取得
  POST /api/auth/forgot-password    - パスワードリセットメール送信
  POST /api/auth/reset-password     - パスワードリセット

oRPCエンドポイント:
  POST /api/admin/rpc/*  - 管理画面用RPC（admin認証必須）
  POST /api/user/rpc/*   - ユーザー用RPC
```

---

## 変更履歴

### 2025年12月
- ボイラープレートテンプレートとして初期化
- Better Authによる統一認証に変更（管理者/ユーザーはロールで区別）
- マジックリンク認証を追加
- oRPC認証ミドルウェアを追加

最終更新: 2025年12月
