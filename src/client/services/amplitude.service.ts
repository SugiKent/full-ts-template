/**
 * Amplitude Analytics サービス
 *
 * ユーザー行動分析のためのイベントトラッキング基盤を提供する。
 * Autocapture 機能によりページビューと要素インタラクションを自動収集する。
 * Cookie同意状態に基づいてトラッキングを制御する。
 */
import * as amplitude from '@amplitude/analytics-browser'

const AMPLITUDE_API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY
const COOKIE_CONSENT_STORAGE_KEY = 'cookie-consent'

/** Amplitudeが初期化済みかどうか */
let isInitialized = false

/** トラッキングが有効かどうか */
let isTrackingEnabled = false

/**
 * localStorageからCookie同意状態を取得する
 */
function getStoredConsent(): 'all' | 'essential' | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
    if (!stored) return null

    const data = JSON.parse(stored) as { consent: 'all' | 'essential' }
    if (data.consent === 'all' || data.consent === 'essential') {
      return data.consent
    }
    return null
  } catch {
    return null
  }
}

/**
 * Cookie同意状態に基づいてトラッキングが許可されているか確認する
 */
function isAnalyticsAllowed(): boolean {
  const consent = getStoredConsent()
  return consent === 'all'
}

/**
 * Amplitude SDK を初期化する
 *
 * Cookie同意状態を確認し、「すべて許可」の場合のみ初期化する。
 * API キーが設定されていない場合は何もしない（開発環境対応）
 */
export function initAmplitude(): void {
  if (!AMPLITUDE_API_KEY) {
    console.info('[Amplitude] API key not set, tracking disabled')
    return
  }

  // Cookie同意を確認
  if (!isAnalyticsAllowed()) {
    console.info('[Amplitude] Cookie consent not granted, tracking disabled')
    isTrackingEnabled = false
    return
  }

  // 既に初期化済みの場合はトラッキングを有効化するだけ
  if (isInitialized) {
    isTrackingEnabled = true
    console.info('[Amplitude] Tracking re-enabled')
    return
  }

  amplitude.init(AMPLITUDE_API_KEY, {
    autocapture: {
      elementInteractions: true,
    },
  })

  isInitialized = true
  isTrackingEnabled = true
  console.info('[Amplitude] Initialized with autocapture enabled')
}

/**
 * Cookie同意状態の変更に応じてトラッキングを更新する
 *
 * 同意が付与された場合: Amplitudeを初期化（未初期化の場合）またはトラッキングを有効化
 * 同意が取り消された場合: トラッキングを無効化
 */
export function updateAmplitudeConsent(): void {
  if (!AMPLITUDE_API_KEY) return

  if (isAnalyticsAllowed()) {
    if (!isInitialized) {
      initAmplitude()
    } else {
      isTrackingEnabled = true
      console.info('[Amplitude] Tracking enabled based on consent')
    }
  } else {
    isTrackingEnabled = false
    console.info('[Amplitude] Tracking disabled based on consent')
  }
}

/**
 * トラッキングが有効かどうかを取得する
 */
export function isAmplitudeTrackingEnabled(): boolean {
  return isTrackingEnabled && isInitialized
}

/**
 * ユーザーIDを設定する（ログイン時に呼び出す）
 */
export function setAmplitudeUserId(userId: string): void {
  if (!AMPLITUDE_API_KEY || !isTrackingEnabled) return
  amplitude.setUserId(userId)
}

/**
 * ユーザーをリセットする（ログアウト時に呼び出す）
 */
export function resetAmplitudeUser(): void {
  if (!AMPLITUDE_API_KEY || !isTrackingEnabled) return
  amplitude.reset()
}

/**
 * カスタムイベントを送信する
 */
export function trackEvent(eventName: string, eventProperties?: Record<string, unknown>): void {
  if (!AMPLITUDE_API_KEY || !isTrackingEnabled) return
  amplitude.track(eventName, eventProperties)
}
