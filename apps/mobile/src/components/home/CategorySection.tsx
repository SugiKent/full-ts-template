import { ChevronDown, ChevronUp } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTheme } from '@/providers/ThemeProvider'
import type { CategoryWithItems, WishlistItem } from '@/types/wishlist'
import { WishlistItemCard } from './WishlistItemCard'

interface CategorySectionProps {
  categoryWithItems: CategoryWithItems
  onItemPress?: (item: WishlistItem) => void
}

/**
 * カテゴリーセクション
 * シンプルで見やすいアコーディオン形式
 */
export function CategorySection({ categoryWithItems, onItemPress }: CategorySectionProps) {
  const { colors } = useTheme()
  const { category, items } = categoryWithItems
  const [isExpanded, setIsExpanded] = useState(true)

  if (items.length === 0) {
    return null
  }

  return (
    <View className="mb-4">
      {/* カテゴリーヘッダー */}
      <Pressable
        className="flex-row items-center justify-between py-3 active:opacity-70"
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View className="flex-row items-center">
          {/* カテゴリーアイコン */}
          <View
            className={`mr-3 h-11 w-11 items-center justify-center rounded-xl ${colors.badgeBg}`}
          >
            <Text className="text-xl">{category.icon}</Text>
          </View>

          {/* カテゴリー情報 */}
          <View>
            <Text className={`text-base font-semibold ${colors.text}`}>{category.name}</Text>
            <Text className={`text-xs ${colors.textMuted}`}>{items.length}件</Text>
          </View>
        </View>

        {/* 開閉アイコン */}
        <View className={`h-8 w-8 items-center justify-center rounded-full ${colors.badgeBg}`}>
          {isExpanded ? (
            <ChevronUp size={18} color={colors.secondaryHex} />
          ) : (
            <ChevronDown size={18} color={colors.secondaryHex} />
          )}
        </View>
      </Pressable>

      {/* アイテム一覧 */}
      {isExpanded && (
        <View className="mt-1">
          {items.map((item, index) => (
            <WishlistItemCard
              key={item.id}
              item={item}
              category={category}
              onPress={() => onItemPress?.(item)}
              isLast={index === items.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  )
}
