# 認証アーキテクチャドキュメント

このドキュメントは、本システムにおける認証実装の詳細を説明します。

**関連ドキュメント:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 全体アーキテクチャ
- [BACKEND.md](./BACKEND.md) - バックエンド開発規約
- [DATABASE.md](./DATABASE.md) - データベース設計

## 目次
1. [認証システムの概要](#1-認証システムの概要)
2. [管理画面認証（Better Auth）](#2-管理画面認証better-auth)
3. [エンドユーザー認証（カスタム実装）](#3-エンドユーザー認証カスタム実装)
4. [認証システムの分離設計](#4-認証システムの分離設計)

## 1. 認証システムの概要

本システムは、**2つの独立した認証システム**を実装します：

```
┌─────────────────────────────────────┐
│        管理画面認証                   │
│  (Better Auth + PostgreSQL)          │
│  - User/Session/Account テーブル     │
│  - Cookie ベースセッション            │
│  - Email/パスワード認証              │
└─────────────────────────────────────┘
              ↕ 独立
┌─────────────────────────────────────┐
│      エンドユーザー認証               │
│  (カスタム実装 + Redis)              │
│  - EndUser テーブル                 │
│  - Redis セッション                  │
│  - カスタム認証フロー                │
└─────────────────────────────────────┘
```

### 1.1 分離のメリット

- **セキュリティ境界の明確化**: 管理者とエンドユーザーで完全に分離
- **管理者情報漏洩時の影響範囲限定**: 片方が侵害されても他方は安全
- **異なるセッション有効期限の設定**: 用途に応じた最適な設定
- **独立したスケーリング可能**: それぞれ独立してスケール可能

## 2. 管理画面認証（Better Auth）

### 2.1 対象ユーザー

- システム管理者
- 業務担当者
- 企業の管理担当者

### 2.2 認証方式

- **Email/パスワード認証**: 基本認証方式

### 2.3 Better Auth設定

```typescript
// ✅ 正しい実装: 管理画面用Better Auth設定
// src/server/auth/admin-auth.ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@/server/db/client'

export const adminAuth = betterAuth({
  // データベースアダプター
  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),

  // Email/パスワード認証
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail(user.email, '【アプリ名】メール認証', url)
    }
  },

  // セッション設定（管理画面用）
  session: {
    expiresIn: 60 * 60 * 8, // 8時間（業務時間を想定）
    updateAge: 60 * 60 * 2, // 2時間ごとに更新
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // 5分
    }
  },

  // セキュリティ設定
  advanced: {
    cookieSameSite: 'strict',
    cookieSecure: process.env.NODE_ENV === 'production',
    crossSubDomainCookies: {
      enabled: false
    }
  },

  // カスタムフィールド: ロール
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'staff', // 'admin' | 'staff' | 'company_admin'
        input: false
      }
    }
  }
})

export type AdminAuth = typeof adminAuth
```

### 2.4 Fastify統合

```typescript
// ✅ 正しい実装: 管理画面用Better AuthをFastifyプラグインとして統合
// src/server/plugins/admin-auth.ts
import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import { adminAuth } from '@/server/auth/admin-auth'

const adminAuthPlugin: FastifyPluginAsync = async (fastify) => {
  // Better Authインスタンスをデコレート
  fastify.decorate('adminAuth', adminAuth)

  // 管理画面用認証エンドポイント
  fastify.post('/api/admin/auth/signin', async (request, reply) => {
    const result = await adminAuth.api.signInEmail({
      body: request.body
    })
    return reply.send(result)
  })

  fastify.post('/api/admin/auth/signup', async (request, reply) => {
    // 管理者登録は招待制または既存管理者のみ
    const session = await adminAuth.api.getSession({
      headers: request.headers
    })

    if (!session?.user || session.user.role !== 'admin') {
      return reply.status(403).send({ error: '管理者権限が必要です' })
    }

    const result = await adminAuth.api.signUpEmail({
      body: request.body
    })
    return reply.send(result)
  })

  fastify.post('/api/admin/auth/signout', async (request, reply) => {
    await adminAuth.api.signOut({
      headers: request.headers
    })
    return reply.send({ success: true })
  })

  // 管理画面用認証ガード
  fastify.decorate('authenticateAdmin', async function(request, reply) {
    const session = await adminAuth.api.getSession({
      headers: request.headers
    })

    if (!session?.user) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    request.user = session.user
  })

  // ロールベース認証ガード
  fastify.decorate('requireRole', (allowedRoles: string[]) => {
    return async function(request, reply) {
      await fastify.authenticateAdmin(request, reply)

      if (!request.user?.role || !allowedRoles.includes(request.user.role)) {
        return reply.status(403).send({ error: '権限がありません' })
      }
    }
  })
}

export default fp(adminAuthPlugin, {
  name: 'admin-auth-plugin',
  dependencies: ['database-plugin']
})
```

### 2.5 管理画面ルートでの使用例

```typescript
// ✅ 正しい実装: 管理画面の認証が必要なルート
// src/server/routes/admin/users.ts
import { FastifyPluginAsync } from 'fastify'

const adminUserRoutes: FastifyPluginAsync = async (fastify) => {
  // 全ルートに管理者認証を適用
  fastify.addHook('onRequest', fastify.authenticateAdmin)

  // 管理者のみアクセス可能
  fastify.get('/admin/users', {
    preHandler: fastify.requireRole(['admin'])
  }, async (request, reply) => {
    const users = await fastify.db.user.findMany()
    return reply.send(users)
  })

  // 管理者またはスタッフがアクセス可能
  fastify.get('/admin/appointments', {
    preHandler: fastify.requireRole(['admin', 'staff'])
  }, async (request, reply) => {
    const appointments = await fastify.db.appointment.findMany({
      where: {
        staffId: request.user.role === 'staff'
          ? request.user.id
          : undefined
      }
    })
    return reply.send(appointments)
  })
}

export default adminUserRoutes
```

### 2.6 React認証統合

```typescript
// ✅ 正しい実装: 管理画面用Better Auth Reactフック
// src/client/hooks/useAdminAuth.ts
import { createAuthClient } from 'better-auth/client'
import { useState, useEffect } from 'react'

export const adminAuthClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  basePath: '/api/admin/auth'
})

interface AdminUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
  image?: string
  role: 'admin' | 'staff' | 'company_admin'
  createdAt: string
  updatedAt: string
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAuthClient.getSession().then((session) => {
      setUser(session?.user as AdminUser || null)
      setLoading(false)
    })
  }, [])

  const signIn = async (email: string, password: string) => {
    const result = await adminAuthClient.signIn.email({
      email,
      password
    })
    if (result.user) {
      setUser(result.user as AdminUser)
    }
    return result
  }

  const signOut = async () => {
    await adminAuthClient.signOut()
    setUser(null)
  }

  const hasRole = (allowedRoles: string[]) => {
    return user?.role ? allowedRoles.includes(user.role) : false
  }

  return { user, loading, signIn, signOut, hasRole }
}
```

## 3. エンドユーザー認証（カスタム実装）

### 3.1 対象ユーザー

- サービスの利用者（一般ユーザー）

### 3.2 認証方式

プロジェクトの要件に応じてカスタマイズ可能です：
- Email/パスワード認証
- ソーシャルログイン（OAuth）
- マジックリンク認証
- 多要素認証

### 3.3 セッション管理

- **Redis保存**: 30日間有効
- **セッションキー**: `user_session:{userId}`
- **トークンベース認証**: JWTまたはセッショントークン

### 3.4 エンドユーザー認証サービス

```typescript
// ✅ 正しい実装: エンドユーザー認証サービス
// src/server/services/user-auth.ts
import { endUserRepository } from '@/server/repositories/endUserRepository'
import { redis } from '@/server/db/redis'
import crypto from 'crypto'

export const userAuthService = {
  /**
   * Email/パスワードによるエンドユーザー認証
   */
  async authenticate(
    email: string,
    password: string
  ) {
    // 1. ユーザー情報の照合
    const user = await endUserRepository.findByEmail(email)

    if (!user) {
      throw new Error('メールアドレスまたはパスワードが正しくありません')
    }

    // 2. パスワード検証
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      throw new Error('メールアドレスまたはパスワードが正しくありません')
    }

    // 3. セッショントークン生成
    const sessionToken = crypto.randomUUID()
    const sessionKey = `user_session:${user.id}`

    // 4. Redisにセッション保存（30日間有効）
    await redis.setex(
      sessionKey,
      60 * 60 * 24 * 30,
      JSON.stringify({
        userId: user.id,
        email: user.email,
        authenticatedAt: new Date().toISOString()
      })
    )

    return {
      success: true,
      sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    }
  },

  /**
   * セッション検証
   */
  async validateSession(userId: string) {
    const sessionKey = `user_session:${userId}`
    const sessionData = await redis.get(sessionKey)

    if (!sessionData) {
      return null
    }

    return JSON.parse(sessionData)
  },

  /**
   * ログアウト
   */
  async logout(userId: string) {
    const sessionKey = `user_session:${userId}`
    await redis.del(sessionKey)
  }
}
```

### 3.5 認証ミドルウェア

```typescript
// ✅ 正しい実装: エンドユーザー用認証ミドルウェア
// src/server/plugins/user-auth.ts
import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import { userAuthService } from '@/server/services/user-auth'

const userAuthPlugin: FastifyPluginAsync = async (fastify) => {
  // エンドユーザー認証ガード
  fastify.decorate('authenticateUser', async function(request, reply) {
    const authHeader = request.headers.authorization
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return reply.status(401).send({ error: '認証が必要です' })
    }

    const session = await userAuthService.validateSession(token)

    if (!session) {
      return reply.status(401).send({
        error: '認証が必要です',
        requireAuth: true
      })
    }

    request.endUser = {
      id: session.userId,
      email: session.email
    }
  })

  // エンドユーザー認証エンドポイント
  fastify.post('/api/auth/login', async (request, reply) => {
    const { email, password } = request.body as {
      email: string
      password: string
    }

    try {
      const result = await userAuthService.authenticate(email, password)
      return reply.send(result)
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : '認証に失敗しました'
      })
    }
  })

  fastify.post('/api/auth/logout', async (request, reply) => {
    const authHeader = request.headers.authorization
    const token = authHeader?.replace('Bearer ', '')

    if (token) {
      await userAuthService.logout(token)
    }

    return reply.send({ success: true })
  })
}

export default fp(userAuthPlugin, {
  name: 'user-auth-plugin',
  dependencies: ['database-plugin']
})
```

### 3.6 クライアントアプリでの認証フロー

```typescript
// ✅ 正しい実装: クライアント認証フロー
// src/client/user/components/AuthForm.tsx
import { useState } from 'react'
import { api } from '@/client/services/api'

function UserAuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await api.auth.login({
        email,
        password
      })

      if (result.success) {
        // 認証成功 - ホーム画面へ遷移
        window.location.href = '/home'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '認証に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold text-center mb-6">
        ログイン
      </h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          メールアドレス
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-md"
          placeholder="user@example.com"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          パスワード
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-md"
          placeholder="••••••••"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'ログイン中...' : 'ログイン'}
      </button>
    </form>
  )
}

export default UserAuthForm
```

## 4. 認証システムの分離設計

### 4.1 セキュリティ対策の比較

| 項目 | 管理画面認証 | エンドユーザー認証 |
|------|------------|--------------|
| **認証方式** | Email/パスワード | Email/パスワード（カスタマイズ可） |
| **セッション保存** | PostgreSQL（Better Auth） | Redis |
| **セッション有効期限** | 8時間 | 30日間 |
| **Cookie使用** | ✅ あり（Secure/HttpOnly） | ❌ なし（トークンベース） |
| **パスワード** | bcryptハッシュ化 | bcryptハッシュ化 |
| **ロールベースアクセス** | ✅ あり（admin/staff/company_admin） | プロジェクトに応じて設定 |

### 4.2 エンドポイント分離

```
管理画面認証:
  POST /api/admin/auth/signin
  POST /api/admin/auth/signup
  POST /api/admin/auth/signout
  GET  /api/admin/auth/session

エンドユーザー認証:
  POST /api/auth/login
  POST /api/auth/register
  POST /api/auth/logout
  GET  /api/auth/session
```

### 4.3 データベーステーブル分離

詳細は [DATABASE.md](./DATABASE.md) を参照してください。

---

## 変更履歴

### 2025年12月
- ボイラープレートテンプレートとして初期化
- エンドユーザー認証を汎用的なパターンに変更

最終更新: 2025年12月
