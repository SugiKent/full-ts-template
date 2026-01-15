/**
 * API フック
 *
 * oRPC クライアントを使用した API 呼び出しフック
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orpcClient } from '@/services/orpc-client'

/**
 * ホーム画面データ取得フック
 */
export function useHomeData() {
  return useQuery({
    queryKey: ['homeData'],
    queryFn: async () => {
      const result = await orpcClient.onboarding.getHomeData()
      if (!result.success) {
        throw new Error('Failed to fetch home data')
      }
      return result.data
    },
  })
}

/**
 * オンボーディング必要判定フック
 *
 * @param enabled - クエリを実行するかどうか（デフォルト: true）
 *                  認証完了後にのみ呼び出すように制御するために使用
 */
export function useNeedsOnboarding(enabled = true) {
  return useQuery({
    queryKey: ['needsOnboarding'],
    queryFn: async () => {
      const result = await orpcClient.onboarding.needsOnboarding()
      if (!result.success) {
        throw new Error('Failed to check onboarding status')
      }
      return result.data
    },
    enabled,
  })
}

/**
 * カテゴリー一覧取得フック
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await orpcClient.category.list()
      if (!result.success) {
        throw new Error('Failed to fetch categories')
      }
      return result.data
    },
  })
}

/**
 * カテゴリー作成フック
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; icon?: string; color?: string }) => {
      const result = await orpcClient.category.create(data)
      if (!result.success) {
        throw new Error('Failed to create category')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['homeData'] })
    },
  })
}

/**
 * カテゴリー更新フック
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      id: string
      name?: string
      icon?: string | null
      color?: string | null
    }) => {
      const result = await orpcClient.category.update(data)
      if (!result.success) {
        throw new Error('Failed to update category')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['homeData'] })
    },
  })
}

/**
 * カテゴリー削除フック
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await orpcClient.category.delete({ id })
      if (!result.success) {
        throw new Error('Failed to delete category')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['homeData'] })
    },
  })
}

/**
 * アイテム一覧取得フック
 */
export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const result = await orpcClient.item.list()
      if (!result.success) {
        throw new Error('Failed to fetch items')
      }
      return result.data
    },
  })
}

/**
 * アイテム取得フック
 */
export function useItem(id: string) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const result = await orpcClient.item.get({ id })
      if (!result.success) {
        throw new Error('Failed to fetch item')
      }
      return result.data
    },
    enabled: !!id,
  })
}

/**
 * アイテム作成フック
 */
export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      title: string
      description?: string
      targetDate?: string
      priority?: 0 | 1 | 2
      categoryIds?: string[]
    }) => {
      const result = await orpcClient.item.create(data)
      if (!result.success) {
        throw new Error('Failed to create item')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['homeData'] })
    },
  })
}

/**
 * アイテム更新フック
 */
export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      id: string
      title?: string
      description?: string | null
      targetDate?: string | null
      priority?: 0 | 1 | 2
      categoryIds?: string[]
    }) => {
      const result = await orpcClient.item.update(data)
      if (!result.success) {
        throw new Error('Failed to update item')
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['item', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['homeData'] })
    },
  })
}

/**
 * アイテム完了切り替えフック
 */
export function useToggleItemComplete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await orpcClient.item.toggleComplete({ id })
      if (!result.success) {
        throw new Error('Failed to toggle item completion')
      }
      return result.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['item', id] })
      queryClient.invalidateQueries({ queryKey: ['homeData'] })
    },
  })
}

/**
 * アイテム削除フック
 */
export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await orpcClient.item.delete({ id })
      if (!result.success) {
        throw new Error('Failed to delete item')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['homeData'] })
    },
  })
}

/**
 * ステップ作成フック
 */
export function useCreateStep() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { itemId: string; title: string; description?: string }) => {
      const result = await orpcClient.step.create(data)
      if (!result.success) {
        throw new Error('Failed to create step')
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['item', variables.itemId] })
      queryClient.invalidateQueries({ queryKey: ['homeData'] })
    },
  })
}

/**
 * ステップ完了切り替えフック
 */
export function useToggleStepComplete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await orpcClient.step.toggleComplete({ id })
      if (!result.success) {
        throw new Error('Failed to toggle step completion')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['homeData'] })
    },
  })
}

/**
 * ステップ削除フック
 */
export function useDeleteStep() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await orpcClient.step.delete({ id })
      if (!result.success) {
        throw new Error('Failed to delete step')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['homeData'] })
    },
  })
}

/**
 * 月次目標一覧取得フック
 */
export function useMonthlyGoals(targetMonth?: string) {
  return useQuery({
    queryKey: ['monthlyGoals', targetMonth],
    queryFn: async () => {
      const result = await orpcClient.monthlyGoal.list(targetMonth ? { targetMonth } : undefined)
      if (!result.success) {
        throw new Error('Failed to fetch monthly goals')
      }
      return result.data
    },
  })
}

/**
 * 月次目標作成フック
 */
export function useCreateMonthlyGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { title: string; targetMonth: string; itemId?: string }) => {
      const result = await orpcClient.monthlyGoal.create(data)
      if (!result.success) {
        throw new Error('Failed to create monthly goal')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] })
      queryClient.invalidateQueries({ queryKey: ['homeData'] })
    },
  })
}

/**
 * 月次目標完了切り替えフック
 */
export function useToggleMonthlyGoalComplete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await orpcClient.monthlyGoal.toggleComplete({ id })
      if (!result.success) {
        throw new Error('Failed to toggle monthly goal completion')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] })
      queryClient.invalidateQueries({ queryKey: ['homeData'] })
    },
  })
}

/**
 * 月次目標削除フック
 */
export function useDeleteMonthlyGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await orpcClient.monthlyGoal.delete({ id })
      if (!result.success) {
        throw new Error('Failed to delete monthly goal')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] })
      queryClient.invalidateQueries({ queryKey: ['homeData'] })
    },
  })
}

/**
 * AI ステップ提案フック（レガシー、オンボーディング用）
 */
export function useSuggestSteps() {
  return useMutation({
    mutationFn: async (data: {
      itemTitle: string
      categoryIds?: string[]
      existingSteps?: string[]
      completedSteps?: string[]
    }) => {
      const result = await orpcClient.ai.suggest(data)
      if (!result.success) {
        throw new Error('Failed to suggest steps')
      }
      return result.data.steps
    },
  })
}

// ========================================
// ステップ候補関連フック
// ========================================

/**
 * ステップ候補一覧取得フック
 */
export function useStepSuggestions(itemId: string) {
  return useQuery({
    queryKey: ['stepSuggestions', itemId],
    queryFn: async () => {
      const result = await orpcClient.ai.listByItemId({ itemId })
      if (!result.success) {
        throw new Error('Failed to fetch step suggestions')
      }
      return result.data
    },
    enabled: !!itemId,
  })
}

/**
 * ステップ候補採用フック
 *
 * 候補を採用して正式なステップに変換
 */
export function useAdoptSuggestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const result = await orpcClient.ai.adopt({ suggestionId })
      if (!result.success) {
        throw new Error('Failed to adopt suggestion')
      }
      return result.data
    },
    onSuccess: () => {
      // 関連するキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['stepSuggestions'] })
      queryClient.invalidateQueries({ queryKey: ['homeData'] })
    },
  })
}

/**
 * ステップ候補却下フック
 *
 * 候補を削除（採用しない）
 */
export function useDismissSuggestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const result = await orpcClient.ai.dismiss({ suggestionId })
      if (!result.success) {
        throw new Error('Failed to dismiss suggestion')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stepSuggestions'] })
    },
  })
}

/**
 * ステップ候補再生成フック
 *
 * 既存の候補をすべて削除して新規に生成
 */
export function useRegenerateSuggestions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: string) => {
      const result = await orpcClient.ai.regenerate({ itemId })
      if (!result.success) {
        throw new Error('Failed to regenerate suggestions')
      }
      return result
    },
    onSuccess: (_, itemId) => {
      // 候補は Worker で非同期生成されるため、ここではキャッシュ無効化のみ
      queryClient.invalidateQueries({ queryKey: ['stepSuggestions', itemId] })
    },
  })
}

// ========================================
// デバイス認証関連フック
// ========================================

/**
 * デバイス状態取得フック
 *
 * デバッグ画面でデバイス情報を表示するために使用
 */
export function useDeviceStatus(deviceId: string) {
  return useQuery({
    queryKey: ['deviceStatus', deviceId],
    queryFn: async () => {
      const result = await orpcClient.auth.getDeviceStatus({ deviceId })
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to get device status')
      }
      return result.device
    },
    enabled: !!deviceId,
  })
}

/**
 * デバイスデータ削除フック
 *
 * デバッグ画面からデバイスに紐づくすべてのデータを削除するために使用
 * 成功時のローカルストレージクリアは呼び出し側で処理する
 */
export function useDeleteDeviceData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const result = await orpcClient.auth.deleteDeviceData()
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to delete device data')
      }
      return result
    },
    onSuccess: () => {
      // すべてのキャッシュをクリア
      queryClient.clear()
    },
  })
}

// ========================================
// タイムライン関連フック
// ========================================

/**
 * タイムライン取得フック
 *
 * ジャーナルエントリー + 完了ログを統合して時系列で取得
 */
export function useTimeline(cursor?: string) {
  return useQuery({
    queryKey: ['timeline', cursor],
    queryFn: async () => {
      const result = await orpcClient.timeline.getTimeline(
        cursor ? { cursor, limit: 50 } : { limit: 50 },
      )
      if (!result.success) {
        throw new Error('Failed to fetch timeline')
      }
      return result.data
    },
  })
}

/**
 * ジャーナルエントリー作成フック
 */
export function useCreateJournalEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { title?: string; content: string }) => {
      const result = await orpcClient.timeline.createJournalEntry(data)
      if (!result.success) {
        throw new Error('Failed to create journal entry')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
    },
  })
}

/**
 * ジャーナルエントリー更新フック
 */
export function useUpdateJournalEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { id: string; title?: string | null; content?: string }) => {
      const result = await orpcClient.timeline.updateJournalEntry(data)
      if (!result.success) {
        throw new Error('Failed to update journal entry')
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
    },
  })
}

/**
 * ジャーナルエントリー削除フック
 */
export function useDeleteJournalEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await orpcClient.timeline.deleteJournalEntry({ id })
      if (!result.success) {
        throw new Error('Failed to delete journal entry')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
    },
  })
}
