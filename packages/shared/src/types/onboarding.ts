/**
 * オンボーディング関連の型定義
 *
 * モバイルアプリとサーバー間で共有する型
 */

/**
 * 通知頻度
 */
export const NOTIFICATION_FREQUENCIES = ['daily', 'weekly', 'none'] as const
export type NotificationFrequency = (typeof NOTIFICATION_FREQUENCIES)[number]

/**
 * アイテム優先度
 */
export const ITEM_PRIORITIES = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
} as const
export type ItemPriority = (typeof ITEM_PRIORITIES)[keyof typeof ITEM_PRIORITIES]

/**
 * カテゴリー入力
 */
export type CategoryInput = {
  clientId: string
  name: string
  icon?: string
  color?: string
  sortOrder?: number
}

/**
 * ウィッシュリストアイテム入力
 */
export type WishlistItemInput = {
  clientId: string
  title: string
  description?: string
  targetDate?: string // ISO 8601形式
  priority?: ItemPriority
  categoryClientIds: string[]
  sortOrder?: number
}

/**
 * ステップ入力
 */
export type StepInput = {
  clientId: string
  title: string
  description?: string
  sortOrder?: number
}

/**
 * 月次目標入力
 */
export type MonthlyGoalInput = {
  clientId: string
  title: string
  targetMonth: string // YYYY-MM-01 形式
  itemClientId?: string
  sortOrder?: number
}

/**
 * オンボーディング完了リクエスト
 */
export type CompleteOnboardingInput = {
  categories: CategoryInput[]
  items: WishlistItemInput[]
  stepsByItem: Record<string, StepInput[]> // key: itemClientId
  monthlyGoals: MonthlyGoalInput[]
  notificationFrequency: NotificationFrequency
}

/**
 * ID マッピング
 */
export type IdMapping = Record<string, string> // clientId -> serverId

/**
 * オンボーディング完了レスポンス
 */
export type CompleteOnboardingResponse = {
  success: true
  data: {
    categoryIdMap: IdMapping
    itemIdMap: IdMapping
    stepIdMap: IdMapping
    monthlyGoalIdMap: IdMapping
  }
}

/**
 * AI ステップ提案リクエスト
 */
export type SuggestStepsInput = {
  itemTitle: string
  categoryIds?: string[]
  existingSteps?: string[]
  completedSteps?: string[]
}

/**
 * AI ステップ提案レスポンス
 */
export type SuggestStepsResponse = {
  success: true
  data: {
    steps: Array<{
      title: string
      description?: string
    }>
  }
}

/**
 * カテゴリー
 */
export type Category = {
  id: string
  name: string
  icon?: string
  color?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/**
 * ステップ
 */
export type Step = {
  id: string
  itemId: string
  title: string
  description?: string
  isCompleted: boolean
  completedAt?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/**
 * 月次目標
 */
export type MonthlyGoal = {
  id: string
  itemId?: string
  title: string
  targetMonth: string
  isCompleted: boolean
  completedAt?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/**
 * ウィッシュリストアイテム
 */
export type WishlistItem = {
  id: string
  title: string
  description?: string
  targetDate?: string
  priority: ItemPriority
  isCompleted: boolean
  completedAt?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
  categories: Category[]
  steps: Step[]
  monthlyGoals: MonthlyGoal[]
}

/**
 * ユーザー設定
 */
export type UserSettings = {
  id: string
  notificationFrequency: NotificationFrequency
  onboardingCompletedAt?: string
  createdAt: string
  updatedAt: string
}

/**
 * ホーム画面データ
 */
export type HomeData = {
  items: WishlistItem[]
  categories: Category[]
  settings?: UserSettings
}
