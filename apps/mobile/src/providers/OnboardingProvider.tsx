/**
 * オンボーディング状態管理プロバイダー
 *
 * サーバーを SSOT（Single Source of Truth）として使用
 * オンボーディング中はメモリ（React state）で一時保持
 * 完了時にサーバーに一括保存
 */

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { ONBOARDING_STEP_ORDER, PRESET_CATEGORIES } from '@/constants/onboarding'
import { orpcClient } from '@/services/orpc-client'
import type {
  OnboardingContextValue,
  OnboardingItem,
  OnboardingState,
  OnboardingStepItem,
} from '@/types/onboarding'
import { useAuth } from './AuthProvider'

const initialState: OnboardingState = {
  currentStep: 'splash',
  isCompleted: false,
  termsAccepted: false,
  privacyAccepted: false,
  selectedCategoryIds: [],
  createdItems: [],
  monthlyGoalIds: [],
  selectedStepsByItem: {},
  isSyncing: false,
  syncError: null,
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined)

interface OnboardingProviderProps {
  children: ReactNode
}

/**
 * クライアント ID を生成
 */
function generateClientId(): string {
  return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 現在の月の初日を YYYY-MM-01 形式で取得
 */
function getCurrentMonthFirstDay(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState<OnboardingState>(initialState)
  const [isInitializing] = useState(false)

  // 利用規約同意
  const acceptTerms = useCallback((terms: boolean, privacy: boolean) => {
    setState((prev) => ({
      ...prev,
      termsAccepted: terms,
      privacyAccepted: privacy,
    }))
  }, [])

  // カテゴリー選択
  const selectCategories = useCallback((categoryIds: string[]) => {
    setState((prev) => ({
      ...prev,
      selectedCategoryIds: categoryIds,
    }))
  }, [])

  // アイテム追加
  const addItem = useCallback((item: Omit<OnboardingItem, 'id'>) => {
    const newItem: OnboardingItem = {
      ...item,
      id: generateClientId(),
    }
    setState((prev) => ({
      ...prev,
      createdItems: [...prev.createdItems, newItem],
    }))
  }, [])

  // アイテム削除
  const removeItem = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      createdItems: prev.createdItems.filter((item) => item.id !== itemId),
      monthlyGoalIds: prev.monthlyGoalIds.filter((id) => id !== itemId),
      selectedStepsByItem: Object.fromEntries(
        Object.entries(prev.selectedStepsByItem).filter(([key]) => key !== itemId),
      ),
    }))
  }, [])

  // 今月やること選択
  const selectMonthlyGoals = useCallback((itemIds: string[]) => {
    setState((prev) => ({
      ...prev,
      monthlyGoalIds: itemIds,
    }))
  }, [])

  // アイテムのステップ選択
  const selectStepsForItem = useCallback((itemId: string, steps: OnboardingStepItem[]) => {
    setState((prev) => ({
      ...prev,
      selectedStepsByItem: {
        ...prev.selectedStepsByItem,
        [itemId]: steps,
      },
    }))
  }, [])

  // AI ステップ提案を取得
  const fetchSuggestedSteps = useCallback(
    async (itemTitle: string, categoryIds?: string[]) => {
      if (!isAuthenticated) {
        throw new Error('Not authenticated')
      }

      const result = await orpcClient.ai.suggest({
        itemTitle,
        categoryIds,
      })

      if (!result.success) {
        throw new Error('Failed to fetch suggested steps')
      }

      return result.data.steps
    },
    [isAuthenticated],
  )

  // オンボーディング完了（サーバーに保存）
  const completeOnboarding = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated')
    }

    setState((prev) => ({ ...prev, isSyncing: true, syncError: null }))

    try {
      // サーバーに利用規約同意を記録（deviceId は認証コンテキストから取得される）
      if (state.termsAccepted && state.privacyAccepted) {
        await orpcClient.auth.agreeToTerms({})
      }

      // カテゴリーデータを構築
      const categories = state.selectedCategoryIds.map((id, idx) => {
        // プリセットカテゴリーから名前とアイコンを取得
        const preset = PRESET_CATEGORIES.find((cat) => cat.id === id)
        return {
          clientId: id,
          name: preset?.name ?? id,
          icon: preset?.icon,
          sortOrder: idx,
        }
      })

      // アイテムデータを構築
      const items = state.createdItems.map((item, idx) => ({
        clientId: item.id,
        title: item.title,
        categoryClientIds: item.categoryIds,
        sortOrder: idx,
      }))

      // ステップデータを構築
      const stepsByItem: Record<
        string,
        { clientId: string; title: string; description?: string; sortOrder: number }[]
      > = {}
      for (const [itemId, steps] of Object.entries(state.selectedStepsByItem)) {
        stepsByItem[itemId] = steps.map((step, idx) => ({
          clientId: step.id,
          title: step.title,
          ...(step.description !== undefined && { description: step.description }),
          sortOrder: idx,
        }))
      }

      // 月次目標データを構築
      const targetMonth = getCurrentMonthFirstDay()
      const monthlyGoals = state.monthlyGoalIds.map((itemId, idx) => {
        const item = state.createdItems.find((i) => i.id === itemId)
        return {
          clientId: generateClientId(),
          title: item?.title ?? '',
          targetMonth,
          itemClientId: itemId,
          sortOrder: idx,
        }
      })

      // サーバーに保存
      const result = await orpcClient.onboarding.completeOnboarding({
        categories,
        items,
        stepsByItem,
        monthlyGoals,
      })

      if (!result.success) {
        throw new Error('Failed to complete onboarding')
      }

      setState((prev) => ({
        ...prev,
        isCompleted: true,
        currentStep: 'completed',
        isSyncing: false,
      }))

      // React Query のキャッシュを無効化してから遷移
      // これにより OnboardingGate が最新のデータで判定できる
      await queryClient.invalidateQueries({ queryKey: ['needsOnboarding'] })

      // ホーム画面へ遷移
      router.replace('/(tabs)')
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Unknown error',
      }))
      throw error
    }
  }, [state, isAuthenticated, router, queryClient])

  // オンボーディングリセット（デバッグ用）
  const resetOnboarding = useCallback(async () => {
    setState(initialState)
  }, [])

  // 次のステップに進む
  const goToNextStep = useCallback(() => {
    const currentIndex = ONBOARDING_STEP_ORDER.indexOf(state.currentStep)
    const nextIndex = currentIndex + 1
    if (nextIndex < ONBOARDING_STEP_ORDER.length) {
      const nextStep = ONBOARDING_STEP_ORDER[nextIndex]
      if (nextStep) {
        setState((prev) => ({ ...prev, currentStep: nextStep }))

        // ルーティング
        if (nextStep === 'completed') {
          router.replace('/(tabs)')
        } else {
          router.push(`/(onboarding)/${nextStep}` as const)
        }
      }
    }
  }, [state.currentStep, router])

  // 前のステップに戻る
  const goToPreviousStep = useCallback(() => {
    const currentIndex = ONBOARDING_STEP_ORDER.indexOf(state.currentStep)
    const prevIndex = currentIndex - 1
    if (prevIndex >= 0) {
      const prevStep = ONBOARDING_STEP_ORDER[prevIndex]
      if (prevStep) {
        setState((prev) => ({ ...prev, currentStep: prevStep }))
        router.back()
      }
    }
  }, [state.currentStep, router])

  // 次に進めるかどうかの判定
  const canProceed = useMemo(() => {
    switch (state.currentStep) {
      case 'splash':
        return true
      case 'introduction':
        return true
      case 'terms':
        return state.termsAccepted && state.privacyAccepted
      case 'categories':
        return state.selectedCategoryIds.length > 0
      case 'items':
        return state.createdItems.length > 0
      case 'monthly-goals':
        return state.monthlyGoalIds.length > 0
      case 'steps':
        // 全ての月間目標にステップが選択されているか
        return state.monthlyGoalIds.every(
          (itemId) =>
            state.selectedStepsByItem[itemId] && state.selectedStepsByItem[itemId].length > 0,
        )
      default:
        return false
    }
  }, [state])

  const value: OnboardingContextValue = {
    state,
    isInitializing,
    acceptTerms,
    selectCategories,
    addItem,
    removeItem,
    selectMonthlyGoals,
    selectStepsForItem,
    completeOnboarding,
    resetOnboarding,
    goToNextStep,
    goToPreviousStep,
    canProceed,
    fetchSuggestedSteps,
  }

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}
