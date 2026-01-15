/**
 * ウィッシュリスト関連の型定義
 */

/** ステップ（アイテムに紐づく具体的なアクション） */
export interface Step {
  id: string
  title: string
  isCompleted: boolean
}

/** ステップ候補（AIが事前生成した未採用のステップ） */
export interface StepSuggestion {
  id: string
  itemId: string
  title: string
  description: string | null
  sortOrder: number
  createdAt: string
}

/** カテゴリー（ウィッシュリストアイテムを分類するグループ） */
export interface Category {
  id: string
  name: string
  icon: string // 絵文字
  /** UI専用: 意気込みコメント（APIには存在しない） */
  description?: string
}

/** ウィッシュリストアイテム */
export interface WishlistItem {
  id: string
  title: string
  categoryIds: string[]
  steps: Step[]
  /** AIが事前生成したステップ候補（Worker で非同期生成されるため、取得時点では空の場合あり） */
  suggestions: StepSuggestion[]
  isCompleted: boolean
  isMonthlyGoal: boolean // 「今月やること」に選択されているか
  createdAt: Date
  completedAt?: Date
}

/** カテゴリーとその配下のアイテムをまとめた表示用データ */
export interface CategoryWithItems {
  category: Category
  items: WishlistItem[]
}
