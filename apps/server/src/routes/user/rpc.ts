/**
 * ユーザー向け oRPC統合エンドポイント
 *
 * Fastifyにo RPC Procedureを統合
 * Device ID認証をサポート
 * パスベースのバージョニング対応
 */

import { RPCHandler } from '@orpc/server/fastify'
import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../../db/client.js'
import type { DeviceContext, ORPCContext } from '../../middleware/orpc-auth.js'
import { userRouter, v1Router } from '../../procedures/user/index.js'
import * as deviceRepo from '../../repositories/device.repository.js'
import { createLayerLogger } from '../../utils/logger.js'

const logger = createLayerLogger('route', 'user-rpc')

/**
 * アプリバージョン情報
 */
interface AppVersionInfo {
  appVersion: string | null
  osVersion: string | null
}

/**
 * Authorization ヘッダーから Bearer トークンを抽出
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer') {
    return null
  }

  return parts[1] ?? null
}

/**
 * リクエストヘッダーからアプリバージョン情報を抽出
 */
function extractAppVersionInfo(
  headers: Record<string, string | string[] | undefined>,
): AppVersionInfo {
  const appVersion = headers['x-app-version']
  const osVersion = headers['x-os-version']

  return {
    appVersion: typeof appVersion === 'string' ? appVersion : null,
    osVersion: typeof osVersion === 'string' ? osVersion : null,
  }
}

/**
 * トークンを検証してデバイスコンテキストを返す
 */
async function verifyDeviceToken(token: string): Promise<DeviceContext | null> {
  const result = await deviceRepo.validateAccessToken(prisma, token)

  if (!result) {
    return null
  }

  // lastSeenAt を更新（非同期で実行、エラーは無視）
  deviceRepo.updateLastSeen(prisma, result.device.deviceId).catch(() => {
    // 更新失敗は無視
  })

  return {
    id: result.device.id,
    deviceId: result.device.deviceId,
    hasAgreedToTerms: result.device.hasAgreedToTerms,
  }
}

/**
 * oRPC リクエストを処理する共通ハンドラー
 */
async function handleRPCRequest(
  // biome-ignore lint/suspicious/noExplicitAny: oRPC handler types are complex
  handler: RPCHandler<any>,
  prefix: `/${string}`,
  // biome-ignore lint/suspicious/noExplicitAny: Fastify request type with oRPC integration
  request: any,
  // biome-ignore lint/suspicious/noExplicitAny: Fastify reply type
  reply: any,
  fastify: { log: { error: (obj: object, msg: string) => void } },
) {
  try {
    // Authorization ヘッダーからトークンを抽出
    const token = extractBearerToken(request.headers.authorization)

    // デバイス認証を実行（トークンがある場合のみ）
    let device: DeviceContext | undefined
    if (token) {
      const deviceContext = await verifyDeviceToken(token)
      if (deviceContext) {
        device = deviceContext
      }
    }

    // アプリバージョン情報を抽出してログ出力
    const versionInfo = extractAppVersionInfo(
      request.headers as Record<string, string | string[] | undefined>,
    )
    if (versionInfo.appVersion || versionInfo.osVersion) {
      logger.info(
        {
          appVersion: versionInfo.appVersion,
          osVersion: versionInfo.osVersion,
          deviceId: device?.deviceId ?? 'anonymous',
        },
        'Client version info',
      )
    }

    // contextを作成
    const context: ORPCContext = {
      prisma,
      // user は Better Auth 経由で設定（Admin API用）
    }

    // デバイスコンテキストがある場合のみ設定
    if (device) {
      context.device = device
    }

    // oRPCハンドラーを実行
    const { matched } = await handler.handle(request, reply, {
      prefix,
      context,
    })

    if (!matched) {
      reply.status(404).send({ error: 'Not found' })
    }
  } catch (error) {
    fastify.log.error({ error, path: request.url }, 'oRPC handler error')
    throw error
  }
}

/**
 * oRPC統合ルート
 *
 * `/api/user/rpc/*` でoRPC Procedureにアクセス可能（後方互換）
 * `/api/user/v1/rpc/*` でv1 APIにアクセス可能（推奨）
 */
const rpcRoutes: FastifyPluginAsync = async (fastify) => {
  // oRPCハンドラーを作成
  const v1Handler = new RPCHandler(v1Router)
  const legacyHandler = new RPCHandler(userRouter)

  // Any content typeを許可（oRPCが手動でパース）
  fastify.addContentTypeParser('*', (_request, _payload, done) => {
    done(null, undefined)
  })

  // v1 oRPCエンドポイント（推奨）
  fastify.all('/v1/rpc/*', async (request, reply) => {
    await handleRPCRequest(v1Handler, '/api/user/v1/rpc', request, reply, fastify)
  })

  // Legacy oRPCエンドポイント（後方互換）
  fastify.all('/rpc/*', async (request, reply) => {
    await handleRPCRequest(legacyHandler, '/api/user/rpc', request, reply, fastify)
  })
}

export default rpcRoutes
