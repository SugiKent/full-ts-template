/**
 * 管理画面 oRPC統合エンドポイント
 *
 * Fastifyにo RPC Procedureを統合
 */

import { RPCHandler } from '@orpc/server/fastify'
import type { FastifyPluginAsync } from 'fastify'
import { adminAuth } from '../../auth/admin-auth.js'
import { prisma } from '../../db/client.js'
import type { ORPCContext } from '../../middleware/orpc-auth.js'
import { adminRouter } from '../../procedures/admin/index.js'

/**
 * oRPC統合ルート
 *
 * `/api/admin/rpc/*` でoRPC Procedureにアクセス可能
 */
const rpcRoutes: FastifyPluginAsync = async (fastify) => {
  // oRPCハンドラーを作成
  const handler = new RPCHandler(adminRouter)

  // Any content typeを許可（oRPCが手動でパース）
  fastify.addContentTypeParser('*', (_request, _payload, done) => {
    done(null, undefined)
  })

  // oRPCエンドポイント
  fastify.all('/rpc/*', async (request, reply) => {
    try {
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
      const { matched } = await handler.handle(request, reply, {
        prefix: '/api/admin/rpc',
        context,
      })

      if (!matched) {
        reply.status(404).send({ error: 'Not found' })
      }
    } catch (error) {
      fastify.log.error({ error, path: request.url }, 'oRPC handler error')
      throw error
    }
  })
}

export default rpcRoutes
