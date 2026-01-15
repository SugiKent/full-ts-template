/**
 * AsyncStorage キー定数
 */

export const STORAGE_KEYS = {
  /** オンボーディング完了フラグ */
  ONBOARDING_COMPLETED: '@wishlist/onboarding_completed',
  /** オンボーディング途中経過（復帰用） */
  ONBOARDING_STATE: '@wishlist/onboarding_state',
  /** デバイスID */
  DEVICE_ID: '@wishlist/device_id',
  /** 利用規約同意日時 */
  TERMS_ACCEPTED_DATE: '@wishlist/terms_accepted_date',
  /** 通知頻度設定 */
  NOTIFICATION_FREQUENCY: '@wishlist/notification_frequency',
  /** 選択されたカテゴリー */
  SELECTED_CATEGORIES: '@wishlist/selected_categories',
  /** ウィッシュリストアイテム */
  WISHLIST_ITEMS: '@wishlist/wishlist_items',
  /** 今月やること */
  MONTHLY_GOALS: '@wishlist/monthly_goals',
  /** テーマID */
  THEME_ID: '@wishlist/theme_id',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
