/**
 * Sentry サーバー初期化
 *
 * 本番環境でのみSentryを初期化し、エラーを収集する。
 * 開発環境ではSentryへの送信は無効化される。
 */

import * as Sentry from '@sentry/node'

/**
 * Sentryが有効かどうかを判定
 */
function isSentryEnabled(): boolean {
  return process.env.NODE_ENV === 'production' && !!process.env.SENTRY_DSN
}

/**
 * Sentryを初期化する
 *
 * 本番環境かつSENTRY_DSNが設定されている場合のみ初期化される。
 * この関数は他のモジュールをimportする前に呼び出す必要がある。
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN
  if (isSentryEnabled() && dsn) {
    Sentry.init({
      dsn,
      environment: 'production',
      // トレースは将来の拡張として無効化
      tracesSampleRate: 0,
    })
  }
}

/**
 * FastifyにSentryエラーハンドラーを設定する
 *
 * 本番環境でのみエラーハンドラーを登録する。
 * 型の互換性のためanyを使用（Sentry SDKとFastifyの型定義の不整合）
 */
// biome-ignore lint/suspicious/noExplicitAny: Sentry SDKとFastifyの型定義の互換性のため
export function setupSentryFastifyErrorHandler(fastify: any): void {
  if (isSentryEnabled()) {
    Sentry.setupFastifyErrorHandler(fastify)
  }
}

/**
 * Sentryコンテキスト
 */
export interface SentryContext {
  [key: string]: unknown
}

/**
 * エラーをSentryに送信する
 *
 * 本番環境でのみSentryにエラーを送信する。
 * 開発環境では何もしない。
 *
 * @param error - キャプチャするエラー
 * @param context - 追加のコンテキスト情報（オプション）
 */
export function captureException(error: unknown, context?: SentryContext): void {
  if (isSentryEnabled()) {
    if (context) {
      Sentry.captureException(error, { extra: context })
    } else {
      Sentry.captureException(error)
    }
  }
}

/**
 * Sentryのイベントをフラッシュする
 *
 * プロセス終了前にSentryに送信するイベントをフラッシュする。
 *
 * @param timeout - フラッシュのタイムアウト（ミリ秒）
 */
export async function flush(timeout: number = 2000): Promise<boolean> {
  if (isSentryEnabled()) {
    return Sentry.flush(timeout)
  }
  return true
}
