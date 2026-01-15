import { Calendar, Sparkles } from 'lucide-react-native'
import { ScrollView, Text, View } from 'react-native'
import type { Category, WishlistItem } from '@/types/wishlist'
import { getRemainingDaysInMonth } from '@/utils/wishlist'
import { MonthlyGoalCard } from './MonthlyGoalCard'

interface MonthlyGoalsHeaderProps {
  items: WishlistItem[]
  categories: Category[]
  onItemPress?: (item: WishlistItem) => void
}

/**
 * 「今月やること」ヘッダーセクション
 * ターゲット（30代女性会社員、20代学生、40代主婦/主夫）に刺さる
 * 感情に訴えるデザイン - 夢や目標を持つワクワク感を演出
 */
export function MonthlyGoalsHeader({ items, categories, onItemPress }: MonthlyGoalsHeaderProps) {
  const remainingDays = getRemainingDaysInMonth()
  const currentMonth = new Date().toLocaleDateString('ja-JP', { month: 'long' })

  // カテゴリーIDからCategoryを取得するヘルパー
  const getCategoryById = (categoryId: string): Category | undefined =>
    categories.find((cat) => cat.id === categoryId)

  // 完了したアイテム数
  const completedCount = items.filter((item) => item.isCompleted).length
  const totalCount = items.length

  return (
    <View className="mb-8">
      {/* ヒーローヘッダー */}
      <View className="mb-5 rounded-2xl bg-gray-900 p-5">
        {/* タイトル行 */}
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Sparkles size={20} color="#FBBF24" />
            <Text className="ml-2 text-lg font-bold text-white">今月やること</Text>
          </View>
          <View className="flex-row items-center rounded-full bg-white/10 px-3 py-1.5">
            <Calendar size={14} color="#9CA3AF" />
            <Text className="ml-1.5 text-sm font-medium text-gray-300">{currentMonth}</Text>
          </View>
        </View>

        {/* 進捗サマリー */}
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="mb-1 text-sm text-gray-400">達成</Text>
            <View className="flex-row items-baseline">
              <Text className="text-4xl font-bold text-white">{completedCount}</Text>
              <Text className="ml-1 text-lg text-gray-500">/ {totalCount}</Text>
            </View>
          </View>

          {/* 残り日数カウンター */}
          <View className="items-end">
            <Text className="mb-1 text-xs text-gray-400">残り</Text>
            <View className="flex-row items-baseline">
              <Text className="text-3xl font-bold text-amber-400">{remainingDays}</Text>
              <Text className="ml-1 text-sm text-gray-400">日</Text>
            </View>
          </View>
        </View>

        {/* モチベーションメッセージ */}
        {totalCount > 0 && (
          <View className="mt-4 border-t border-white/10 pt-3">
            <Text className="text-sm text-gray-300">
              {completedCount === 0
                ? 'さあ、最初の一歩を踏み出しましょう！'
                : completedCount === totalCount
                  ? '素晴らしい！今月の目標をすべて達成しました！'
                  : `あと${totalCount - completedCount}つ。いい調子です！`}
            </Text>
          </View>
        )}
      </View>

      {/* アイテム一覧（水平スクロール） */}
      {items.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {items.map((item, index) => {
            const primaryCategory = item.categoryIds[0]
              ? getCategoryById(item.categoryIds[0])
              : undefined
            return (
              <MonthlyGoalCard
                key={item.id}
                item={item}
                category={primaryCategory}
                index={index}
                onPress={() => onItemPress?.(item)}
              />
            )
          })}
        </ScrollView>
      ) : (
        <View className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8">
          <View className="items-center">
            <Sparkles size={32} color="#9CA3AF" />
            <Text className="mt-3 text-center text-base font-medium text-gray-500">
              今月やることを選びましょう
            </Text>
            <Text className="mt-1 text-center text-sm text-gray-400">
              ウィッシュリストから最大10個選択できます
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}
