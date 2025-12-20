import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
/**
 * 管理画面用 Better Auth プラグイン
 * Fastifyに認証機能を統合します
 */
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
