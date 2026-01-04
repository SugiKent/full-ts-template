/**
 * Fastify サーバーエントリポイント
 *
 * プロジェクトに応じてルートやスケジューラーを追加してください
 */

// Sentry初期化は他のimportより先に行う（dotenvの後）
import 'dotenv/config'
import { initSentry, setupSentryFastifyErrorHandler } from './lib/sentry'

initSentry()

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import adminAuthPlugin from './plugins/admin-auth'
import adminRpcRoutes from './routes/admin/rpc.js'
import userRpcRoutes from './routes/user/rpc.js'
import { createFastifyLoggerOptions, createLogger } from './utils/logger'

const logger = createLogger('fastify-server')

// __dirname の ESM 対応
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Fastify サーバーインスタンスを作成
 */
async function createServer() {
  const fastify = Fastify({
    logger: createFastifyLoggerOptions(),
    disableRequestLogging: false,
    requestIdLogLabel: 'reqId',
  })

  // CORS設定
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173']

  await fastify.register(cors, {
    origin: (origin, callback) => {
      // オリジンが未定義の場合（同一オリジン）は許可
      if (!origin) {
        callback(null, true)
        return
      }

      // ngrokドメインを動的に許可
      const isNgrok =
        origin.includes('.ngrok-free.app') ||
        origin.includes('.ngrok-free.dev') ||
        origin.includes('.ngrok.io')

      // 許可リストまたはngrokドメインの場合は許可
      if (allowedOrigins.includes(origin) || isNgrok) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'), false)
      }
    },
    credentials: process.env.CORS_CREDENTIALS === 'true',
  })

  // セキュリティヘッダー（Helmet）
  await fastify.register(helmet, { global: true })

  // Rate limit（API ルートのみ）
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    allowList: (request) => {
      // 開発・テスト環境では rate limit をスキップ
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        return true
      }
      // /api/* 以外のリクエストは rate limit をスキップ
      const url = request.raw.url ?? ''
      return !url.startsWith('/api/')
    },
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded, retry in ${context.after}`,
    }),
  })

  // Sentry エラーハンドラー
  setupSentryFastifyErrorHandler(fastify)

  // 管理画面認証プラグイン
  await fastify.register(adminAuthPlugin)

  // Admin API ルート（oRPC）
  await fastify.register(adminRpcRoutes, { prefix: '/api/admin' })

  // User API ルート（oRPC）
  await fastify.register(userRpcRoutes, { prefix: '/api/user' })

  // 静的ファイル配信（React SPA）
  const distPath = join(__dirname, '../../dist')
  await fastify.register(fastifyStatic, {
    root: distPath,
    prefix: '/',
  })

  // ヘルスチェックエンドポイント
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }
  })

  // SPA フォールバック（React Router対応）
  fastify.setNotFoundHandler(async (request, reply) => {
    const isDevelopment = process.env.NODE_ENV !== 'production'

    // API リクエストの場合は 404 を返す
    if (request.url.startsWith('/api') || request.url.startsWith('/webhook')) {
      return reply.status(404).send({ error: 'Not Found' })
    }

    // SPA フォールバック
    if (isDevelopment) {
      // 開発環境: Vite dev server にリダイレクト
      return reply.redirect('http://localhost:5173/')
    }
    // 本番環境: ビルド済みの index.html を配信
    return reply.sendFile('client/index.html')
  })

  return fastify
}

/**
 * サーバーを起動
 */
async function start() {
  try {
    const fastify = await createServer()

    const host = process.env.HOST || '0.0.0.0'
    const port = Number(process.env.PORT) || 8080

    await fastify.listen({ host, port })

    logger.info(
      {
        host,
        port,
        nodeEnv: process.env.NODE_ENV,
      },
      'Server started successfully',
    )

    // TODO: プロジェクトに応じてスケジューラーを追加
    // 例:
    // cron.schedule('0 9 * * *', async () => {
    //   // 毎日9時に実行
    // }, { timezone: 'Asia/Tokyo' })
  } catch (error) {
    logger.error({ error }, 'Failed to start server')
    process.exit(1)
  }
}

// グレースフルシャットダウン
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...')
  process.exit(0)
})

// サーバー起動
start()
