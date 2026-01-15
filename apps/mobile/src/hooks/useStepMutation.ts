/**
 * ステップ操作のカスタムフック
 *
 * orpcClient を使用してステップの作成・完了トグル・削除を行う
 * 楽観的更新ロジックを含む
 */
import { useCallback, useState } from 'react'
import { orpcClient } from '@/services/orpc-client'
import type { Step } from '@/types/wishlist'

interface UseStepMutationOptions {
  itemId: string
  onStepCreated?: (step: Step) => void
  onStepToggled?: (step: Step) => void
  onStepDeleted?: (stepId: string) => void
  onError?: (error: Error, operation: 'create' | 'toggle' | 'delete') => void
}

interface UseStepMutationReturn {
  createStep: (title: string) => Promise<Step | null>
  toggleStep: (stepId: string) => Promise<boolean>
  deleteStep: (stepId: string) => Promise<boolean>
  isCreating: boolean
  /** 複数同時トグル対応: トグル中のステップID */
  pendingToggleIds: Set<string>
  /** 複数同時削除対応: 削除中のステップID */
  pendingDeleteIds: Set<string>
  error: Error | null
}

/**
 * ステップ操作フック
 *
 * @param options - アイテムIDとコールバック関数
 * @returns 操作関数とローディング状態
 */
export function useStepMutation(options: UseStepMutationOptions): UseStepMutationReturn {
  const { itemId, onStepCreated, onStepToggled, onStepDeleted, onError } = options

  const [isCreating, setIsCreating] = useState(false)
  const [pendingToggleIds, setPendingToggleIds] = useState<Set<string>>(new Set())
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<Error | null>(null)

  /**
   * ステップを作成
   */
  const createStep = useCallback(
    async (title: string): Promise<Step | null> => {
      if (!title.trim()) return null

      setIsCreating(true)
      setError(null)

      try {
        const response = await orpcClient.step.create({
          itemId,
          title: title.trim(),
        })

        if (response.success) {
          const newStep: Step = {
            id: response.data.id,
            title: response.data.title,
            isCompleted: response.data.isCompleted,
          }
          onStepCreated?.(newStep)
          return newStep
        }
        return null
      } catch (err) {
        const error = err instanceof Error ? err : new Error('ステップの追加に失敗しました')
        setError(error)
        onError?.(error, 'create')
        return null
      } finally {
        setIsCreating(false)
      }
    },
    [itemId, onStepCreated, onError],
  )

  /**
   * ステップの完了状態をトグル
   */
  const toggleStep = useCallback(
    async (stepId: string): Promise<boolean> => {
      // 既にトグル中なら何もしない
      if (pendingToggleIds.has(stepId)) return false

      setPendingToggleIds((prev) => new Set(prev).add(stepId))
      setError(null)

      try {
        const response = await orpcClient.step.toggleComplete({ id: stepId })

        if (response.success) {
          const toggledStep: Step = {
            id: response.data.id,
            title: response.data.title,
            isCompleted: response.data.isCompleted,
          }
          onStepToggled?.(toggledStep)
          return true
        }
        return false
      } catch (err) {
        const error = err instanceof Error ? err : new Error('ステップの更新に失敗しました')
        setError(error)
        onError?.(error, 'toggle')
        return false
      } finally {
        setPendingToggleIds((prev) => {
          const next = new Set(prev)
          next.delete(stepId)
          return next
        })
      }
    },
    [pendingToggleIds, onStepToggled, onError],
  )

  /**
   * ステップを削除
   */
  const deleteStep = useCallback(
    async (stepId: string): Promise<boolean> => {
      // 既に削除中なら何もしない
      if (pendingDeleteIds.has(stepId)) return false

      setPendingDeleteIds((prev) => new Set(prev).add(stepId))
      setError(null)

      try {
        const response = await orpcClient.step.delete({ id: stepId })

        if (response.success) {
          onStepDeleted?.(stepId)
          return true
        }
        return false
      } catch (err) {
        const error = err instanceof Error ? err : new Error('ステップの削除に失敗しました')
        setError(error)
        onError?.(error, 'delete')
        return false
      } finally {
        setPendingDeleteIds((prev) => {
          const next = new Set(prev)
          next.delete(stepId)
          return next
        })
      }
    },
    [pendingDeleteIds, onStepDeleted, onError],
  )

  return {
    createStep,
    toggleStep,
    deleteStep,
    isCreating,
    pendingToggleIds,
    pendingDeleteIds,
    error,
  }
}
