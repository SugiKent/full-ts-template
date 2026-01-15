/**
 * タイムラインエントリーカード
 *
 * ジャーナル、アイテム完了、ステップ完了の3種類のエントリーを表示
 */

import { BookOpen, CheckCircle2, Circle, MoreVertical } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { useTheme } from '@/providers/ThemeProvider'

/**
 * ジャーナルエントリーの型
 */
interface JournalEntryData {
  id: string
  title: string | null
  content: string
  createdAt: string
  updatedAt: string
}

/**
 * アイテム完了ログの型
 */
interface ItemCompletedLogData {
  id: string
  itemId: string
  title: string
  completedAt: string
}

/**
 * ステップ完了ログの型
 */
interface StepCompletedLogData {
  id: string
  stepId: string
  itemId: string
  title: string
  itemTitle: string
  completedAt: string
}

/**
 * タイムラインエントリーの統合型
 */
export type TimelineEntry =
  | { type: 'journal'; id: string; timestamp: string; data: JournalEntryData }
  | { type: 'item_completed'; id: string; timestamp: string; data: ItemCompletedLogData }
  | { type: 'step_completed'; id: string; timestamp: string; data: StepCompletedLogData }

interface TimelineEntryCardProps {
  entry: TimelineEntry
  onPress?: () => void
  onLongPress?: () => void
}

/**
 * 時刻フォーマット（HH:mm）
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

/**
 * ジャーナルエントリーカード
 * テーマカラーを使用
 */
function JournalCard({
  data,
  timestamp,
  onPress,
  onLongPress,
}: {
  data: JournalEntryData
  timestamp: string
  onPress?: () => void
  onLongPress?: () => void
}) {
  const { colors } = useTheme()
  // 長いコンテンツは3行で切り詰め
  const truncatedContent =
    data.content.length > 150 ? `${data.content.slice(0, 150)}...` : data.content

  return (
    <Pressable
      className={`mb-3 rounded-2xl border ${colors.dividerBorder} ${colors.card} p-4 shadow-sm ${colors.cardActive}`}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className={`mr-2 rounded-full ${colors.iconBg} p-1.5`}>
            <BookOpen size={16} color={colors.iconColor} />
          </View>
          <Text className={`text-xs ${colors.textMuted}`}>{formatTime(timestamp)}</Text>
        </View>
        <Pressable className={`rounded-full p-1 ${colors.cardActive}`} onPress={onLongPress}>
          <MoreVertical size={16} color={colors.secondaryHex} />
        </Pressable>
      </View>

      {data.title && (
        <Text className={`mb-1 text-base font-semibold ${colors.text}`}>{data.title}</Text>
      )}

      <Text className={`leading-relaxed ${colors.secondary}`} numberOfLines={3}>
        {truncatedContent}
      </Text>
    </Pressable>
  )
}

/**
 * アイテム完了カード
 * セマンティックカラー（緑）を維持して「完了」の意味を明確に
 */
function ItemCompletedCard({
  data,
  timestamp,
  onPress,
}: {
  data: ItemCompletedLogData
  timestamp: string
  onPress?: () => void
}) {
  const { colors } = useTheme()
  return (
    <Pressable
      className="mb-3 flex-row items-center rounded-2xl border border-green-100 bg-green-50 p-4 active:bg-green-100"
      onPress={onPress}
    >
      <View className="mr-3 rounded-full bg-green-500 p-1.5">
        <CheckCircle2 size={18} color="#FFFFFF" />
      </View>

      <View className="flex-1">
        <Text className={`text-base font-medium ${colors.text}`}>{data.title}</Text>
        <Text className={`mt-0.5 text-xs ${colors.textMuted}`}>達成しました 🎉</Text>
      </View>

      <Text className={`text-xs ${colors.textMuted}`}>{formatTime(timestamp)}</Text>
    </Pressable>
  )
}

/**
 * ステップ完了カード
 * セマンティックカラー（青）を維持して「進捗」の意味を明確に
 */
function StepCompletedCard({
  data,
  timestamp,
  onPress,
}: {
  data: StepCompletedLogData
  timestamp: string
  onPress?: () => void
}) {
  const { colors } = useTheme()
  return (
    <Pressable
      className="mb-3 flex-row items-center rounded-2xl border border-blue-100 bg-blue-50 p-4 active:bg-blue-100"
      onPress={onPress}
    >
      <View className="mr-3 rounded-full bg-blue-500 p-1.5">
        <Circle size={18} color="#FFFFFF" fill="#FFFFFF" />
      </View>

      <View className="flex-1">
        <Text className={`text-sm font-medium ${colors.text}`}>{data.title}</Text>
        <Text className={`mt-0.5 text-xs ${colors.textMuted}`}>{data.itemTitle}</Text>
      </View>

      <Text className={`text-xs ${colors.textMuted}`}>{formatTime(timestamp)}</Text>
    </Pressable>
  )
}

/**
 * タイムラインエントリーカード
 * entry.type に応じて適切なカードを表示
 */
export function TimelineEntryCard({ entry, onPress, onLongPress }: TimelineEntryCardProps) {
  switch (entry.type) {
    case 'journal':
      return (
        <JournalCard
          data={entry.data}
          timestamp={entry.timestamp}
          {...(onPress && { onPress })}
          {...(onLongPress && { onLongPress })}
        />
      )
    case 'item_completed':
      return (
        <ItemCompletedCard
          data={entry.data}
          timestamp={entry.timestamp}
          {...(onPress && { onPress })}
        />
      )
    case 'step_completed':
      return (
        <StepCompletedCard
          data={entry.data}
          timestamp={entry.timestamp}
          {...(onPress && { onPress })}
        />
      )
    default:
      return null
  }
}
