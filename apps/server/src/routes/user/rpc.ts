/**
 * ユーザー向け oRPC統合エンドポイント
 *
 * Fastifyにo RPC Procedureを統合
 */

import { RPCHandler } from '@orpc/server/fastify'
import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../../db/client.js'
import type { ORPCContext } from '../../middleware/orpc-auth.js'
import { userRouter } from '../../procedures/user/index.js'

/**
 * oRPC統合ルート
 *
 * `/api/user/rpc/*` でoRPC Procedureにアクセス可能
 */
const rpcRoutes: FastifyPluginAsync = async (fastify) => {
  // oRPCハンドラーを作成
  const handler = new RPCHandler(userRouter)

  // Any content typeを許可（oRPCが手動でパース）
  fastify.addContentTypeParser('*', (_request, _payload, done) => {
    done(null, undefined)
  })

  // oRPCエンドポイント
  fastify.all('/rpc/*', async (request, reply) => {
    try {
      // TODO: プロジェクトに応じて認証処理を追加
      // 例: JWTトークンからユーザー情報を取得
      // const user = await verifyUserToken(request)

      // contextを作成
      const context: ORPCContext = {
        prisma,
        // user: user ? { id: user.id, email: user.email, role: user.role } : undefined,
      }

      // oRPCハンドラーを実行
      const { matched } = await handler.handle(request, reply, {
        prefix: '/api/user/rpc',
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
