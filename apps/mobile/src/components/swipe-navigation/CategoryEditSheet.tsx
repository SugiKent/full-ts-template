import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import { X } from 'lucide-react-native'
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import type { Category } from '@/types/wishlist'

interface CategoryEditSheetProps {
  category: Category | null
  onClose: () => void
  onSave: (updatedCategory: Category) => void
}

/**
 * カテゴリー編集シートモーダル
 * カテゴリーのアイコン、タイトル、意気込み（description）を編集
 */
export const CategoryEditSheet = forwardRef<BottomSheetModal, CategoryEditSheetProps>(
  ({ category, onClose, onSave }, ref) => {
    const [icon, setIcon] = useState('')
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')

    // カテゴリーが変更されたらフォームをリセット
    useEffect(() => {
      if (category) {
        setIcon(category.icon)
        setName(category.name)
        setDescription(category.description ?? '')
      }
    }, [category])

    // スナップポイント: 60%
    const snapPoints = useMemo(() => ['60%'], [])

    // 背景のオーバーレイ
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
      ),
      [],
    )

    const handleSave = useCallback(() => {
      if (!category) return
      const trimmedDescription = description.trim()
      const updatedCategory: Category = {
        id: category.id,
        icon: icon.trim() || category.icon,
        name: name.trim() || category.name,
      }
      if (trimmedDescription) {
        updatedCategory.description = trimmedDescription
      }
      onSave(updatedCategory)
    }, [category, icon, name, description, onSave])

    if (!category) return null

    const canSave = name.trim().length > 0

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onDismiss={onClose}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 48, height: 4 }}
        backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        enablePanDownToClose
      >
        {/* ヘッダー */}
        <View className="border-b border-gray-100 px-5 pb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-gray-900">カテゴリーを編集</Text>
            <Pressable
              className="rounded-full bg-gray-100 p-2 active:bg-gray-200"
              onPress={onClose}
            >
              <X size={20} color="#6B7280" />
            </Pressable>
          </View>
        </View>

        <BottomSheetScrollView className="px-5 py-5" showsVerticalScrollIndicator={false}>
          {/* アイコン入力 */}
          <View className="mb-5">
            <Text className="mb-2 text-sm font-medium text-gray-700">アイコン</Text>
            <TextInput
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-3xl"
              value={icon}
              onChangeText={setIcon}
              maxLength={2}
              placeholder="📦"
            />
          </View>

          {/* タイトル入力 */}
          <View className="mb-5">
            <Text className="mb-2 text-sm font-medium text-gray-700">カテゴリー名</Text>
            <TextInput
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
              value={name}
              onChangeText={setName}
              placeholder="例: 旅行、スキルアップ、健康..."
            />
          </View>

          {/* 意気込み入力 */}
          <View className="mb-8">
            <Text className="mb-2 text-sm font-medium text-gray-700">意気込み</Text>
            <TextInput
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
              value={description}
              onChangeText={setDescription}
              placeholder="このカテゴリーへの意気込みを入力..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{ minHeight: 80 }}
            />
          </View>

          {/* アクションボタン */}
          <View className="flex-row space-x-3">
            <Pressable
              className="flex-1 items-center rounded-xl bg-gray-100 py-4 active:bg-gray-200"
              onPress={onClose}
            >
              <Text className="font-medium text-gray-700">キャンセル</Text>
            </Pressable>
            <Pressable
              className={`flex-1 items-center rounded-xl py-4 ${
                canSave ? 'bg-amber-500 active:bg-amber-600' : 'bg-gray-200'
              }`}
              onPress={handleSave}
              disabled={!canSave}
            >
              <Text className={`font-medium ${canSave ? 'text-white' : 'text-gray-400'}`}>
                保存
              </Text>
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    )
  },
)

CategoryEditSheet.displayName = 'CategoryEditSheet'
