/**
 * AIステップ提案のカスタムフック
 *
 * orpcClient を使用してAIによるステップ提案を取得
 * ローディング状態とフォールバック処理を含む
 */
import { useCallback, useState } from 'react'
import { orpcClient } from '@/services/orpc-client'

/** AI提案されたステップ */
export interface SuggestedStep {
  title: string
  description?: string | null
}

interface UseAiSuggestionOptions {
  onSuccess?: (suggestions: SuggestedStep[]) => void
  onError?: (error: Error) => void
}

interface SuggestParams {
  itemTitle: string
  categoryIds?: string[]
  existingSteps?: string[]
  completedSteps?: string[]
}

interface UseAiSuggestionReturn {
  suggest: (params: SuggestParams) => Promise<SuggestedStep[]>
  suggestions: SuggestedStep[]
  isLoading: boolean
  error: Error | null
  clearSuggestions: () => void
}

/**
 * AIステップ提案フック
 *
 * @param options - コールバック関数
 * @returns 提案取得関数と状態
 */
export function useAiSuggestion(options?: UseAiSuggestionOptions): UseAiSuggestionReturn {
  const [suggestions, setSuggestions] = useState<SuggestedStep[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * AIでステップを提案
   */
  const suggest = useCallback(
    async (params: SuggestParams): Promise<SuggestedStep[]> => {
      setIsLoading(true)
      setError(null)
      setSuggestions([])

      try {
        const response = await orpcClient.ai.suggest({
          itemTitle: params.itemTitle,
          categoryIds: params.categoryIds ?? [],
          existingSteps: params.existingSteps ?? [],
          completedSteps: params.completedSteps ?? [],
        })

        if (response.success) {
          const newSuggestions: SuggestedStep[] = response.data.steps.map((s) => ({
            title: s.title,
            description: s.description ?? null,
          }))
          setSuggestions(newSuggestions)
          options?.onSuccess?.(newSuggestions)
          return newSuggestions
        }
        return []
      } catch (err) {
        const error = err instanceof Error ? err : new Error('AI提案の取得に失敗しました')
        setError(error)
        options?.onError?.(error)
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [options],
  )

  /**
   * 提案をクリア
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    setError(null)
  }, [])

  return {
    suggest,
    suggestions,
    isLoading,
    error,
    clearSuggestions,
  }
}
