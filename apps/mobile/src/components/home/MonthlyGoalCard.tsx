import { Check } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { useTheme } from '@/providers/ThemeProvider'
import type { Category, WishlistItem } from '@/types/wishlist'
import { getItemProgress } from '@/utils/wishlist'
import { CircularProgress } from './CircularProgress'

interface MonthlyGoalCardProps {
  item: WishlistItem
  category: Category | undefined
  index: number
  onPress?: () => void
}

/**
 * 今月やることカード
 * テーマカラーを使用した統一感のあるデザイン
 */
export function MonthlyGoalCard({ item, category, index: _index, onPress }: MonthlyGoalCardProps) {
  const { colors } = useTheme()
  const progress = getItemProgress(item)

  return (
    <Pressable
      className={`mr-3 h-40 w-44 rounded-2xl border ${colors.badgeBg} ${colors.cardBorder} p-4 shadow-sm active:scale-[0.98]`}
      onPress={onPress}
    >
      {/* カテゴリーアイコン＆進捗ドーナツチャート */}
      <View className="mb-3 flex-row items-start justify-between">
        <View
          className={`h-10 w-10 items-center justify-center rounded-xl ${colors.card} shadow-sm`}
        >
          <Text className="text-xl">{category?.icon ?? '✨'}</Text>
        </View>
        {item.isCompleted ? (
          <View className={`h-10 w-10 items-center justify-center rounded-full ${colors.primary}`}>
            <Check size={20} color="white" />
          </View>
        ) : (
          <CircularProgress
            progress={progress}
            size={40}
            strokeWidth={4}
            color={colors.primaryHex}
            backgroundColor={colors.dividerHex}
          />
        )}
      </View>

      {/* タイトル */}
      <Text
        className={`text-base font-semibold leading-tight ${
          item.isCompleted ? `${colors.textMuted} line-through` : colors.text
        }`}
        numberOfLines={3}
      >
        {item.title}
      </Text>
    </Pressable>
  )
}
