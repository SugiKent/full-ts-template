/**
 * ステップ選択画面
 * 各目標に対してAI提案のステップを選択
 */

import { Check, Sparkles } from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ADDITIONAL_STEPS_COUNT,
  getMockStepsForItem,
  INITIAL_STEPS_COUNT,
  PRESET_CATEGORIES,
} from '@/constants/onboarding'
import { useOnboarding } from '@/providers/OnboardingProvider'

export default function StepsScreen() {
  const { state, selectStepsForItem, completeOnboarding } = useOnboarding()

  // 現在設定中のアイテムインデックス
  const [currentItemIndex, setCurrentItemIndex] = useState(0)

  // 表示するステップ数（初期5、追加で増える）
  const [visibleStepsCount, setVisibleStepsCount] = useState(INITIAL_STEPS_COUNT)

  // ローディング状態
  const [isLoading, setIsLoading] = useState(false)

  // 現在のアイテム
  const monthlyGoalItems = useMemo(
    () => state.createdItems.filter((item) => state.monthlyGoalIds.includes(item.id)),
    [state.createdItems, state.monthlyGoalIds],
  )

  const currentItem = monthlyGoalItems[currentItemIndex]

  // モックステップを取得
  const allSteps = useMemo(() => {
    if (!currentItem) return []
    return getMockStepsForItem(currentItem.categoryIds)
  }, [currentItem])

  const visibleSteps = allSteps.slice(0, visibleStepsCount)

  // 現在のアイテムの選択されたステップ
  const selectedSteps = useMemo(() => {
    return currentItem ? state.selectedStepsByItem[currentItem.id] || [] : []
  }, [currentItem, state.selectedStepsByItem])

  // 選択されたステップのIDセット（高速な検索用）
  const selectedStepIds = useMemo(() => {
    return new Set(selectedSteps.map((s) => s.id))
  }, [selectedSteps])

  const handleToggleStep = useCallback(
    (step: { id: string; title: string; description?: string }) => {
      if (!currentItem) return

      const isSelected = selectedStepIds.has(step.id)
      const newStep = {
        id: step.id,
        title: step.title,
        ...(step.description !== undefined && { description: step.description }),
      }
      const newSelectedSteps = isSelected
        ? selectedSteps.filter((s) => s.id !== step.id)
        : [...selectedSteps, newStep]

      selectStepsForItem(currentItem.id, newSelectedSteps)
    },
    [currentItem, selectedSteps, selectedStepIds, selectStepsForItem],
  )

  const handleMoreSteps = useCallback(() => {
    setVisibleStepsCount((prev) => Math.min(prev + ADDITIONAL_STEPS_COUNT, allSteps.length))
  }, [allSteps.length])

  const handleContinue = useCallback(async () => {
    if (currentItemIndex < monthlyGoalItems.length - 1) {
      // 次のアイテムへ
      setCurrentItemIndex((prev) => prev + 1)
      setVisibleStepsCount(INITIAL_STEPS_COUNT)
    } else {
      // 全アイテム完了、オンボーディングを完了
      setIsLoading(true)
      try {
        await completeOnboarding()
      } catch (error) {
        console.error('Failed to complete onboarding:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }, [currentItemIndex, monthlyGoalItems.length, completeOnboarding])

  const isLastItem = currentItemIndex === monthlyGoalItems.length - 1
  const isValid = selectedSteps.length > 0
  const canShowMore = visibleStepsCount < allSteps.length

  if (!currentItem) {
    return null
  }

  const itemCategories = PRESET_CATEGORIES.filter((c) => currentItem.categoryIds.includes(c.id))

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-5 pt-10">
        {/* ヘッダー */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          {/* 進捗 */}
          <Text className="mb-2 text-sm text-stone-500">
            {currentItemIndex + 1}/{monthlyGoalItems.length}
          </Text>

          {/* タイトル */}
          <Text className="mb-1 text-2xl font-bold text-stone-800">ステップを選択</Text>
          <Text className="mb-4 text-base text-stone-500">「{currentItem.title}」の第一歩</Text>

          {/* カテゴリー */}
          <View className="mb-6 flex-row">
            {itemCategories.map((c) => (
              <View
                key={c.id}
                className="mr-2 flex-row items-center rounded-lg bg-stone-100 px-3 py-1"
              >
                <Text className="mr-1 text-sm">{c.icon}</Text>
                <Text className="text-sm text-stone-600">{c.name}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ステップ提案セクション */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} className="mb-4">
          <View className="mb-3 flex-row items-center">
            <Sparkles size={16} color="#78716c" />
            <Text className="ml-2 text-sm font-medium text-stone-600">おすすめのステップ</Text>
          </View>
          <Text className="mb-4 text-xs text-stone-400">低ハードルな一歩から始めましょう</Text>
        </Animated.View>

        {/* ステップ一覧 */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {visibleSteps.map((step, index) => {
            const isSelected = selectedStepIds.has(step.id)
            return (
              <Animated.View
                key={step.id}
                entering={FadeInUp.delay(250 + index * 50).duration(400)}
              >
                <Pressable
                  onPress={() => handleToggleStep(step)}
                  className={`mb-3 flex-row items-center rounded-xl p-4 ${
                    isSelected ? 'border-2 border-stone-800 bg-stone-50' : 'bg-stone-50'
                  }`}
                >
                  {/* チェックボックス */}
                  <View
                    className={`mr-4 h-6 w-6 items-center justify-center rounded-md ${
                      isSelected ? 'bg-stone-800' : 'border-2 border-stone-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check size={14} color="white" />}
                  </View>

                  {/* ステップタイトル */}
                  <Text className="flex-1 text-base text-stone-800">{step.title}</Text>
                </Pressable>
              </Animated.View>
            )
          })}

          {/* もっとやれる！ボタン */}
          {canShowMore && (
            <Pressable
              onPress={handleMoreSteps}
              className="mb-4 flex-row items-center justify-center rounded-xl border-2 border-dashed border-stone-300 py-4"
            >
              <Sparkles size={18} color="#78716c" />
              <Text className="ml-2 text-base font-medium text-stone-600">もっとやれる！</Text>
            </Pressable>
          )}
        </ScrollView>

        {/* 選択数表示 */}
        {selectedSteps.length > 0 && (
          <View className="py-2">
            <Text className="text-center text-sm text-stone-500">
              {selectedSteps.length}個選択中
            </Text>
          </View>
        )}
      </View>

      {/* 続行ボタン */}
      <View className="px-5 pb-6">
        <Pressable
          onPress={handleContinue}
          disabled={!isValid || isLoading}
          className={`items-center rounded-xl py-4 ${
            isValid && !isLoading ? 'bg-stone-800 active:bg-stone-700' : 'bg-stone-300'
          }`}
        >
          <Text
            className={`text-base font-semibold ${
              isValid && !isLoading ? 'text-white' : 'text-stone-500'
            }`}
          >
            {isLoading ? '...' : isLastItem ? '始める' : '次へ'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
