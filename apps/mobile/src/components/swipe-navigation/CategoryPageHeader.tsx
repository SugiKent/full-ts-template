import { Edit3 } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { useTheme } from '@/providers/ThemeProvider'
import type { Category } from '@/types/wishlist'

interface CategoryPageHeaderProps {
  category: Category
  itemCount: number
  completedCount: number
  onEditPress?: () => void
}

/**
 * カテゴリーページヘッダー
 * アイコン、タイトル、意気込み（description）を表示
 */
export function CategoryPageHeader({
  category,
  itemCount,
  completedCount,
  onEditPress,
}: CategoryPageHeaderProps) {
  const { colors } = useTheme()

  return (
    <View className={`border-b ${colors.dividerBorder} ${colors.card} px-5 pb-6 pt-4`}>
      {/* アイコンとタイトル */}
      <View className="mb-3 flex-row items-center">
        <View
          className={`mr-4 h-14 w-14 items-center justify-center rounded-2xl ${colors.badgeBg}`}
        >
          <Text className="text-3xl">{category.icon}</Text>
        </View>
        <View className="flex-1">
          <Text className={`text-2xl font-bold ${colors.text}`}>{category.name}</Text>
          <View className="mt-1 flex-row items-center">
            <Text className={`text-sm ${colors.textMuted}`}>{itemCount}件</Text>
            {completedCount > 0 && (
              <>
                <View className={`mx-2 h-1 w-1 rounded-full ${colors.divider}`} />
                <Text className={`text-sm font-medium ${colors.primaryText}`}>
                  {completedCount}件完了
                </Text>
              </>
            )}
          </View>
        </View>
        {/* 編集ボタン */}
        {onEditPress && (
          <Pressable
            className={`rounded-full ${colors.badgeBg} p-2.5 ${colors.cardActive}`}
            onPress={onEditPress}
          >
            <Edit3 size={20} color={colors.secondaryHex} />
          </Pressable>
        )}
      </View>

      {/* 意気込みコメント（description） */}
      {category.description && (
        <View className={`rounded-xl ${colors.badgeBg} p-4`}>
          <Text className={`text-sm leading-relaxed ${colors.secondary}`}>
            {category.description}
          </Text>
        </View>
      )}
    </View>
  )
}
