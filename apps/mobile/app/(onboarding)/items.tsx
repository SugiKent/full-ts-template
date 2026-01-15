/**
 * アイテム作成画面
 */

import { useRouter } from 'expo-router'
import { X } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PRESET_CATEGORIES } from '@/constants/onboarding'
import { useOnboarding } from '@/providers/OnboardingProvider'

export default function ItemsScreen() {
  const router = useRouter()
  const { state, addItem, removeItem } = useOnboarding()

  const [title, setTitle] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  // 選択されたカテゴリーのみ表示
  const availableCategories = PRESET_CATEGORIES.filter((c) =>
    state.selectedCategoryIds.includes(c.id),
  )

  const handleToggleCategory = useCallback((categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }, [])

  const handleAddItem = useCallback(() => {
    if (title.trim() && selectedCategoryIds.length > 0) {
      addItem({
        title: title.trim(),
        categoryIds: selectedCategoryIds,
      })
      setTitle('')
      setSelectedCategoryIds([])
    }
  }, [title, selectedCategoryIds, addItem])

  const handleContinue = useCallback(() => {
    if (state.createdItems.length > 0) {
      router.push('/(onboarding)/monthly-goals')
    }
  }, [state.createdItems, router])

  const isAddValid = title.trim().length > 0 && selectedCategoryIds.length > 0
  const isContinueValid = state.createdItems.length > 0

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-5 pt-10">
          <Animated.View entering={FadeInUp.delay(100).duration(400)}>
            {/* タイトル */}
            <Text className="mb-2 text-2xl font-bold text-stone-800">やりたいことを登録</Text>
            <Text className="mb-6 text-base text-stone-500">
              思いつくまま、自由に登録してください
            </Text>
          </Animated.View>

          {/* 入力エリア */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(400)}
            className="mb-4 rounded-xl bg-stone-50 p-4"
          >
            {/* テキスト入力 */}
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="やりたいことを入力..."
              placeholderTextColor="#9ca3af"
              className="mb-3 text-base text-stone-800"
              returnKeyType="done"
              onSubmitEditing={handleAddItem}
            />

            {/* カテゴリー選択 */}
            <View className="mb-3 flex-row flex-wrap">
              {availableCategories.map((category) => {
                const isSelected = selectedCategoryIds.includes(category.id)
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => handleToggleCategory(category.id)}
                    className={`mb-2 mr-2 flex-row items-center rounded-lg px-3 py-2 ${
                      isSelected ? 'bg-stone-700' : 'bg-stone-200'
                    }`}
                  >
                    <Text className="mr-1 text-sm">{category.icon}</Text>
                    <Text className={`text-sm ${isSelected ? 'text-white' : 'text-stone-600'}`}>
                      {category.name}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            {/* 追加ボタン */}
            <Pressable
              onPress={handleAddItem}
              disabled={!isAddValid}
              className={`items-center rounded-lg py-3 ${
                isAddValid ? 'bg-stone-800 active:bg-stone-700' : 'bg-stone-300'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${isAddValid ? 'text-white' : 'text-stone-500'}`}
              >
                もう1つ追加
              </Text>
            </Pressable>
          </Animated.View>

          {/* 作成済みアイテム一覧 */}
          {state.createdItems.length > 0 ? (
            <View className="flex-1">
              <Text className="mb-2 text-sm text-stone-500">
                {state.createdItems.length}件登録済み
              </Text>
              <FlatList
                data={state.createdItems}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const itemCategories = PRESET_CATEGORIES.filter((c) =>
                    item.categoryIds.includes(c.id),
                  )
                  return (
                    <Animated.View
                      exiting={FadeOut.duration(200)}
                      className="mb-2 flex-row items-center rounded-xl bg-stone-50 p-4"
                    >
                      <View className="flex-1">
                        <Text className="text-base font-medium text-stone-800">{item.title}</Text>
                        <View className="mt-1 flex-row">
                          {itemCategories.map((c) => (
                            <Text key={c.id} className="mr-1 text-xs text-stone-500">
                              {c.icon}
                            </Text>
                          ))}
                        </View>
                      </View>
                      <Pressable onPress={() => removeItem(item.id)} className="p-2" hitSlop={8}>
                        <X size={18} color="#9ca3af" />
                      </Pressable>
                    </Animated.View>
                  )
                }}
              />
            </View>
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="px-8 text-center text-sm text-stone-400">
                インスタで見つけた行きたい場所、習得したいスキル、体験したいことなど
              </Text>
            </View>
          )}
        </View>

        {/* 続行ボタン */}
        <View className="px-5 pb-6">
          <Pressable
            onPress={handleContinue}
            disabled={!isContinueValid}
            className={`items-center rounded-xl py-4 ${
              isContinueValid ? 'bg-stone-800 active:bg-stone-700' : 'bg-stone-300'
            }`}
          >
            <Text
              className={`text-base font-semibold ${
                isContinueValid ? 'text-white' : 'text-stone-500'
              }`}
            >
              次へ
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
