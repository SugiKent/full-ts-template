import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import { BlurView } from 'expo-blur'
import { AlertCircle, Plus, RefreshCw } from 'lucide-react-native'
import { useCallback, useMemo, useRef } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import PagerView, {
  type PagerViewOnPageScrollEvent,
  type PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view'
import Animated, { useSharedValue } from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { CreateItemSheet } from '@/components/home/CreateItemSheet'
import { HomePageContent } from '@/components/home/HomePageContent'
import { TimelinePage } from '@/components/timeline'
import { useHomeData } from '@/hooks/useApi'
import { useTheme } from '@/providers/ThemeProvider'
import type { Category, WishlistItem } from '@/types/wishlist'
import { CategoryPage } from './CategoryPage'
import { PageIndicator } from './PageIndicator'

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView)

type PageConfig =
  | { type: 'timeline'; key: string }
  | { type: 'home'; key: string }
  | { type: 'category'; key: string; category: Category; items: WishlistItem[] }

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
 * 横スワイプナビゲーター
 * タイムライン ← HOME → カテゴリー1 → カテゴリー2 → ... の順でスワイプ遷移
 * 右下に新規作成ボタン（+）を配置
 */
export function SwipeNavigator() {
  const pagerRef = useRef<PagerView>(null)
  const createItemSheetRef = useRef<BottomSheetModal>(null)
  const scrollOffset = useSharedValue(0)
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()

  // サーバー API からホームデータを取得
  const { data: homeData, isLoading, isError, error, refetch } = useHomeData()

  // API レスポンスを UI 用の型に変換
  const categories: Category[] = useMemo(
    () =>
      homeData?.categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon ?? '📦',
      })) ?? [],
    [homeData?.categories],
  )

  const items: WishlistItem[] = useMemo(
    () => homeData?.items.map((item) => transformApiItemToWishlistItem(item)) ?? [],
    [homeData?.items],
  )

  // タイムライン + HOME + 全カテゴリーのページ配列（カテゴリーに属するアイテムも含む）
  const pages = useMemo<PageConfig[]>(
    () => [
      { type: 'timeline', key: 'timeline' },
      { type: 'home', key: 'home' },
      ...categories.map((cat) => ({
        type: 'category' as const,
        key: cat.id,
        category: cat,
        items: items.filter((item) => item.categoryIds.includes(cat.id)),
      })),
    ],
    [categories, items],
  )

  // ページアイコン（絵文字）の配列
  // タイムライン = 📖, HOME = 🏠, カテゴリー = 各アイコン
  const pageIcons = useMemo(
    () => [
      { id: 'timeline', icon: '📖' },
      { id: 'home', icon: '🏠' },
      ...categories.map((cat) => ({ id: cat.id, icon: cat.icon })),
    ],
    [categories],
  )

  // ページスクロール時の処理（アニメーション用）
  const handlePageScroll = useCallback(
    (e: PagerViewOnPageScrollEvent) => {
      const { position, offset } = e.nativeEvent
      scrollOffset.value = position + offset
    },
    [scrollOffset],
  )

  // ページ選択時の処理
  const handlePageSelected = useCallback((_e: PagerViewOnPageSelectedEvent) => {
    // 将来的にアナリティクスなどに使用可能
  }, [])

  // インジケータータップでページ遷移
  const handlePagePress = useCallback((index: number) => {
    pagerRef.current?.setPage(index)
  }, [])

  // 新規作成ボタンタップ
  const handleCreatePress = useCallback(() => {
    createItemSheetRef.current?.present()
  }, [])

  // 新規作成シートを閉じる
  const handleCloseCreateSheet = useCallback(() => {
    createItemSheetRef.current?.dismiss()
  }, [])

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
            データの取得に失敗しました
          </Text>
          <Text className={`mt-2 text-center text-sm ${colors.textMuted}`}>
            {error?.message ?? '不明なエラーが発生しました'}
          </Text>
          <Pressable
            className={`mt-6 flex-row items-center rounded-full ${colors.primary} px-6 py-3 ${colors.primaryActive}`}
            onPress={() => refetch()}
          >
            <RefreshCw size={18} color="#FFFFFF" />
            <Text className="ml-2 font-medium text-white">再読み込み</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <View className="flex-1">
      <AnimatedPagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={1}
        onPageScroll={handlePageScroll}
        onPageSelected={handlePageSelected}
        orientation="horizontal"
        overdrag
      >
        {pages.map((page) => (
          <View key={page.key} collapsable={false}>
            {page.type === 'timeline' ? (
              <TimelinePage />
            ) : page.type === 'home' ? (
              <HomePageContent />
            ) : (
              <CategoryPage category={page.category} items={page.items} />
            )}
          </View>
        ))}
      </AnimatedPagerView>

      {/* 下部ナビゲーションバー */}
      <View
        style={{
          position: 'absolute',
          bottom: insets.bottom + 8,
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 16,
          gap: 12,
        }}
      >
        {/* ページインジケーター（タブバー） */}
        <PageIndicator
          icons={pageIcons}
          scrollOffset={scrollOffset}
          onPagePress={handlePagePress}
        />

        {/* 新規作成ボタン（+） */}
        <View style={addButtonStyles.container}>
          <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          <Pressable
            style={addButtonStyles.button}
            onPress={handleCreatePress}
            android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true }}
          >
            <Plus size={28} color="#78716C" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      {/* 新規作成シートモーダル */}
      <CreateItemSheet ref={createItemSheetRef} onClose={handleCloseCreateSheet} />
    </View>
  )
}

const addButtonStyles = StyleSheet.create({
  container: {
    width: 56,
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
