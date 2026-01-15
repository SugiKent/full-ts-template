/**
 * カテゴリー選択画面
 */

import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PRESET_CATEGORIES } from '@/constants/onboarding'
import { useOnboarding } from '@/providers/OnboardingProvider'

export default function CategoriesScreen() {
  const router = useRouter()
  const { state, selectCategories } = useOnboarding()

  const [selectedIds, setSelectedIds] = useState<string[]>(state.selectedCategoryIds)

  const handleToggleCategory = useCallback(
    (categoryId: string) => {
      const newIds = selectedIds.includes(categoryId)
        ? selectedIds.filter((id) => id !== categoryId)
        : [...selectedIds, categoryId]
      setSelectedIds(newIds)
      selectCategories(newIds)
    },
    [selectedIds, selectCategories],
  )

  const handleContinue = useCallback(() => {
    if (selectedIds.length > 0) {
      router.push('/(onboarding)/items')
    }
  }, [selectedIds, router])

  const isValid = selectedIds.length > 0

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-5 pt-10">
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          {/* タイトル */}
          <Text className="mb-2 text-2xl font-bold text-stone-800">興味のあるカテゴリーを選択</Text>
          <Text className="mb-2 text-base text-stone-500">
            あなたのやりたいことに近いカテゴリーを選んでください
          </Text>
          <Text className="mb-6 text-sm text-stone-400">後から自由に追加・変更できます</Text>
        </Animated.View>

        {/* カテゴリーグリッド */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <Animated.View
            entering={FadeInUp.delay(200).duration(400)}
            className="flex-row flex-wrap"
          >
            {PRESET_CATEGORIES.map((category) => {
              const isSelected = selectedIds.includes(category.id)
              return (
                <Pressable
                  key={category.id}
                  onPress={() => handleToggleCategory(category.id)}
                  className={`mb-3 mr-3 flex-row items-center rounded-xl px-4 py-3 ${
                    isSelected ? 'bg-stone-800' : 'bg-stone-100'
                  }`}
                >
                  <Text className="mr-2 text-xl">{category.icon}</Text>
                  <Text
                    className={`text-base font-medium ${
                      isSelected ? 'text-white' : 'text-stone-700'
                    }`}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              )
            })}
          </Animated.View>
        </ScrollView>

        {/* 選択数表示 */}
        {selectedIds.length > 0 && (
          <View className="py-2">
            <Text className="text-center text-sm text-stone-500">{selectedIds.length}個選択中</Text>
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
