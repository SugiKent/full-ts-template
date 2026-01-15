/**
 * 今月やること選択画面
 */

import { useRouter } from 'expo-router'
import { Check } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MAX_MONTHLY_GOALS, PRESET_CATEGORIES } from '@/constants/onboarding'
import { useOnboarding } from '@/providers/OnboardingProvider'

export default function MonthlyGoalsScreen() {
  const router = useRouter()
  const { state, selectMonthlyGoals } = useOnboarding()

  const [selectedIds, setSelectedIds] = useState<string[]>(state.monthlyGoalIds)

  const handleToggleItem = useCallback(
    (itemId: string) => {
      setSelectedIds((prev) => {
        let newIds: string[]
        if (prev.includes(itemId)) {
          newIds = prev.filter((id) => id !== itemId)
        } else if (prev.length < MAX_MONTHLY_GOALS) {
          newIds = [...prev, itemId]
        } else {
          // 最大数に達している場合は追加しない
          return prev
        }
        selectMonthlyGoals(newIds)
        return newIds
      })
    },
    [selectMonthlyGoals],
  )

  const handleContinue = useCallback(() => {
    if (selectedIds.length > 0) {
      router.push('/(onboarding)/steps')
    }
  }, [selectedIds, router])

  const isValid = selectedIds.length > 0
  const isMaxReached = selectedIds.length >= MAX_MONTHLY_GOALS

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-5 pt-10">
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          {/* タイトル */}
          <Text className="mb-2 text-2xl font-bold text-stone-800">今月やることを選択</Text>
          <Text className="mb-6 text-base text-stone-500">
            今月集中して取り組む目標を選んでください
          </Text>
        </Animated.View>

        {/* 選択数表示 */}
        <Animated.View entering={FadeInUp.delay(150).duration(400)} className="mb-4">
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-base font-medium ${
                isMaxReached ? 'text-amber-600' : 'text-stone-600'
              }`}
            >
              {selectedIds.length}/10 選択中
            </Text>
            {isMaxReached && (
              <Text className="text-sm text-amber-600">最大10個まで選択できます</Text>
            )}
          </View>
        </Animated.View>

        {/* アイテム一覧 */}
        {state.createdItems.length > 0 ? (
          <FlatList
            data={state.createdItems}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const isSelected = selectedIds.includes(item.id)
              const itemCategories = PRESET_CATEGORIES.filter((c) =>
                item.categoryIds.includes(c.id),
              )
              const isDisabled = !isSelected && isMaxReached

              return (
                <Animated.View entering={FadeInUp.delay(200 + index * 50).duration(400)}>
                  <Pressable
                    onPress={() => handleToggleItem(item.id)}
                    disabled={isDisabled}
                    className={`mb-3 flex-row items-center rounded-xl p-4 ${
                      isSelected
                        ? 'border-2 border-stone-800 bg-stone-50'
                        : isDisabled
                          ? 'bg-stone-100 opacity-50'
                          : 'bg-stone-50'
                    }`}
                  >
                    {/* チェックボックス */}
                    <View
                      className={`mr-4 h-6 w-6 items-center justify-center rounded-full ${
                        isSelected ? 'bg-stone-800' : 'border-2 border-stone-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check size={14} color="white" />}
                    </View>

                    {/* アイテム情報 */}
                    <View className="flex-1">
                      <Text
                        className={`text-base font-medium ${
                          isDisabled ? 'text-stone-400' : 'text-stone-800'
                        }`}
                      >
                        {item.title}
                      </Text>
                      <View className="mt-1 flex-row">
                        {itemCategories.map((c) => (
                          <Text key={c.id} className="mr-1 text-xs text-stone-500">
                            {c.icon} {c.name}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              )
            }}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-center text-sm text-stone-400">
              作成したアイテムから選択してください
            </Text>
          </View>
        )}
      </View>

      {/* 続行ボタン */}
      <View className="px-5 pb-6">
        <Pressable
          onPress={handleContinue}
          disabled={!isValid}
          className={`items-center rounded-xl py-4 ${
            isValid ? 'bg-stone-800 active:bg-stone-700' : 'bg-stone-300'
          }`}
        >
          <Text className={`text-base font-semibold ${isValid ? 'text-white' : 'text-stone-500'}`}>
            次へ
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
