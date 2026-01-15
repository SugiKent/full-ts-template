import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet'
import { Check, Edit3, Plus, Sparkles, Trash2, X } from 'lucide-react-native'
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Animated, Pressable, Text, TextInput, View } from 'react-native'
import { RectButton, Swipeable } from 'react-native-gesture-handler'
import type { ThemeColors } from '@/constants/theme'
import { useItemMutation } from '@/hooks/useItemMutation'
import { useStepMutation } from '@/hooks/useStepMutation'
import { useTheme } from '@/providers/ThemeProvider'
import { orpcClient } from '@/services/orpc-client'
import type { Category, Step, StepSuggestion, WishlistItem } from '@/types/wishlist'
import { showErrorToast } from '@/utils/toast'
import { CircularProgress } from './CircularProgress'

interface ItemDetailSheetProps {
  item: WishlistItem | null
  categories?: Category[]
  onClose: () => void
  /** アイテム更新後のコールバック */
  onItemUpdate?: (updatedItem: WishlistItem) => void
  /** アイテム削除後のコールバック */
  onItemDelete?: (itemId: string) => void
  /** ステップ変更後のコールバック（リスト更新用） */
  onStepsChange?: (itemId: string, steps: Step[]) => void
  /** 候補変更後のコールバック（リスト更新用） */
  onSuggestionsChange?: (itemId: string, suggestions: StepSuggestion[]) => void
}

/**
 * アイテム詳細シートモーダル
 * サーバーAPIと連携し、楽観的更新パターンでUIを即時更新
 */
export const ItemDetailSheet = forwardRef<BottomSheetModal, ItemDetailSheetProps>(
  (
    {
      item,
      categories: categoriesProp = [],
      onClose,
      onItemUpdate,
      onItemDelete,
      onStepsChange,
      onSuggestionsChange,
    },
    ref,
  ) => {
    const { colors } = useTheme()

    // ローカルステート（楽観的更新用）
    const [localSteps, setLocalSteps] = useState<Step[]>([])
    const [localSuggestions, setLocalSuggestions] = useState<StepSuggestion[]>([])
    const [isAddingStep, setIsAddingStep] = useState(false)
    const [newStepTitle, setNewStepTitle] = useState('')
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false)

    // 編集モード
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [editedTitle, setEditedTitle] = useState('')

    // item が変更されたらローカルステートを同期
    useEffect(() => {
      if (item) {
        setLocalSteps(item.steps)
        setEditedTitle(item.title)
        // 編集モードをリセット
        setIsEditingTitle(false)

        // suggestions を API から取得（list API では含まれないため）
        const fetchSuggestions = async () => {
          try {
            const response = await orpcClient.ai.listByItemId({ itemId: item.id })
            if (response.success) {
              setLocalSuggestions(response.data)
            }
          } catch {
            // エラー時は空配列のまま
            setLocalSuggestions([])
          }
        }
        fetchSuggestions()
      }
    }, [item])

    // カスタムフック
    const stepMutation = useStepMutation({
      itemId: item?.id ?? '',
      onStepCreated: (step) => {
        setLocalSteps((prev) => [...prev, step])
      },
      onStepToggled: (step) => {
        setLocalSteps((prev) => prev.map((s) => (s.id === step.id ? step : s)))
      },
      onStepDeleted: (stepId) => {
        setLocalSteps((prev) => prev.filter((s) => s.id !== stepId))
      },
      onError: (_error, operation) => {
        if (operation === 'toggle') {
          showErrorToast('ステップの更新に失敗しました')
        } else if (operation === 'create') {
          showErrorToast('ステップの追加に失敗しました')
        } else if (operation === 'delete') {
          showErrorToast('ステップの削除に失敗しました')
        }
      },
    })

    const itemMutation = useItemMutation({
      onSuccess: (updatedItem) => {
        if (updatedItem) {
          onItemUpdate?.(updatedItem)
        }
      },
      onError: () => {
        showErrorToast('アイテムの更新に失敗しました')
      },
    })

    // スナップポイント: 50% → 85%
    const snapPoints = useMemo(() => ['50%', '85%'], [])

    // 背景のオーバーレイ
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
      ),
      [],
    )

    // ステップ追加ハンドラー（API連携）
    const handleAddStep = useCallback(async () => {
      if (!newStepTitle.trim() || !item) return

      const title = newStepTitle.trim()
      setNewStepTitle('')
      setIsAddingStep(false)

      const newStep = await stepMutation.createStep(title)
      if (newStep) {
        // 親コンポーネントに通知
        onStepsChange?.(item.id, [...localSteps, newStep])
      }
    }, [newStepTitle, item, stepMutation, localSteps, onStepsChange])

    // ステップトグルハンドラー（楽観的更新 + API連携）
    const handleStepToggle = useCallback(
      async (stepId: string) => {
        if (!item) return

        // 楽観的更新
        setLocalSteps((prev) =>
          prev.map((s) => (s.id === stepId ? { ...s, isCompleted: !s.isCompleted } : s)),
        )

        const success = await stepMutation.toggleStep(stepId)
        if (!success) {
          // ロールバック
          setLocalSteps((prev) =>
            prev.map((s) => (s.id === stepId ? { ...s, isCompleted: !s.isCompleted } : s)),
          )
        } else {
          // 親コンポーネントに通知
          onStepsChange?.(
            item.id,
            localSteps.map((s) => (s.id === stepId ? { ...s, isCompleted: !s.isCompleted } : s)),
          )
        }
      },
      [item, stepMutation, localSteps, onStepsChange],
    )

    // ステップ削除ハンドラー（楽観的更新 + API連携）
    const handleDeleteStep = useCallback(
      async (stepId: string) => {
        if (!item) return

        // 楽観的更新
        const deletedStep = localSteps.find((s) => s.id === stepId)
        setLocalSteps((prev) => prev.filter((s) => s.id !== stepId))

        const success = await stepMutation.deleteStep(stepId)
        if (!success && deletedStep) {
          // ロールバック
          setLocalSteps((prev) => [...prev, deletedStep])
        } else {
          // 親コンポーネントに通知
          onStepsChange?.(
            item.id,
            localSteps.filter((s) => s.id !== stepId),
          )
        }
      },
      [item, stepMutation, localSteps, onStepsChange],
    )

    // 候補採用ハンドラー（API連携）
    const handleSuggestionAdopt = useCallback(
      async (suggestionId: string) => {
        if (!item) return

        const suggestion = localSuggestions.find((s) => s.id === suggestionId)
        if (!suggestion) return

        // 楽観的更新: 候補を削除
        setLocalSuggestions((prev) => prev.filter((s) => s.id !== suggestionId))

        try {
          const response = await orpcClient.ai.adopt({ suggestionId })
          if (response.success) {
            // 新しいステップを追加
            const newStep: Step = {
              id: response.data.id,
              title: response.data.title,
              isCompleted: response.data.isCompleted,
            }
            setLocalSteps((prev) => [...prev, newStep])
            onStepsChange?.(item.id, [...localSteps, newStep])
            onSuggestionsChange?.(
              item.id,
              localSuggestions.filter((s) => s.id !== suggestionId),
            )
          }
        } catch {
          // ロールバック
          setLocalSuggestions((prev) => [...prev, suggestion])
          showErrorToast('ステップの追加に失敗しました')
        }
      },
      [item, localSuggestions, localSteps, onStepsChange, onSuggestionsChange],
    )

    // 候補却下ハンドラー（API連携）
    const handleSuggestionDismiss = useCallback(
      async (suggestionId: string) => {
        if (!item) return

        const suggestion = localSuggestions.find((s) => s.id === suggestionId)
        if (!suggestion) return

        // 楽観的更新
        setLocalSuggestions((prev) => prev.filter((s) => s.id !== suggestionId))

        try {
          await orpcClient.ai.dismiss({ suggestionId })
          onSuggestionsChange?.(
            item.id,
            localSuggestions.filter((s) => s.id !== suggestionId),
          )
        } catch {
          // ロールバック
          setLocalSuggestions((prev) => [...prev, suggestion])
          showErrorToast('候補の却下に失敗しました')
        }
      },
      [item, localSuggestions, onSuggestionsChange],
    )

    // 候補再生成ハンドラー（API連携）
    const handleRegenerateSuggestions = useCallback(async () => {
      if (!item) return

      setIsSuggestionsLoading(true)

      try {
        await orpcClient.ai.regenerate({ itemId: item.id })
        // 再生成はWorkerで非同期処理されるため、しばらく待ってからリフェッチ
        // 実際のプロダクションでは WebSocket や Polling を使用
        setTimeout(async () => {
          try {
            const response = await orpcClient.ai.listByItemId({ itemId: item.id })
            if (response.success) {
              setLocalSuggestions(response.data)
              onSuggestionsChange?.(item.id, response.data)
            }
          } finally {
            setIsSuggestionsLoading(false)
          }
        }, 3000)
      } catch {
        setIsSuggestionsLoading(false)
        showErrorToast('候補の再生成に失敗しました')
      }
    }, [item, onSuggestionsChange])

    // アイテム編集ハンドラー
    const handleSaveTitle = useCallback(async () => {
      if (!item || !editedTitle.trim()) return
      if (editedTitle.trim() === item.title) {
        setIsEditingTitle(false)
        return
      }

      const success = await itemMutation.updateItem(item.id, { title: editedTitle.trim() })
      if (success) {
        setIsEditingTitle(false)
      }
    }, [item, editedTitle, itemMutation])

    // アイテム削除ハンドラー
    const handleDeleteItem = useCallback(() => {
      if (!item) return

      Alert.alert('アイテムを削除', 'このアイテムを削除しますか？この操作は取り消せません。', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            const success = await itemMutation.deleteItem(item.id)
            if (success) {
              onItemDelete?.(item.id)
              onClose()
            } else {
              showErrorToast('アイテムの削除に失敗しました')
            }
          },
        },
      ])
    }, [item, itemMutation, onItemDelete, onClose])

    if (!item) return null

    const completedCount = localSteps.filter((s) => s.isCompleted).length
    const totalCount = localSteps.length
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    // カテゴリー情報を取得
    const categories = item.categoryIds
      .map((id) => categoriesProp.find((c) => c.id === id))
      .filter((c): c is Category => c !== undefined)

    // 削除中かどうか
    const isDeleting = itemMutation.isDeleting

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
        <View className={`border-b ${colors.dividerBorder} px-5 pb-4`}>
          <View className="mb-4 flex-row items-start justify-between">
            <View className="mr-4 flex-1">
              {isEditingTitle ? (
                <View className="flex-row items-center">
                  <TextInput
                    className={`mr-2 flex-1 rounded-lg border ${colors.border} ${colors.card} px-3 py-2 text-xl font-bold ${colors.text}`}
                    value={editedTitle}
                    onChangeText={setEditedTitle}
                    onSubmitEditing={handleSaveTitle}
                    autoFocus
                    maxLength={100}
                  />
                  <Pressable
                    className={`mr-2 rounded-full ${colors.primary} p-2 ${colors.primaryActive}`}
                    onPress={handleSaveTitle}
                    disabled={itemMutation.isUpdating}
                  >
                    {itemMutation.isUpdating ? (
                      <ActivityIndicator size={16} color="white" />
                    ) : (
                      <Check size={16} color="white" strokeWidth={3} />
                    )}
                  </Pressable>
                  <Pressable
                    className={`rounded-full ${colors.badgeBg} p-2 ${colors.cardActive}`}
                    onPress={() => {
                      setIsEditingTitle(false)
                      setEditedTitle(item.title)
                    }}
                  >
                    <X size={16} color={colors.secondaryHex} />
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => setIsEditingTitle(true)}>
                  <Text
                    className={`text-xl font-bold leading-tight ${
                      item.isCompleted ? `${colors.textMuted} line-through` : colors.text
                    }`}
                  >
                    {item.title}
                  </Text>
                </Pressable>
              )}
            </View>
            {!isEditingTitle && (
              <Pressable
                className={`rounded-full ${colors.badgeBg} p-2 ${colors.cardActive}`}
                onPress={onClose}
              >
                <X size={20} color={colors.secondaryHex} />
              </Pressable>
            )}
          </View>

          {/* カテゴリータグ */}
          <View className="flex-row flex-wrap">
            {categories.map((category) => (
              <View
                key={category.id}
                className={`mb-2 mr-2 flex-row items-center rounded-full ${colors.badgeBg} px-3 py-1.5`}
              >
                <Text className="mr-1.5 text-sm">{category.icon}</Text>
                <Text className={`text-sm font-medium ${colors.badgeText}`}>{category.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <BottomSheetScrollView className="px-5 py-5" showsVerticalScrollIndicator={false}>
          {/* 進捗カード */}
          {totalCount > 0 && (
            <View className="mb-6 rounded-2xl bg-gray-900 p-5">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="mb-1 text-sm text-gray-400">進捗</Text>
                  <View className="flex-row items-baseline">
                    <Text className="text-3xl font-bold text-white">{progress}</Text>
                    <Text className="ml-1 text-lg text-gray-400">%</Text>
                  </View>
                  <Text className="mt-1 text-sm text-gray-500">
                    {completedCount}/{totalCount} 完了
                  </Text>
                </View>
                <CircularProgress
                  progress={progress}
                  size={72}
                  strokeWidth={6}
                  color={item.isCompleted ? '#22C55E' : colors.primaryHex}
                  backgroundColor="rgba(255,255,255,0.1)"
                />
              </View>
            </View>
          )}

          {/* ステップ一覧 */}
          <View className="mb-6">
            <View className="mb-3">
              <Text className={`text-base font-semibold ${colors.text}`}>ステップ</Text>
            </View>

            {localSteps.map((step) => (
              <SwipeableStepItem
                key={step.id}
                step={step}
                isToggling={stepMutation.pendingToggleIds.has(step.id)}
                onToggle={() => handleStepToggle(step.id)}
                onDelete={() => handleDeleteStep(step.id)}
                disabled={isDeleting}
                colors={colors}
              />
            ))}

            {/* ステップ追加フォーム */}
            {isAddingStep ? (
              <View
                className={`mb-2 flex-row items-center rounded-xl border ${colors.border} ${colors.card} p-3`}
              >
                <BottomSheetTextInput
                  className={`mr-3 flex-1 text-base ${colors.text}`}
                  placeholder="ステップを入力..."
                  placeholderTextColor={colors.secondaryHex}
                  value={newStepTitle}
                  onChangeText={setNewStepTitle}
                  onSubmitEditing={handleAddStep}
                  autoFocus
                  returnKeyType="done"
                  maxLength={200}
                />
                <Pressable
                  className={`mr-2 rounded-full ${colors.primary} p-2 ${colors.primaryActive}`}
                  onPress={handleAddStep}
                  disabled={!newStepTitle.trim() || stepMutation.isCreating}
                >
                  {stepMutation.isCreating ? (
                    <ActivityIndicator size={16} color="white" />
                  ) : (
                    <Check size={16} color="white" strokeWidth={3} />
                  )}
                </Pressable>
                <Pressable
                  className={`rounded-full ${colors.badgeBg} p-2 ${colors.cardActive}`}
                  onPress={() => {
                    setIsAddingStep(false)
                    setNewStepTitle('')
                  }}
                >
                  <X size={16} color={colors.secondaryHex} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                className={`flex-row items-center justify-center rounded-xl border-2 border-dashed ${colors.border} py-3 ${colors.cardActive}`}
                onPress={() => setIsAddingStep(true)}
                disabled={isDeleting}
              >
                <Plus size={18} color={colors.secondaryHex} />
                <Text className={`ml-2 font-medium ${colors.textMuted}`}>ステップを追加</Text>
              </Pressable>
            )}
          </View>

          {/* AIステップ候補セクション */}
          {(localSuggestions.length > 0 || isSuggestionsLoading) && (
            <View className="mb-6">
              <View className="mb-3 flex-row items-center">
                <Sparkles size={16} color={colors.iconColor} />
                <Text className={`ml-2 text-base font-semibold ${colors.text}`}>AIの提案</Text>
                <Text className={`ml-2 text-sm ${colors.textMuted}`}>タップで追加</Text>
              </View>

              {isSuggestionsLoading && localSuggestions.length === 0 ? (
                <View className={`items-center justify-center rounded-xl ${colors.badgeBg} py-6`}>
                  <ActivityIndicator size="small" color={colors.iconColor} />
                  <Text className={`mt-2 text-sm ${colors.badgeText}`}>AIが提案を生成中...</Text>
                </View>
              ) : (
                localSuggestions.map((suggestion) => (
                  <SwipeableSuggestionItem
                    key={suggestion.id}
                    suggestion={suggestion}
                    onAdopt={() => handleSuggestionAdopt(suggestion.id)}
                    onDismiss={() => handleSuggestionDismiss(suggestion.id)}
                    disabled={isDeleting}
                    colors={colors}
                  />
                ))
              )}
            </View>
          )}

          {/* さらなる提案ボタン */}
          <Pressable
            className={`mb-6 flex-row items-center justify-center rounded-xl ${colors.badgeBg} py-4 ${colors.cardActive}`}
            onPress={handleRegenerateSuggestions}
            disabled={isSuggestionsLoading || isDeleting}
          >
            {isSuggestionsLoading ? (
              <ActivityIndicator size="small" color={colors.iconColor} />
            ) : (
              <Sparkles size={20} color={colors.iconColor} />
            )}
            <Text className={`ml-2 font-semibold ${colors.badgeText}`}>さらなる提案</Text>
          </Pressable>

          {/* アクションボタン */}
          <View className="mb-8 flex-row justify-center space-x-3">
            <Pressable
              className={`flex-row items-center rounded-xl ${colors.badgeBg} px-5 py-3 ${colors.cardActive}`}
              onPress={() => setIsEditingTitle(true)}
              disabled={isDeleting}
            >
              <Edit3 size={18} color={colors.secondaryHex} />
              <Text className={`ml-2 font-medium ${colors.badgeText}`}>編集</Text>
            </Pressable>
            <Pressable
              className="flex-row items-center rounded-xl bg-red-50 px-5 py-3 active:bg-red-100"
              onPress={handleDeleteItem}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size={18} color="#EF4444" />
              ) : (
                <Trash2 size={18} color="#EF4444" />
              )}
              <Text className="ml-2 font-medium text-red-600">削除</Text>
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    )
  },
)

ItemDetailSheet.displayName = 'ItemDetailSheet'

// =====================================
// サブコンポーネント
// =====================================

interface SwipeableStepItemProps {
  step: Step
  isToggling?: boolean
  onToggle?: () => void
  onDelete?: () => void
  disabled?: boolean
  colors: ThemeColors
}

interface SwipeableSuggestionItemProps {
  suggestion: StepSuggestion
  onAdopt?: () => void
  onDismiss?: () => void
  disabled?: boolean
  colors: ThemeColors
}

/**
 * スワイプで却下できる AI ステップ候補アイテム
 */
function SwipeableSuggestionItem({
  suggestion,
  onAdopt,
  onDismiss,
  disabled,
  colors,
}: SwipeableSuggestionItemProps): React.ReactNode {
  const swipeableRef = useRef<Swipeable>(null)

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    })

    return (
      <Animated.View
        style={{ transform: [{ translateX }] }}
        className="mb-2 flex-row items-center justify-end"
      >
        <RectButton
          style={{
            width: 72,
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#9CA3AF',
            borderTopRightRadius: 12,
            borderBottomRightRadius: 12,
          }}
          onPress={() => {
            swipeableRef.current?.close()
            onDismiss?.()
          }}
        >
          <X size={20} color="white" />
        </RectButton>
      </Animated.View>
    )
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
      friction={2}
      enabled={!disabled}
    >
      <Pressable
        className={`mb-2 flex-row items-center rounded-xl border ${colors.border} ${colors.badgeBg} p-4 ${colors.cardActive}`}
        onPress={onAdopt}
        disabled={disabled}
      >
        <View className={`mr-4 h-7 w-7 items-center justify-center rounded-full ${colors.iconBg}`}>
          <Sparkles size={14} color={colors.iconColor} />
        </View>
        <View className="flex-1">
          <Text className={`text-base leading-snug ${colors.text}`}>{suggestion.title}</Text>
          {suggestion.description && (
            <Text className={`mt-1 text-sm ${colors.badgeText}`} numberOfLines={2}>
              {suggestion.description}
            </Text>
          )}
        </View>
        <View className="ml-2">
          <Plus size={18} color={colors.iconColor} />
        </View>
      </Pressable>
    </Swipeable>
  )
}

/**
 * スワイプで削除できるステップアイテム
 */
function SwipeableStepItem({
  step,
  isToggling,
  onToggle,
  onDelete,
  disabled,
  colors,
}: SwipeableStepItemProps): React.ReactNode {
  const swipeableRef = useRef<Swipeable>(null)

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    })

    return (
      <Animated.View
        style={{ transform: [{ translateX }] }}
        className="mb-2 flex-row items-center justify-end"
      >
        <RectButton
          style={{
            width: 72,
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#EF4444',
            borderTopRightRadius: 12,
            borderBottomRightRadius: 12,
          }}
          onPress={() => {
            swipeableRef.current?.close()
            onDelete?.()
          }}
        >
          <Trash2 size={20} color="white" />
        </RectButton>
      </Animated.View>
    )
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
      friction={2}
      enabled={!disabled}
    >
      <Pressable
        className={`mb-2 flex-row items-center rounded-xl border p-4 ${
          step.isCompleted
            ? `${colors.dividerBorder} ${colors.backgroundDark}`
            : `${colors.border} ${colors.card} ${colors.cardActive}`
        }`}
        onPress={onToggle}
        disabled={disabled}
      >
        {/* チェックボックス */}
        <View
          className={`mr-4 h-7 w-7 items-center justify-center rounded-full ${
            step.isCompleted ? colors.primary : `border-2 ${colors.border}`
          }`}
        >
          {isToggling ? (
            <ActivityIndicator size={14} color={step.isCompleted ? 'white' : colors.secondaryHex} />
          ) : (
            step.isCompleted && <Check size={14} color="white" strokeWidth={3} />
          )}
        </View>

        {/* ステップタイトル */}
        <View className="flex-1">
          <Text
            className={`text-base leading-snug ${
              step.isCompleted ? `${colors.textMuted} line-through` : colors.text
            }`}
          >
            {step.title}
          </Text>
        </View>
      </Pressable>
    </Swipeable>
  )
}
