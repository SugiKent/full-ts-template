import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
/**
 * 管理画面用 Better Auth プラグイン
 * Fastifyに認証機能を統合します
 */
import fp from 'fastify-plugin'
import { adminAuth } from '../auth/admin-auth'
import { prisma } from '../db/client'
import * as userRepo from '../repositories/user.repository.js'
import { createLayerLogger, serializeError } from '../utils/logger.js'

const logger = createLayerLogger('plugin', 'admin-auth')

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

  // パスワードレス登録用カスタムエンドポイント
  // 登録情報を保存してからマジックリンクを送信
  fastify.post<{
    Body: {
      email: string
      name: string
      role: 'admin' | 'user'
      callbackURL: string
    }
  }>('/api/auth/register-passwordless', async (request, reply) => {
    const { email, name, role, callbackURL } = request.body

    // バリデーション
    if (!email || !name || !role) {
      return reply.status(400).send({ error: 'メールアドレス、名前、ロールは必須です' })
    }

    if (!['admin', 'user'].includes(role)) {
      return reply.status(400).send({ error: '無効なロールです' })
    }

    // 既存ユーザーのチェック
    const existingUser = await userRepo.findByEmail(prisma, email)

    if (existingUser) {
      return reply.status(400).send({ error: 'このメールアドレスは既に登録されています' })
    }

    // ユーザーを事前作成（name, role を設定）
    // これにより、マジックリンク認証時に正しい情報でセッションが作成される
    try {
      await userRepo.create(prisma, {
        email,
        name,
        role,
        emailVerified: false,
      })
    } catch (error) {
      logger.error({ error: serializeError(error), email }, 'Failed to create user')
      return reply.status(500).send({ error: 'ユーザーの作成に失敗しました' })
    }

    // マジックリンクを送信（既存ユーザーとしてログイン）
    try {
      const result = await adminAuth.api.signInMagicLink({
        headers: request.headers as Record<string, string>,
        body: {
          email,
          callbackURL:
            callbackURL || `${process.env.BETTER_AUTH_URL || 'http://localhost:8080'}/user/home`,
        },
      })

      if (!result) {
        // マジックリンク送信に失敗した場合、作成したユーザーを削除
        await userRepo.deleteByEmail(prisma, email)
        return reply.status(500).send({ error: 'マジックリンクの送信に失敗しました' })
      }

      return reply.send({ success: true })
    } catch (error) {
      logger.error({ error: serializeError(error), email }, 'Failed to send magic link')
      // マジックリンク送信に失敗した場合、作成したユーザーを削除
      await userRepo.deleteByEmail(prisma, email)
      return reply.status(500).send({ error: 'マジックリンクの送信に失敗しました' })
    }
  })

  // 管理画面用認証エンドポイント
  // Better AuthのAPIエンドポイントを公開（/api/auth/*）
  fastify.all('/api/auth/*', async (request, reply) => {
    // Fetch API Request を構築
    const url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`)

    const requestInit: RequestInit = {
      method: request.method,
      headers: request.headers as HeadersInit,
    }

    // GETとHEAD以外の場合はbodyを追加
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      requestInit.body = JSON.stringify(request.body)
    }

    const webRequest = new Request(url, requestInit)

    // Better Authのハンドラーを呼び出し
    const response = await adminAuth.handler(webRequest)

    // Responseをfastify replyに変換
    reply.status(response.status)

    // ヘッダーをコピー
    response.headers.forEach((value: string, key: string) => {
      reply.header(key, value)
    })

    // レスポンスボディを返す
    const body = await response.text()
    return reply.send(body)
  })

  // 管理画面用認証ガード
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
      // まず認証チェック
      await fastify.authenticateAdmin(request, reply)

      // ロールチェック
      if (!request.user?.role || !allowedRoles.includes(request.user.role)) {
        return reply.status(403).send({ error: '権限がありません' })
      }
    }
  })
}

export default fp(adminAuthPlugin, {
  name: 'admin-auth-plugin',
})
