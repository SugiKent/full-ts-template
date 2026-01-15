/**
 * オンボーディング関連の型定義
 */

/**
 * オンボーディングのステップ
 */
export type OnboardingStep =
  | 'splash'
  | 'introduction'
  | 'terms'
  | 'categories'
  | 'items'
  | 'monthly-goals'
  | 'steps'
  | 'completed'

/**
 * オンボーディング中に作成するアイテム
 */
export interface OnboardingItem {
  id: string
  title: string
  categoryIds: string[]
}

/**
 * オンボーディング中に選択/作成するステップ
 */
export interface OnboardingStepItem {
  id: string
  title: string
  description?: string
}

/**
 * オンボーディングの状態
 */
export interface OnboardingState {
  /** 現在のステップ */
  currentStep: OnboardingStep
  /** オンボーディング完了フラグ */
  isCompleted: boolean
  /** 利用規約同意フラグ */
  termsAccepted: boolean
  /** プライバシーポリシー同意フラグ */
  privacyAccepted: boolean
  /** 選択されたカテゴリーID */
  selectedCategoryIds: string[]
  /** 作成されたアイテム */
  createdItems: OnboardingItem[]
  /** 今月やることに選択されたアイテムID */
  monthlyGoalIds: string[]
  /** アイテムごとの選択されたステップ */
  selectedStepsByItem: Record<string, OnboardingStepItem[]>
  /** サーバー同期中フラグ */
  isSyncing: boolean
  /** サーバー同期エラー */
  syncError: string | null
}

/**
 * オンボーディングコンテキストの値
 */
export interface OnboardingContextValue {
  /** 現在の状態 */
  state: OnboardingState
  /** 初期化中フラグ */
  isInitializing: boolean

  // Actions
  /** 利用規約同意を設定 */
  acceptTerms: (terms: boolean, privacy: boolean) => void
  /** カテゴリーを選択 */
  selectCategories: (categoryIds: string[]) => void
  /** アイテムを追加 */
  addItem: (item: Omit<OnboardingItem, 'id'>) => void
  /** アイテムを削除 */
  removeItem: (itemId: string) => void
  /** 今月やることを選択 */
  selectMonthlyGoals: (itemIds: string[]) => void
  /** アイテムのステップを選択 */
  selectStepsForItem: (itemId: string, steps: OnboardingStepItem[]) => void
  /** オンボーディングを完了（サーバーに保存） */
  completeOnboarding: () => Promise<void>
  /** オンボーディングをリセット（デバッグ用） */
  resetOnboarding: () => Promise<void>

  // Navigation helpers
  /** 次のステップに進む */
  goToNextStep: () => void
  /** 前のステップに戻る */
  goToPreviousStep: () => void
  /** 次に進めるかどうか */
  canProceed: boolean

  // API helpers
  /** AI ステップ提案を取得 */
  fetchSuggestedSteps: (
    itemTitle: string,
    categoryIds?: string[],
  ) => Promise<{ title: string; description?: string | undefined }[]>
}

/**
 * プリセットカテゴリーの型
 */
export interface PresetCategory {
  id: string
  name: string
  icon: string
}

/**
 * AIが提案するステップの型
 */
export interface ProposedStep {
  id: string
  title: string
  description?: string
}
