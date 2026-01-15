import { Check, ChevronRight, Star } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { useTheme } from '@/providers/ThemeProvider'
import type { Category, WishlistItem } from '@/types/wishlist'
import { getItemProgress } from '@/utils/wishlist'
import { CircularProgress } from './CircularProgress'

interface WishlistItemCardProps {
  item: WishlistItem
  category?: Category | undefined
  onPress?: (() => void) | undefined
  /** 最後のアイテムかどうか（ディバイダー非表示用） */
  isLast?: boolean | undefined
}

/**
 * ウィッシュリストアイテムカード
 * シンプルなリストスタイル
 */
export function WishlistItemCard({
  item,
  category: _category,
  onPress,
  isLast = false,
}: WishlistItemCardProps) {
  const { colors } = useTheme()
  const progress = getItemProgress(item)

  return (
    <Pressable
      className={colors.cardActive}
      onPress={onPress}
      style={{ transform: [{ scale: 1 }] }}
    >
      <View
        className={`flex-row items-center py-3 ${!isLast ? `border-b ${colors.dividerBorder}` : ''}`}
      >
        {/* 左側：進捗インジケーター */}
        {item.isCompleted ? (
          <View
            className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${colors.primary}`}
          >
            <Check size={18} color="white" strokeWidth={3} />
          </View>
        ) : (
          <View className="mr-3">
            <CircularProgress
              progress={progress}
              size={40}
              strokeWidth={3}
              color={colors.primaryHex}
              backgroundColor={colors.dividerHex}
            />
          </View>
        )}

        {/* 中央：タイトルとバッジ */}
        <View className="flex-1">
          <Text
            className={`text-base leading-tight font-medium ${
              item.isCompleted ? `${colors.textMuted} line-through` : colors.text
            }`}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {/* 今月やることバッジ */}
          {item.isMonthlyGoal && !item.isCompleted && (
            <View className="mt-1.5 flex-row items-center">
              <Star size={12} color={colors.iconColor} fill={colors.iconColor} />
              <Text className={`ml-1 text-xs font-medium ${colors.badgeText}`}>今月やること</Text>
            </View>
          )}
        </View>

        {/* 右側：矢印 */}
        <View className="ml-2">
          <ChevronRight size={20} color={colors.secondaryHex} />
        </View>
      </View>
    </Pressable>
  )
}
