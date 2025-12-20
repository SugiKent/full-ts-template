/**
 * ロガー設定ユーティリティ
 *
 * Pinoロガーの設定を統一管理します。
 */

import type { LoggerOptions } from 'pino'
import pino from 'pino'

/**
 * ロガー設定を作成する
 *
 * @param name - ロガー名
 * @returns Pinoロガーオプション
 */
function createLoggerOptions(name: string): LoggerOptions {
  const options: LoggerOptions = {
    name,
    level: process.env.LOG_LEVEL || 'info',
  }

  // LOG_PRETTY が true の場合のみ transport を追加
  if (process.env.LOG_PRETTY === 'true') {
    options.transport = {
      target: 'pino-pretty',
    }
  }

  return options
}

/**
 * ロガーインスタンスを作成する
 *
 * @param name - ロガー名
 * @returns Pinoロガーインスタンス
 */
export function createLogger(name: string): pino.Logger {
  return pino(createLoggerOptions(name))
}

/**
 * Fastify用のロガーオプションを作成する
 *
 * @returns Fastifyロガーオプション
 */
export function createFastifyLoggerOptions(): LoggerOptions {
  const options: LoggerOptions = {
    level: process.env.LOG_LEVEL || 'info',
  }

  // LOG_PRETTY が true の場合のみ transport を追加
  if (process.env.LOG_PRETTY === 'true') {
    options.transport = {
      target: 'pino-pretty',
    }
  }

  return options
}

/**
 * デフォルトのロガーインスタンス
 */
export const logger = createLogger('app')
