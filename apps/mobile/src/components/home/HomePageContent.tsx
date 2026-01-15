import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useRouter } from 'expo-router'
import { AlertCircle, RefreshCw, Sparkles, User } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DebugScreen } from '@/components/debug'
import { useHomeData } from '@/hooks/useApi'
import { useTheme } from '@/providers/ThemeProvider'
import type {
  Category,
  CategoryWithItems,
  Step,
  StepSuggestion,
  WishlistItem,
} from '@/types/wishlist'
// Note: barrel ファイル経由ではなく直接インポート（循環参照を避けるため）
import { CategorySection } from './CategorySection'
import { ItemDetailSheet } from './ItemDetailSheet'
import { MonthlyGoalCard } from './MonthlyGoalCard'

// 3連打検知の設定
const TRIPLE_TAP_THRESHOLD_MS = 500 // 500ms以内に3回タップ
const TRIPLE_TAP_COUNT = 3

// 今月やることセクションの高さ（2段カードレイアウト対応）
const HERO_SECTION_HEIGHT = 500

/**
 * 現在の月（YYYY-MM形式）を取得
 */
function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * API レスポンスの item.categories から categoryIds を抽出
 */
function extractCategoryIds(
  categories: { id: string; name: string; icon: string | null; color: string | null }[],
): string[] {
  return categories.map((cat) => cat.id)
}

/**
 * API レスポンスの item.monthlyGoals から isMonthlyGoal を判定
 */
function checkIsMonthlyGoal(
  monthlyGoals: { targetMonth: string; isCompleted: boolean }[],
): boolean {
  const currentMonth = getCurrentMonth()
  return monthlyGoals.some((goal) => {
    // targetMonth は ISO 文字列なので YYYY-MM を抽出
    const goalMonth = goal.targetMonth.substring(0, 7)
    return goalMonth === currentMonth && !goal.isCompleted
  })
}

/**
 * API レスポンスを UI 用の WishlistItem 型に変換
 */
function transformApiItemToWishlistItem(apiItem: {
  id: string
  title: string
  description: string | null
  isCompleted: boolean
  createdAt: string
  completedAt: string | null
  categories: { id: string; name: string; icon: string | null; color: string | null }[]
  steps: { id: string; title: string; isCompleted: boolean }[]
  monthlyGoals: { targetMonth: string; isCompleted: boolean }[]
  suggestions?: {
    id: string
    itemId: string
    title: string
    description: string | null
    sortOrder: number
    createdAt: string
  }[]
}): WishlistItem {
  const result: WishlistItem = {
    id: apiItem.id,
    title: apiItem.title,
    categoryIds: extractCategoryIds(apiItem.categories),
    steps: apiItem.steps.map((s) => ({
      id: s.id,
      title: s.title,
      isCompleted: s.isCompleted,
    })),
    suggestions: (apiItem.suggestions ?? []).map((s) => ({
      id: s.id,
      itemId: s.itemId,
      title: s.title,
      description: s.description,
      sortOrder: s.sortOrder,
      createdAt: s.createdAt,
    })),
    isCompleted: apiItem.isCompleted,
    isMonthlyGoal: checkIsMonthlyGoal(apiItem.monthlyGoals),
    createdAt: new Date(apiItem.createdAt),
  }

  if (apiItem.completedAt) {
    result.completedAt = new Date(apiItem.completedAt)
  }

  return result
}

/**
 * カテゴリー別にアイテムをグループ化
 */
function groupItemsByCategory(items: WishlistItem[], categories: Category[]): CategoryWithItems[] {
  return categories.map((category) => ({
    category,
    items: items.filter((item) => item.categoryIds.includes(category.id)),
  }))
}

/**
 * 2段横スクロールビュー
 * アイテムを交互に上段・下段に配置
 */
function TwoRowScrollView({
  items,
  categories,
  onItemPress,
}: {
  items: WishlistItem[]
  categories: Category[]
  onItemPress: (item: WishlistItem) => void
}) {
  // 奇数インデックス（0, 2, 4...）を上段、偶数インデックス（1, 3, 5...）を下段
  const topRowItems = items.filter((_, index) => index % 2 === 0)
  const bottomRowItems = items.filter((_, index) => index % 2 === 1)

  // カテゴリーIDからCategoryを取得するヘルパー
  const getCategoryById = (categoryId: string): Category | undefined =>
    categories.find((cat) => cat.id === categoryId)

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: 20 }}
    >
      <View className="gap-3">
        {/* 上段 */}
        <View className="flex-row">
          {topRowItems.map((item, rowIndex) => {
            const originalIndex = rowIndex * 2
            const primaryCategory = item.categoryIds[0]
              ? getCategoryById(item.categoryIds[0])
              : undefined
            return (
              <MonthlyGoalCard
                key={item.id}
                item={item}
                category={primaryCategory}
                index={originalIndex}
                onPress={() => onItemPress(item)}
              />
            )
          })}
        </View>
        {/* 下段 */}
        {bottomRowItems.length > 0 && (
          <View className="flex-row">
            {bottomRowItems.map((item, rowIndex) => {
              const originalIndex = rowIndex * 2 + 1
              const primaryCategory = item.categoryIds[0]
                ? getCategoryById(item.categoryIds[0])
                : undefined
              return (
                <MonthlyGoalCard
                  key={item.id}
                  item={item}
                  category={primaryCategory}
                  index={originalIndex}
                  onPress={() => onItemPress(item)}
                />
              )
            })}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

/**
 * ホーム画面コンテンツ
 * 「今月やること」を大々的にフィーチャー
 * 温かみのあるナチュラルテイスト + 視差スクロール効果
 *
 * SwipeNavigator から呼び出されるため SafeAreaView は含まない
 */
export function HomePageContent() {
  const router = useRouter()
  const { height: windowHeight } = useWindowDimensions()
  const { colors } = useTheme()
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const scrollY = useRef(new Animated.Value(0)).current
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDebugScreenVisible, setIsDebugScreenVisible] = useState(false)

  // 3連打検知用の状態
  const tapTimestampsRef = useRef<number[]>([])

  // サーバー API からホームデータを取得
  const { data: homeData, isLoading, isError, error, refetch } = useHomeData()

  /**
   * 左上エリアの3連打を検知してデバッグ画面を表示
   */
  const handleDebugAreaPress = useCallback(() => {
    const now = Date.now()
    const timestamps = tapTimestampsRef.current

    // 古いタップを削除（しきい値を超えたもの）
    const recentTimestamps = timestamps.filter((ts) => now - ts < TRIPLE_TAP_THRESHOLD_MS)

    // 新しいタップを追加
    recentTimestamps.push(now)
    tapTimestampsRef.current = recentTimestamps

    // 3連打検知
    if (recentTimestamps.length >= TRIPLE_TAP_COUNT) {
      tapTimestampsRef.current = [] // リセット
      setIsDebugScreenVisible(true)
    }
  }, [])

  // API レスポンスを UI 用の型に変換
  const categories: Category[] =
    homeData?.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon ?? '📦',
    })) ?? []

  const items: WishlistItem[] =
    homeData?.items.map((item) => transformApiItemToWishlistItem(item)) ?? []

  // 「今月やること」アイテム
  const monthlyGoalItems = items.filter((item) => item.isMonthlyGoal)

  // カテゴリー別アイテム
  const categorizedItems = groupItemsByCategory(items, categories)

  // Pull To Refresh ハンドラー
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

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

  // アイテム更新ハンドラー
  const handleItemUpdate = useCallback(
    (_updatedItem: WishlistItem) => {
      // サーバーから最新データを取得
      refetch()
    },
    [refetch],
  )

  // アイテム削除ハンドラー
  const handleItemDelete = useCallback(
    (_itemId: string) => {
      // サーバーから最新データを取得
      refetch()
    },
    [refetch],
  )

  // ステップ変更ハンドラー
  const handleStepsChange = useCallback(
    (_itemId: string, _steps: Step[]) => {
      // サーバーから最新データを取得
      refetch()
    },
    [refetch],
  )

  // 候補変更ハンドラー
  const handleSuggestionsChange = useCallback(
    (_itemId: string, _suggestions: StepSuggestion[]) => {
      // サーバーから最新データを取得
      refetch()
    },
    [refetch],
  )

  // 視差効果：上部セクションがゆっくり動く
  const heroTranslateY = scrollY.interpolate({
    inputRange: [0, HERO_SECTION_HEIGHT],
    outputRange: [0, HERO_SECTION_HEIGHT * 0.4],
    extrapolate: 'clamp',
  })

  // 視差効果：上部セクションのフェードアウト
  const heroOpacity = scrollY.interpolate({
    inputRange: [0, HERO_SECTION_HEIGHT * 0.6],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  })

  // ローディング状態
  if (isLoading) {
    return (
      <SafeAreaView className={`flex-1 ${colors.background}`} edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primaryHex} />
          <Text className={`mt-4 text-base ${colors.textMuted}`}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // エラー状態
  if (isError) {
    return (
      <SafeAreaView className={`flex-1 ${colors.background}`} edges={['top']}>
        <View className="flex-1 items-center justify-center px-8">
          <AlertCircle size={48} color="#DC2626" />
          <Text className={`mt-4 text-center text-lg font-medium ${colors.text}`}>
            エラーが発生しました
          </Text>
          <Text className={`mt-2 text-center text-sm ${colors.textMuted}`}>
            {error?.message ?? '不明なエラー'}
          </Text>
          <Pressable
            className={`mt-6 flex-row items-center rounded-full ${colors.primary} px-6 py-3 ${colors.primaryActive}`}
            onPress={() => refetch()}
          >
            <RefreshCw size={18} color="#FFFFFF" />
            <Text className="ml-2 font-medium text-white">再試行</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`} edges={['top']}>
      <View className="flex-1">
        {/* 背景の今月やることセクション（固定・視差効果） */}
        <Animated.View
          className={`absolute left-0 right-0 top-0 ${colors.background} px-5 pt-2`}
          style={{
            height: HERO_SECTION_HEIGHT,
            transform: [{ translateY: heroTranslateY }],
            opacity: heroOpacity,
          }}
          pointerEvents="box-none"
        >
          {/* ヘッダー行のスペーサー（実際のヘッダーは下に配置） */}
          <View className="mb-4 h-12" />

          {/* 今月やることリスト（2段横スクロール、最大10件） */}
          {monthlyGoalItems.length > 0 ? (
            <TwoRowScrollView
              items={monthlyGoalItems.slice(0, 10)}
              categories={categories}
              onItemPress={handleItemPress}
            />
          ) : (
            <View className={`rounded-2xl border-2 border-dashed ${colors.border} bg-white p-8`}>
              <View className="items-center">
                <Sparkles size={40} color={colors.primaryHex} />
                <Text className={`mt-4 text-center text-lg font-medium ${colors.text}`}>
                  今月の目標がありません
                </Text>
                <Text className={`mt-2 text-center text-sm ${colors.textMuted}`}>
                  カテゴリーからアイテムを追加してね
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* スクロール可能なコンテンツ */}
        <Animated.ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primaryHex}
              colors={[colors.primaryHex]}
            />
          }
        >
          {/* スペーサー（今月やることセクションの高さ分） */}
          <View style={{ height: HERO_SECTION_HEIGHT - 20 }} />

          {/* カテゴリー別セクション */}
          <View
            className={`rounded-t-3xl ${colors.card} px-5 pt-5`}
            style={{ minHeight: windowHeight - 100 }}
          >
            <Text className={`mb-4 text-lg font-bold ${colors.text}`}>
              すべてのウィッシュリスト
            </Text>
            {categorizedItems.map((categoryWithItems) => (
              <CategorySection
                key={categoryWithItems.category.id}
                categoryWithItems={categoryWithItems}
                onItemPress={handleItemPress}
              />
            ))}
          </View>
        </Animated.ScrollView>

        {/* ヘッダー行（ScrollViewの上に配置してタッチ可能にする） */}
        <View
          className="absolute left-0 right-0 top-0 flex-row items-center justify-between px-5 pt-2"
          pointerEvents="box-none"
        >
          {/* 左側：タイトル（3連打でデバッグ画面を表示） */}
          <Pressable onPress={handleDebugAreaPress}>
            <Text className={`text-2xl font-bold ${colors.text}`}>今月やること</Text>
          </Pressable>
          <Pressable
            className="rounded-full bg-white p-2.5 shadow-sm active:bg-stone-50"
            onPress={() => router.push('/settings')}
          >
            <User size={22} color={colors.secondaryHex} />
          </Pressable>
        </View>
      </View>

      {/* アイテム詳細シートモーダル */}
      <ItemDetailSheet
        ref={bottomSheetRef}
        item={selectedItem}
        categories={categories}
        onClose={handleCloseSheet}
        onItemUpdate={handleItemUpdate}
        onItemDelete={handleItemDelete}
        onStepsChange={handleStepsChange}
        onSuggestionsChange={handleSuggestionsChange}
      />

      {/* デバッグ画面（3連打で表示） */}
      <DebugScreen visible={isDebugScreenVisible} onClose={() => setIsDebugScreenVisible(false)} />
    </SafeAreaView>
  )
}
