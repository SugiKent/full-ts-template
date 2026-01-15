/**
 * エラーレスポンスロギングプラグイン
 *
 * 200系以外のレスポンスが返された時に、レスポンスボディをログに出力する
 * これにより、エラーの原因を素早く特定できるようになる
 */

import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { createLayerLogger } from '../utils/logger.js'

const logger = createLayerLogger('plugin', 'error-response-logger')

/**
 * エラーレスポンスかどうかを判定
 */
function isErrorResponse(statusCode: number): boolean {
  return statusCode >= 400
}

/**
 * レスポンスボディをパース
 */
function parseResponseBody(payload: unknown): unknown {
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload)
    } catch {
      return payload
    }
  }
  return payload
}

/**
 * センシティブ情報をマスク
 */
function maskSensitiveFields(body: unknown): unknown {
  if (typeof body !== 'object' || body === null) {
    return body
  }

  const sensitiveFields = ['password', 'token', 'accessToken', 'secret', 'apiKey', 'authorization']
  const masked = { ...body } as Record<string, unknown>

  for (const field of sensitiveFields) {
    if (field in masked) {
      masked[field] = '[REDACTED]'
    }
  }

  return masked
}

const errorResponseLoggerPlugin: FastifyPluginAsync = async (fastify) => {
  // onSend フックでレスポンス送信前にログを出力
  fastify.addHook('onSend', async (request, reply, payload) => {
    const statusCode = reply.statusCode

    // エラーレスポンスの場合のみログ出力
    if (isErrorResponse(statusCode)) {
      const parsedBody = parseResponseBody(payload)
      const maskedBody = maskSensitiveFields(parsedBody)

      logger.warn(
        {
          statusCode,
          method: request.method,
          url: request.url,
          responseBody: maskedBody,
          reqId: request.id,
        },
        `Error response: ${statusCode} ${request.method} ${request.url}`,
      )
    }

    return payload
  })
}

export default fp(errorResponseLoggerPlugin, {
  name: 'error-response-logger',
  fastify: '5.x',
})
