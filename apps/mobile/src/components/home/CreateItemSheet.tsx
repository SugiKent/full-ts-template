import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet'
import { Check, Plus, X } from 'lucide-react-native'
import { forwardRef, useCallback, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { useCategories, useCreateItem } from '@/hooks/useApi'
import type { Category } from '@/types/wishlist'
import { CreateCategorySheet } from './CreateCategorySheet'

interface CreateItemSheetProps {
  onClose: () => void
  onItemCreated?: () => void
}

/**
 * ウィッシュリストアイテム作成シートモーダル
 * ハーフシートでタイトル入力とカテゴリー選択
 */
export const CreateItemSheet = forwardRef<BottomSheetModal, CreateItemSheetProps>(
  ({ onClose, onItemCreated }, ref) => {
    const createCategorySheetRef = useRef<BottomSheetModal>(null)

    const [title, setTitle] = useState('')
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

    // API フック
    const { data: categoriesData, isLoading: isCategoriesLoading } = useCategories()
    const createItemMutation = useCreateItem()

    // API カテゴリーを UI 型に変換
    const categories: Category[] = useMemo(
      () =>
        categoriesData?.map((cat) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon ?? '📦',
        })) ?? [],
      [categoriesData],
    )

    // スナップポイント: 65%（キーボード表示時に拡張）
    const snapPoints = useMemo(() => ['65%', '90%'], [])

    // 背景のオーバーレイ
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
      ),
      [],
    )

    // カテゴリー選択のトグル
    const handleCategoryToggle = useCallback((categoryId: string) => {
      setSelectedCategoryIds((prev) =>
        prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
      )
    }, [])

    // 新規カテゴリー作成シートを開く
    const handleOpenCreateCategory = useCallback(() => {
      createCategorySheetRef.current?.present()
    }, [])

    // 新規カテゴリー作成完了（CreateCategorySheetから呼ばれる）
    const handleCategoryCreated = useCallback((categoryId: string) => {
      // 新しいカテゴリーを選択状態にする
      setSelectedCategoryIds((prev) => [...prev, categoryId])
    }, [])

    // フォームリセット
    const resetForm = useCallback(() => {
      setTitle('')
      setSelectedCategoryIds([])
    }, [])

    // 作成ボタン押下（API経由）
    const handleCreate = useCallback(async () => {
      if (title.trim() && selectedCategoryIds.length > 0) {
        try {
          await createItemMutation.mutateAsync({
            title: title.trim(),
            categoryIds: selectedCategoryIds,
          })
          resetForm()
          onItemCreated?.()
          onClose()
        } catch (error) {
          console.error('Failed to create item:', error)
        }
      }
    }, [title, selectedCategoryIds, createItemMutation, resetForm, onItemCreated, onClose])

    // シート閉じる時にフォームリセット
    const handleDismiss = useCallback(() => {
      resetForm()
      onClose()
    }, [resetForm, onClose])

    const isValid = title.trim().length > 0 && selectedCategoryIds.length > 0
    const isSubmitting = createItemMutation.isPending

    return (
      <>
        <BottomSheetModal
          ref={ref}
          snapPoints={snapPoints}
          backdropComponent={renderBackdrop}
          onDismiss={handleDismiss}
          handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 48, height: 4 }}
          backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          enablePanDownToClose
          keyboardBehavior="extend"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
        >
          <BottomSheetScrollView
            className="flex-1 px-5"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ヘッダー */}
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-900">新しいやりたいこと</Text>
              <Pressable
                className="rounded-full bg-gray-100 p-2 active:bg-gray-200"
                onPress={onClose}
              >
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>

            {/* タイトル入力 */}
            <View className="mb-5">
              <BottomSheetTextInput
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900"
                placeholder="やりたいことを入力..."
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                autoFocus
                returnKeyType="done"
              />
            </View>

            {/* カテゴリー選択 */}
            <View className="mb-5">
              <Text className="mb-3 text-base font-semibold text-gray-900">カテゴリーを選択</Text>
              {isCategoriesLoading ? (
                <View className="items-center py-4">
                  <ActivityIndicator size="small" color="#D97706" />
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <View className="flex-row flex-wrap gap-2">
                    {categories.map((category) => {
                      const isSelected = selectedCategoryIds.includes(category.id)
                      return (
                        <CategoryChip
                          key={category.id}
                          category={category}
                          isSelected={isSelected}
                          onPress={() => handleCategoryToggle(category.id)}
                        />
                      )
                    })}
                    {/* 新規カテゴリー追加チップ */}
                    <Pressable
                      className="flex-row items-center rounded-full border-2 border-dashed border-gray-300 px-4 py-2.5 active:border-gray-400 active:bg-gray-50"
                      onPress={handleOpenCreateCategory}
                    >
                      <Plus size={16} color="#9CA3AF" />
                      <Text className="ml-1.5 text-sm font-medium text-gray-500">
                        新規カテゴリー
                      </Text>
                    </Pressable>
                  </View>
                </ScrollView>
              )}
            </View>

            {/* 作成ボタン */}
            <Pressable
              className={`mb-8 flex-row items-center justify-center rounded-xl py-4 ${
                isValid && !isSubmitting ? 'bg-gray-900 active:bg-gray-800' : 'bg-gray-200'
              }`}
              onPress={handleCreate}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#9CA3AF" />
              ) : (
                <Text
                  className={`text-base font-semibold ${isValid ? 'text-white' : 'text-gray-400'}`}
                >
                  作成
                </Text>
              )}
            </Pressable>
          </BottomSheetScrollView>
        </BottomSheetModal>

        {/* カテゴリー作成シート */}
        <CreateCategorySheet
          ref={createCategorySheetRef}
          onClose={() => createCategorySheetRef.current?.dismiss()}
          onCategoryCreated={handleCategoryCreated}
        />
      </>
    )
  },
)

CreateItemSheet.displayName = 'CreateItemSheet'

interface CategoryChipProps {
  category: Category
  isSelected: boolean
  onPress: () => void
}

function CategoryChip({ category, isSelected, onPress }: CategoryChipProps) {
  return (
    <Pressable
      className={`flex-row items-center rounded-full px-4 py-2.5 ${
        isSelected
          ? 'border-2 border-gray-900 bg-gray-900'
          : 'border-2 border-gray-200 bg-white active:bg-gray-50'
      }`}
      onPress={onPress}
    >
      <Text className="mr-2 text-base">{category.icon}</Text>
      <Text className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
        {category.name}
      </Text>
      {isSelected && (
        <View className="ml-2">
          <Check size={14} color="white" strokeWidth={3} />
        </View>
      )}
    </Pressable>
  )
}
