# バックエンド開発規約

このドキュメントは、Fastify + oRPC + Prisma を使用したバックエンド開発の規約とベストプラクティスを説明します。

**関連ドキュメント:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 全体アーキテクチャ
- [AUTH.md](./AUTH.md) - 認証実装
- [DATABASE.md](./DATABASE.md) - データベース設計

## 目次
1. [oRPC統合パターン](#1-orpc統合パターン)
2. [Fastifyベストプラクティス](#2-fastifyベストプラクティス)
3. [アーキテクチャパターン](#3-アーキテクチャパターン)
4. [テストパターン](#4-テストパターン)
5. [パフォーマンス最適化](#5-パフォーマンス最適化)
6. [セキュリティ](#6-セキュリティ)

## 1. oRPC統合パターン

### 1.1 概要

**oRPCはtRPCより高性能で、型安全なRPC通信を提供します：**

| 指標 | oRPC | tRPC | 改善率 |
|------|------|------|--------|
| リクエスト処理速度 | 295,000/20s | 104,000/20s | 2.8倍高速 |
| CPU使用率 | 102% | 129% | 26%低減 |
| メモリ使用量 | 103MB | 268MB | 2.6倍省メモリ |
| バンドルサイズ | 32.3kB | 65.5kB | 2倍小型化 |

### 1.2 Procedure定義

```typescript
// ✅ 正しい実装: oRPC Procedure定義
// src/server/procedures/user.ts
import { os } from '@orpc/server'
import { z } from 'zod'
import { prisma } from '@/server/db/client'

// 入力スキーマ定義
const CreateUserInput = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  companyCode: z.string().regex(/^[A-Z0-9]{6}$/)
})

const GetUserInput = z.object({
  id: z.string().uuid()
})

// ユーザー作成Procedure
export const createUser = os
  .input(CreateUserInput)
  .handler(async ({ input }) => {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        birthDate: input.birthDate,
        companyCode: input.companyCode
      }
    })
    return user
  })

// ユーザー取得Procedure
export const getUser = os
  .input(GetUserInput)
  .handler(async ({ input }) => {
    const user = await prisma.user.findUnique({
      where: { id: input.id }
    })
    if (!user) {
      throw new Error('User not found')
    }
    return user
  })

// Routerの構成
export const userRouter = {
  create: createUser,
  get: getUser,
}
```

### 1.3 Fastify統合

```typescript
// ✅ 正しい実装: oRPCをFastifyに統合
// src/server/routes/rpc.ts
import { FastifyPluginAsync } from 'fastify'
import { serve } from '@orpc/server'
import { userRouter } from '@/server/procedures/user'
import { appointmentRouter } from '@/server/procedures/appointment'

// ルーター統合
export const appRouter = {
  user: userRouter,
  appointment: appointmentRouter,
}

export type AppRouter = typeof appRouter

const rpcRoutes: FastifyPluginAsync = async (fastify) => {
  // oRPCをFastifyに登録
  serve(fastify, appRouter)
}

export default rpcRoutes
```

## 2. Fastifyベストプラクティス

### 2.1 Plugin Architecture

**Fastify v5では、プラグインによるモジュラー設計が必須です：**

```typescript
// ✅ 正しい実装: プラグインのカプセル化
// src/server/plugins/database.ts
import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import { prisma } from '@/server/db/client'

const databasePlugin: FastifyPluginAsync = async (fastify, opts) => {
  // デコレーターでDBクライアントを追加
  fastify.decorate('db', prisma)

  // グレースフルシャットダウン
  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()
  })
}

export default fp(databasePlugin, {
  name: 'database-plugin',
  dependencies: []
})
```

### 2.2 Schema Validation

**TypeBoxによる型安全なスキーマ定義：**

```typescript
// ✅ 正しい実装: TypeBoxでスキーマと型を同時定義
// src/server/schemas/user.ts
import { Type, Static } from '@sinclair/typebox'

// スキーマ定義
export const UserSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email: Type.String({ format: 'email' }),
  name: Type.String({ minLength: 1, maxLength: 100 }),
  birthDate: Type.String({ format: 'date' }),
  createdAt: Type.String({ format: 'date-time' })
})

export const CreateUserSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  name: Type.String({ minLength: 1, maxLength: 100 }),
  birthDate: Type.String({ format: 'date' }),
  companyCode: Type.String({ pattern: '^[A-Z0-9]{6}$' })
})

// 型の自動生成
export type User = Static<typeof UserSchema>
export type CreateUserInput = Static<typeof CreateUserSchema>
```

### 2.3 Error Handling

```typescript
// ✅ 正しい実装: カスタムエラーハンドラー
// src/server/hooks/errorHandler.ts
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // ロギング（Pinoによる構造化ログ）
  request.log.error({
    err: error,
    request: {
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query
    }
  })

  // バリデーションエラーの処理
  if (error.validation) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation Error',
      details: error.validation
    })
  }

  // ビジネスエラーの処理
  if (error.statusCode && error.statusCode < 500) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: error.name,
      message: error.message
    })
  }

  // 内部サーバーエラー
  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: '予期しないエラーが発生しました'
  })
}
```

### 2.4 Logging

**Pinoによる構造化ロギング：**

```typescript
// ✅ 正しい実装: Pinoロガーの設定
// src/server/app.ts
import Fastify from 'fastify'
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      params: req.params,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-request-id': req.headers['x-request-id']
      }
    }),
    res: (res) => ({
      statusCode: res.statusCode
    })
  }
})

const fastify = Fastify({
  logger,
  requestIdLogLabel: 'reqId',
  disableRequestLogging: false,
  diagnosticsChannel: true
})
```

### 2.5 TypeScript統合

**Fastify Declaration Merging（型拡張）：**

```typescript
// ✅ 正しい実装: Fastify型の拡張
// src/server/types/fastify.d.ts
import { ExtendedPrismaClient } from '@/server/db/client'

declare module 'fastify' {
  interface FastifyInstance {
    db: ExtendedPrismaClient
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }

  interface FastifyRequest {
    user?: {
      id: string
      email: string
      role: string
    }
  }

  interface FastifyContextConfig {
    requireAuth?: boolean
    roles?: string[]
  }
}
```

### 2.6 アプリケーション構成

```typescript
// src/server/app.ts
import Fastify from 'fastify'
import autoLoad from '@fastify/autoload'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { join } from 'path'

export function build(opts = {}) {
  const app = Fastify({
    logger: true,
    trustProxy: true,
    requestIdHeader: 'x-request-id',
    genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
    ...opts
  }).withTypeProvider<TypeBoxTypeProvider>()

  // セキュリティプラグイン
  app.register(helmet, {
    contentSecurityPolicy: process.env.NODE_ENV === 'production'
  })

  // CORS設定
  app.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  })

  // レート制限
  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  })

  // プラグインの自動読み込み
  app.register(autoLoad, {
    dir: join(__dirname, 'plugins'),
    options: { prefix: '/plugins' }
  })

  // ルートの自動読み込み
  app.register(autoLoad, {
    dir: join(__dirname, 'routes'),
    options: { prefix: '/api' }
  })

  return app
}
```

## 3. アーキテクチャパターン

### 3.1 レイヤード構造（関数ベース設計）

**重要: データベースアクセスの制限**

| 層 | Prisma使用 | 説明 |
|---|---|---|
| **Repository層** | ✅ 許可 | Prismaを使用してデータベース操作を行う唯一の層 |
| **Service層** | ❌ 禁止 | Repository層を通じてのみデータベースアクセス |
| **Controller層** | ❌ 禁止 | Service層を通じてビジネスロジックを実行 |
| **Route層** | ❌ 禁止 | Controller/Service層を呼び出すのみ |

```typescript
// ✅ 正しい実装: Routes → Services → Repositories のレイヤード構造

// Route層 (src/server/routes/users.ts)
import { userService } from '@/server/services/userService'

export const userRoutes = (fastify: FastifyInstance) => {
  fastify.get('/users/:id', async (request, reply) => {
    const user = await userService.findById(request.params.id)
    return reply.send(user)
  })
}

// Service層 (src/server/services/userService.ts)
import { userRepository } from '@/server/repositories/userRepository'

export const userService = {
  async findById(id: string) {
    const user = await userRepository.findById(id)
    return enrichUserData(user)
  },

  async updateUser(id: string, data: UpdateUserData) {
    validateUserData(data)
    return userRepository.update(id, data)
  }
}

// Repository層 (src/server/repositories/userRepository.ts)
import { prisma } from '@/server/db/client'

export const userRepository = {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } })
  },

  async update(id: string, data: UpdateUserData) {
    return prisma.user.update({
      where: { id },
      data
    })
  }
}
```

### 3.2 Prisma Model拡張パターン

**Prismaモデルにビジネスロジックを追加する場合は、必ず`$extends`機能を使用：**

```typescript
// ✅ 正しい実装: Prisma $extendsを使用したモデル拡張
// src/server/db/client.ts
import { PrismaClient, Prisma } from '@prisma/client'

const userExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    model: {
      user: {
        async signUp(email: string, password: string, name: string) {
          const hashedPassword = await hashPassword(password)
          return client.user.create({
            data: { email, password: hashedPassword, name }
          })
        },

        async authenticate(email: string, password: string) {
          const user = await client.user.findUnique({ where: { email } })
          if (!user) return null

          const isValid = await verifyPassword(password, user.password)
          return isValid ? user : null
        }
      }
    },
    result: {
      user: {
        displayName: {
          needs: { lastName: true, firstName: true },
          compute(user) {
            return `${user.lastName} ${user.firstName}`
          }
        }
      }
    }
  })
})

export const prisma = new PrismaClient().$extends(userExtension)
export type ExtendedPrismaClient = typeof prisma
```

## 4. テストパターン

バックエンドのテスト戦略とベストプラクティスについては **[TEST.md](./TEST.md)** を参照してください。

**詳細なテストパターン、モック戦略、データベーステストは [TEST.md](./TEST.md) に記載されています。**

## 5. パフォーマンス最適化

### 5.1 スキーマによる最適化

```typescript
// ✅ 正しい実装: レスポンススキーマによる最適化
import { Type } from '@sinclair/typebox'

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/users', {
    schema: {
      response: {
        200: Type.Array(UserSchema), // スキーマによる2-3倍の高速化
        404: ErrorSchema
      }
    }
  }, async (request, reply) => {
    const users = await fastify.db.user.findMany()
    return users
  })
}
```

### 5.2 Fastify特有の最適化

```typescript
// ✅ 正しい実装: パフォーマンス設定
const fastify = Fastify({
  genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
  bodyLimit: 1048576, // 1MB
  connectionTimeout: 10000, // 10秒
  keepAliveTimeout: 72000, // 72秒
})

// プリハンドラーでのキャッシュ
fastify.addHook('preHandler', async (request, reply) => {
  const cached = await redis.get(request.url)
  if (cached) {
    reply.header('X-Cache', 'HIT')
    reply.send(JSON.parse(cached))
  }
})
```

### 5.3 非同期処理の最適化

- **Promise.all()の活用**: 並列実行可能な処理を同時実行
- **Stream処理**: 大量データはStreamで処理
- **Worker Threads**: CPU集約的な処理は別スレッドで実行

### 5.4 Prismaクエリ最適化

- **Select/Include最適化**: 必要なフィールドのみ取得
- **バッチ処理**: `createMany`、`updateMany`の活用
- **接続プール調整**: 適切なプールサイズ設定

## 6. セキュリティ

### 6.1 セキュリティプラグイン設定

```typescript
// ✅ 正しい実装: 包括的なセキュリティ設定
// src/server/plugins/security.ts
import fp from 'fastify-plugin'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import csrf from '@fastify/csrf-protection'

export default fp(async function securityPlugin(fastify) {
  // Helmetによるセキュリティヘッダー設定
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  })

  // レート制限（DDoS対策）
  await fastify.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    cache: 10000,
    redis: fastify.redis,
    keyGenerator: (request) => {
      return request.headers['x-forwarded-for'] ||
             request.headers['x-real-ip'] ||
             request.ip
    }
  })

  // CSRF対策
  await fastify.register(csrf, {
    sessionPlugin: '@fastify/secure-session',
    csrfOpts: {
      algorithm: 'sha256',
      tokenLength: 32
    }
  })
})
```

### 6.2 入力サニタイゼーション

```typescript
// ✅ 正しい実装: 入力値のサニタイゼーション
import DOMPurify from 'isomorphic-dompurify'

fastify.addHook('preValidation', async (request, reply) => {
  if (request.body && typeof request.body === 'object') {
    for (const key in request.body) {
      if (typeof request.body[key] === 'string') {
        request.body[key] = DOMPurify.sanitize(request.body[key])
      }
    }
  }
})
```

---

## 変更履歴

### 2025年12月
- ボイラープレートテンプレート化
- 外部サービス固有の設定を削除

### 2025年11月15日
- ARCHITECTURE.mdから分離してBACKEND.mdを作成
- oRPC統合パターンの詳細追加
- Fastify v5ベストプラクティスの強化
- Repository層のPrisma使用制限を明確化

最終更新: 2025年12月
