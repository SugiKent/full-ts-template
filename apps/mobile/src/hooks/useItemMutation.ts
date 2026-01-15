/**
 * アイテム更新・削除のカスタムフック
 *
 * orpcClient を使用してアイテムの更新と削除を行う
 * ローディング状態とエラー処理を含む
 */
import { useCallback, useState } from 'react'
import { orpcClient } from '@/services/orpc-client'
import type { WishlistItem } from '@/types/wishlist'

interface UseItemMutationOptions {
  onSuccess?: (item?: WishlistItem) => void
  onError?: (error: Error) => void
}

interface UseItemMutationReturn {
  updateItem: (id: string, data: { title?: string }) => Promise<boolean>
  deleteItem: (id: string) => Promise<boolean>
  isUpdating: boolean
  isDeleting: boolean
  error: Error | null
}

/**
 * アイテム更新・削除フック
 *
 * @param options - コールバック関数
 * @returns 更新・削除関数とローディング状態
 */
export function useItemMutation(options?: UseItemMutationOptions): UseItemMutationReturn {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * アイテムを更新
   */
  const updateItem = useCallback(
    async (id: string, data: { title?: string }): Promise<boolean> => {
      setIsUpdating(true)
      setError(null)

      try {
        const response = await orpcClient.item.update({
          id,
          ...data,
        })

        if (response.success) {
          // API レスポンスを WishlistItem 形式に変換（簡易版）
          const updatedItem: WishlistItem = {
            id: response.data.id,
            title: response.data.title,
            categoryIds: response.data.categories.map((c) => c.id),
            steps: response.data.steps.map((s) => ({
              id: s.id,
              title: s.title,
              isCompleted: s.isCompleted,
            })),
            suggestions: response.data.suggestions.map((s) => ({
              id: s.id,
              itemId: s.itemId,
              title: s.title,
              description: s.description,
              sortOrder: s.sortOrder,
              createdAt: s.createdAt,
            })),
            isCompleted: response.data.isCompleted,
            isMonthlyGoal: response.data.monthlyGoals.length > 0,
            createdAt: new Date(response.data.createdAt),
            ...(response.data.completedAt && {
              completedAt: new Date(response.data.completedAt),
            }),
          }
          options?.onSuccess?.(updatedItem)
          return true
        }
        return false
      } catch (err) {
        const error = err instanceof Error ? err : new Error('アイテムの更新に失敗しました')
        setError(error)
        options?.onError?.(error)
        return false
      } finally {
        setIsUpdating(false)
      }
    },
    [options],
  )

  /**
   * アイテムを削除
   */
  const deleteItem = useCallback(
    async (id: string): Promise<boolean> => {
      setIsDeleting(true)
      setError(null)

      try {
        const response = await orpcClient.item.delete({ id })

        if (response.success) {
          options?.onSuccess?.()
          return true
        }
        return false
      } catch (err) {
        const error = err instanceof Error ? err : new Error('アイテムの削除に失敗しました')
        setError(error)
        options?.onError?.(error)
        return false
      } finally {
        setIsDeleting(false)
      }
    },
    [options],
  )

  return {
    updateItem,
    deleteItem,
    isUpdating,
    isDeleting,
    error,
  }
}
