import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet'
import { X } from 'lucide-react-native'
import { forwardRef, useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { useCreateCategory } from '@/hooks/useApi'

interface CreateCategorySheetProps {
  onClose: () => void
  /** カテゴリー作成成功時のコールバック（作成されたカテゴリーのIDを返す） */
  onCategoryCreated?: (categoryId: string) => void
}

// 絵文字のプリセット一覧
const EMOJI_PRESETS = [
  '🌍',
  '📚',
  '🎨',
  '💪',
  '💼',
  '💰',
  '👥',
  '📖',
  '🎭',
  '✨',
  '🏃',
  '🎵',
  '🍳',
  '✈️',
  '🏠',
  '💡',
  '🎯',
  '❤️',
  '🌱',
  '🎮',
  '📸',
  '🧘',
  '🎬',
  '🚗',
  '🎤',
  '🏊',
  '🎹',
  '📝',
  '🛠️',
  '🌸',
]

/**
 * カテゴリー作成シートモーダル
 * アイコン（絵文字）、タイトル、意気込み（任意）を入力
 */
export const CreateCategorySheet = forwardRef<BottomSheetModal, CreateCategorySheetProps>(
  ({ onClose, onCategoryCreated }, ref) => {
    const [icon, setIcon] = useState('✨')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    // API フック
    const createCategoryMutation = useCreateCategory()

    // スナップポイント: 75%（キーボード表示時に拡張）
    const snapPoints = useMemo(() => ['75%', '95%'], [])

    // 背景のオーバーレイ
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
      ),
      [],
    )

    // フォームリセット
    const resetForm = useCallback(() => {
      setIcon('✨')
      setTitle('')
      setDescription('')
    }, [])

    // 作成ボタン押下（API経由）
    const handleCreate = useCallback(async () => {
      if (title.trim()) {
        try {
          const result = await createCategoryMutation.mutateAsync({
            name: title.trim(),
            icon,
          })
          onCategoryCreated?.(result.id)
          resetForm()
          onClose()
        } catch (error) {
          console.error('Failed to create category:', error)
        }
      }
    }, [title, icon, createCategoryMutation, onCategoryCreated, resetForm, onClose])

    // シート閉じる時にフォームリセット
    const handleDismiss = useCallback(() => {
      resetForm()
      onClose()
    }, [resetForm, onClose])

    const isValid = title.trim().length > 0
    const isSubmitting = createCategoryMutation.isPending

    return (
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
        stackBehavior="push"
      >
        <BottomSheetScrollView
          className="flex-1 px-5"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ヘッダー */}
          <View className="mb-5 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-900">新しいカテゴリー</Text>
            <Pressable
              className="rounded-full bg-gray-100 p-2 active:bg-gray-200"
              onPress={onClose}
            >
              <X size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* アイコン選択 */}
          <View className="mb-5">
            <Text className="mb-3 text-base font-semibold text-gray-900">アイコン</Text>
            {/* 現在選択中のアイコン */}
            <View className="mb-3 items-center">
              <View className="h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
                <Text className="text-5xl">{icon}</Text>
              </View>
            </View>
            {/* 絵文字グリッド */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
              keyboardShouldPersistTaps="handled"
            >
              <View className="flex-row gap-2">
                {EMOJI_PRESETS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    className={`h-12 w-12 items-center justify-center rounded-xl ${
                      icon === emoji ? 'bg-gray-900' : 'bg-gray-100 active:bg-gray-200'
                    }`}
                    onPress={() => setIcon(emoji)}
                  >
                    <Text className="text-2xl">{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* タイトル入力 */}
          <View className="mb-4">
            <Text className="mb-2 text-base font-semibold text-gray-900">カテゴリー名</Text>
            <BottomSheetTextInput
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900"
              placeholder="例: 旅行、スキルアップ、健康..."
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
            />
          </View>

          {/* 意気込み入力（任意） */}
          <View className="mb-5">
            <Text className="mb-2 text-base font-semibold text-gray-900">意気込み（任意）</Text>
            <BottomSheetTextInput
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900"
              placeholder="このカテゴリーへの意気込みを入力..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              returnKeyType="done"
            />
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
    )
  },
)

CreateCategorySheet.displayName = 'CreateCategorySheet'
