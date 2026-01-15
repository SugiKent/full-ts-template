/**
 * ジャーナル入力シート
 *
 * タイムライン画面からジャーナルエントリーを作成・編集するモーダル
 */

import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet'
import { Trash2, X } from 'lucide-react-native'
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { useCreateJournalEntry, useDeleteJournalEntry, useUpdateJournalEntry } from '@/hooks/useApi'

/**
 * ジャーナルエントリー（編集用）
 */
interface JournalEntryForEdit {
  id: string
  title: string | null
  content: string
}

interface JournalInputSheetProps {
  /** 閉じる時のコールバック */
  onClose: () => void
  /** 作成/更新完了時のコールバック */
  onSaved?: () => void
  /** 編集モードの場合、既存エントリーを渡す */
  editEntry?: JournalEntryForEdit | null
}

/** ジャーナル最大文字数 */
const JOURNAL_MAX_CONTENT_LENGTH = 5000

/**
 * ジャーナル入力/編集シートモーダル
 */
export const JournalInputSheet = forwardRef<BottomSheetModal, JournalInputSheetProps>(
  ({ onClose, onSaved, editEntry }, ref) => {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')

    // API フック
    const createMutation = useCreateJournalEntry()
    const updateMutation = useUpdateJournalEntry()
    const deleteMutation = useDeleteJournalEntry()

    // 編集モードの場合、初期値を設定
    useEffect(() => {
      if (editEntry) {
        setTitle(editEntry.title ?? '')
        setContent(editEntry.content)
      } else {
        setTitle('')
        setContent('')
      }
    }, [editEntry])

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
      setTitle('')
      setContent('')
    }, [])

    // 保存ボタン押下
    const handleSave = useCallback(async () => {
      if (!content.trim()) return

      try {
        if (editEntry) {
          // 更新モード
          await updateMutation.mutateAsync({
            id: editEntry.id,
            title: title.trim() || null,
            content: content.trim(),
          })
        } else {
          // 作成モード
          const trimmedTitle = title.trim()
          await createMutation.mutateAsync({
            ...(trimmedTitle && { title: trimmedTitle }),
            content: content.trim(),
          })
        }
        resetForm()
        onSaved?.()
        onClose()
      } catch (error) {
        console.error('Failed to save journal entry:', error)
      }
    }, [content, title, editEntry, createMutation, updateMutation, resetForm, onSaved, onClose])

    // 削除ボタン押下
    const handleDelete = useCallback(async () => {
      if (!editEntry) return

      try {
        await deleteMutation.mutateAsync(editEntry.id)
        resetForm()
        onSaved?.()
        onClose()
      } catch (error) {
        console.error('Failed to delete journal entry:', error)
      }
    }, [editEntry, deleteMutation, resetForm, onSaved, onClose])

    // シート閉じる時にフォームリセット
    const handleDismiss = useCallback(() => {
      resetForm()
      onClose()
    }, [resetForm, onClose])

    const isValid = content.trim().length > 0
    const isSubmitting = createMutation.isPending || updateMutation.isPending
    const isDeleting = deleteMutation.isPending
    const isEditMode = !!editEntry
    const remainingChars = JOURNAL_MAX_CONTENT_LENGTH - content.length

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
      >
        <BottomSheetScrollView
          className="flex-1 px-5"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ヘッダー */}
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-900">
              {isEditMode ? 'ジャーナルを編集' : '今日の振り返り'}
            </Text>
            <View className="flex-row items-center gap-2">
              {isEditMode && (
                <Pressable
                  className="rounded-full bg-red-50 p-2 active:bg-red-100"
                  onPress={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size={20} color="#DC2626" />
                  ) : (
                    <Trash2 size={20} color="#DC2626" />
                  )}
                </Pressable>
              )}
              <Pressable
                className="rounded-full bg-gray-100 p-2 active:bg-gray-200"
                onPress={onClose}
              >
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>
          </View>

          {/* タイトル入力（任意） */}
          <View className="mb-4">
            <Text className="mb-2 text-sm text-gray-500">タイトル（任意）</Text>
            <BottomSheetTextInput
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
              placeholder="今日のハイライト..."
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
              returnKeyType="next"
            />
          </View>

          {/* 本文入力 */}
          <View className="mb-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-sm text-gray-500">内容</Text>
              <Text
                className={`text-xs ${remainingChars < 500 ? 'text-amber-600' : 'text-gray-400'}`}
              >
                残り {remainingChars.toLocaleString()} 文字
              </Text>
            </View>
            <BottomSheetTextInput
              className="min-h-[200px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base leading-relaxed text-gray-900"
              placeholder="今日あったこと、感じたこと、学んだことを書いてみましょう..."
              placeholderTextColor="#9CA3AF"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={JOURNAL_MAX_CONTENT_LENGTH}
              autoFocus={!isEditMode}
            />
          </View>

          {/* 保存ボタン */}
          <Pressable
            className={`mb-8 flex-row items-center justify-center rounded-xl py-4 ${
              isValid && !isSubmitting ? 'bg-amber-600 active:bg-amber-700' : 'bg-gray-200'
            }`}
            onPress={handleSave}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                className={`text-base font-semibold ${isValid ? 'text-white' : 'text-gray-400'}`}
              >
                {isEditMode ? '更新' : '保存'}
              </Text>
            )}
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>
    )
  },
)

JournalInputSheet.displayName = 'JournalInputSheet'
