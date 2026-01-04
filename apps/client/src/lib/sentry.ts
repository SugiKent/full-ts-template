/**
 * Sentry クライアント初期化
 *
 * 本番環境でのみSentryを初期化し、エラーを収集する。
 * 開発環境ではSentryへの送信は無効化される。
 */

import * as Sentry from '@sentry/react'
import type { RootOptions } from 'react-dom/client'

/**
 * Sentryを初期化する
 *
 * 本番環境かつVITE_SENTRY_DSNが設定されている場合のみ初期化される。
 */
export function initSentry(): void {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: 'production',
      // トレース・リプレイは将来の拡張として無効化
      tracesSampleRate: 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    })
  }
}

/**
 * React 19のcreateRootオプション用エラーハンドラーを取得する
 *
 * 本番環境ではSentryのエラーハンドラーを返し、
 * 開発環境ではundefinedを返す（デフォルト動作）。
 */
export function getSentryErrorHandlers(): Pick<RootOptions, 'onUncaughtError' | 'onCaughtError'> {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    return {
      onUncaughtError: Sentry.reactErrorHandler() as RootOptions['onUncaughtError'],
      onCaughtError: Sentry.reactErrorHandler() as RootOptions['onCaughtError'],
    }
  }
  return {}
}
