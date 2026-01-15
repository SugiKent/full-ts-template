import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ItemDetailSheet, WishlistItemCard } from '@/components/home'
import { useTheme } from '@/providers/ThemeProvider'
import type { Category, Step, StepSuggestion, WishlistItem } from '@/types/wishlist'
import { CategoryEditSheet } from './CategoryEditSheet'
import { CategoryPageHeader } from './CategoryPageHeader'

interface CategoryPageProps {
  category: Category
  items: WishlistItem[]
}

/**
 * カテゴリーページ
 * カテゴリーに属するウィッシュリストアイテム一覧を表示
 */
export function CategoryPage({ category, items: initialItems }: CategoryPageProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const editSheetRef = useRef<BottomSheetModal>(null)
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null)
  const [categoryData, setCategoryData] = useState<Category>(category)
  const [items, setItems] = useState<WishlistItem[]>(initialItems)
  const { colors } = useTheme()

  // props の items が更新されたら state も更新
  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  const handleItemPress = useCallback((item: WishlistItem) => {
    setSelectedItem(item)
  }, [])

  // selectedItem が設定されたらモーダルを表示
  // 状態更新は非同期のため、useEffect で監視して present() を呼び出す
  useEffect(() => {
    if (selectedItem) {
      bottomSheetRef.current?.present()
    }
  }, [selectedItem])

  const handleCloseSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss()
    setSelectedItem(null)
  }, [])

  const handleEditPress = useCallback(() => {
    editSheetRef.current?.present()
  }, [])

  const handleCloseEditSheet = useCallback(() => {
    editSheetRef.current?.dismiss()
  }, [])

  const handleSaveCategory = useCallback((updatedCategory: Category) => {
    setCategoryData(updatedCategory)
    editSheetRef.current?.dismiss()
  }, [])

  // アイテム更新ハンドラー
  const handleItemUpdate = useCallback((_updatedItem: WishlistItem) => {
    // 将来的にはAPIから再取得
    // 今は selectedItem を更新
    setSelectedItem(_updatedItem)
  }, [])

  // アイテム削除ハンドラー
  const handleItemDelete = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
    setSelectedItem(null)
  }, [])

  // ステップ変更ハンドラー
  const handleStepsChange = useCallback((itemId: string, steps: Step[]) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        return { ...item, steps }
      }),
    )
    setSelectedItem((prev) => {
      if (!prev || prev.id !== itemId) return prev
      return { ...prev, steps }
    })
  }, [])

  // 候補変更ハンドラー
  const handleSuggestionsChange = useCallback((itemId: string, suggestions: StepSuggestion[]) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        return { ...item, suggestions }
      }),
    )
    setSelectedItem((prev) => {
      if (!prev || prev.id !== itemId) return prev
      return { ...prev, suggestions }
    })
  }, [])

  const completedCount = items.filter((item) => item.isCompleted).length

  return (
    <View className={`flex-1 ${colors.card}`}>
      <SafeAreaView edges={['top']} className="flex-1">
        <CategoryPageHeader
          category={categoryData}
          itemCount={items.length}
          completedCount={completedCount}
          onEditPress={handleEditPress}
        />

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {items.length > 0 ? (
            items.map((item) => (
              <WishlistItemCard
                key={item.id}
                item={item}
                category={categoryData}
                onPress={() => handleItemPress(item)}
              />
            ))
          ) : (
            <EmptyState category={categoryData} colors={colors} />
          )}
        </ScrollView>
      </SafeAreaView>

      <ItemDetailSheet
        ref={bottomSheetRef}
        item={selectedItem}
        categories={[categoryData]}
        onClose={handleCloseSheet}
        onItemUpdate={handleItemUpdate}
        onItemDelete={handleItemDelete}
        onStepsChange={handleStepsChange}
        onSuggestionsChange={handleSuggestionsChange}
      />

      <CategoryEditSheet
        ref={editSheetRef}
        category={categoryData}
        onClose={handleCloseEditSheet}
        onSave={handleSaveCategory}
      />
    </View>
  )
}

function EmptyState({
  category,
  colors,
}: {
  category: Category
  colors: ReturnType<typeof useTheme>['colors']
}) {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="mb-4 text-6xl">{category.icon}</Text>
      <Text className={`mb-2 text-lg font-medium ${colors.text}`}>まだアイテムがありません</Text>
      <Text className={`px-8 text-center text-sm ${colors.textMuted}`}>{category.name}</Text>
    </View>
  )
}
