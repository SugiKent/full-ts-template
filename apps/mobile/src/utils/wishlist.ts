/**
 * ウィッシュリスト関連のユーティリティ関数
 */
import type { WishlistItem } from '@/types/wishlist'

/**
 * アイテムの完了ステップ数を取得
 */
export function getCompletedStepsCount(item: WishlistItem): number {
  return item.steps.filter((step) => step.isCompleted).length
}

/**
 * アイテムの進捗率を取得（0-100）
 */
export function getItemProgress(item: WishlistItem): number {
  if (item.steps.length === 0) return 0
  return Math.round((getCompletedStepsCount(item) / item.steps.length) * 100)
}

/**
 * 今月の残り日数を取得
 */
export function getRemainingDaysInMonth(): number {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return lastDay.getDate() - now.getDate()
}
