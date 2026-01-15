/**
 * タイムラインページ
 *
 * ジャーナルエントリーと完了ログを時系列で表示
 * SwipeNavigator の左端ページとして使用
 */

import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import { AlertCircle, BookOpen, RefreshCw } from 'lucide-react-native'
import { useCallback, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTimeline } from '@/hooks/useApi'
import { useTheme } from '@/providers/ThemeProvider'
import { JournalInputSheet } from './JournalInputSheet'
import { type TimelineEntry, TimelineEntryCard } from './TimelineEntryCard'

/**
 * 日付セパレーター
 * 日付が変わる箇所に表示
 */
function DateSeparator({ date }: { date: string }) {
  const { colors } = useTheme()
  return (
    <View className="mb-3 mt-4 flex-row items-center px-1">
      <View className={`h-px flex-1 ${colors.divider}`} />
      <Text className={`mx-3 text-sm font-medium ${colors.textMuted}`}>{date}</Text>
      <View className={`h-px flex-1 ${colors.divider}`} />
    </View>
  )
}

/**
 * 空状態の表示
 */
function EmptyState({
  onCreatePress,
  colors,
}: {
  onCreatePress: () => void
  colors: ReturnType<typeof useTheme>['colors']
}) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className={`mb-4 rounded-full ${colors.backgroundDark} p-4`}>
        <BookOpen size={40} color={colors.primaryHex} />
      </View>
      <Text className={`mb-2 text-center text-lg font-semibold ${colors.text}`}>
        タイムラインはまだ空です
      </Text>
      <Text className={`mb-6 text-center leading-relaxed ${colors.textMuted}`}>
        日々の振り返りや気づきを記録してみましょう。{'\n'}
        完了したタスクも自動で表示されます。
      </Text>
      <Pressable
        className={`flex-row items-center rounded-full ${colors.primary} px-6 py-3 ${colors.primaryActive}`}
        onPress={onCreatePress}
      >
        <BookOpen size={18} color="#FFFFFF" />
        <Text className="ml-2 font-medium text-white">ジャーナルを書く</Text>
      </Pressable>
    </View>
  )
}

/**
 * タイムラインエントリーを日付別にグループ化
 */
function groupEntriesByDate(
  entries: TimelineEntry[],
): { date: string; entries: TimelineEntry[] }[] {
  const groups = new Map<string, TimelineEntry[]>()

  for (const entry of entries) {
    const date = new Date(entry.timestamp)
    const dateKey = formatDateKey(date)

    const existing = groups.get(dateKey)
    if (existing) {
      existing.push(entry)
    } else {
      groups.set(dateKey, [entry])
    }
  }

  return Array.from(groups.entries())
    .map(([date, entries]) => ({ date, entries }))
    .sort((a, b) => {
      // 新しい日付が先
      const dateA = parseDateKey(a.date)
      const dateB = parseDateKey(b.date)
      return dateB.getTime() - dateA.getTime()
    })
}

/**
 * 日付キー生成（今日/昨日/MM月DD日）
 */
function formatDateKey(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const diffDays = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今日'
  if (diffDays === 1) return '昨日'
  if (diffDays < 7) return `${diffDays}日前`

  return `${date.getMonth() + 1}月${date.getDate()}日`
}

/**
 * 日付キーをパース
 */
function parseDateKey(key: string): Date {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (key === '今日') return today
  if (key === '昨日') return new Date(today.getTime() - 1000 * 60 * 60 * 24)

  const daysAgoMatch = key.match(/^(\d+)日前$/)
  if (daysAgoMatch?.[1]) {
    const days = Number.parseInt(daysAgoMatch[1], 10)
    return new Date(today.getTime() - days * 1000 * 60 * 60 * 24)
  }

  const monthDayMatch = key.match(/^(\d+)月(\d+)日$/)
  if (monthDayMatch?.[1] && monthDayMatch[2]) {
    const month = Number.parseInt(monthDayMatch[1], 10) - 1
    const day = Number.parseInt(monthDayMatch[2], 10)
    return new Date(now.getFullYear(), month, day)
  }

  return today
}

/**
 * FlatList 用のアイテム型
 */
type ListItem = { type: 'date'; date: string } | { type: 'entry'; entry: TimelineEntry }

/**
 * タイムラインページ
 */
export function TimelinePage() {
  const journalSheetRef = useRef<BottomSheetModal>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [editEntry, setEditEntry] = useState<{
    id: string
    title: string | null
    content: string
  } | null>(null)
  const { colors } = useTheme()

  // タイムラインデータ取得
  const { data: timelineData, isLoading, isError, error, refetch } = useTimeline()

  // エントリーを日付別にグループ化してフラットリスト用に変換
  const listData = useMemo<ListItem[]>(() => {
    if (!timelineData?.entries) return []

    const groups = groupEntriesByDate(timelineData.entries)
    const items: ListItem[] = []

    for (const group of groups) {
      items.push({ type: 'date', date: group.date })
      for (const entry of group.entries) {
        items.push({ type: 'entry', entry })
      }
    }

    return items
  }, [timelineData?.entries])

  // Pull To Refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

  // ジャーナル作成モーダルを開く
  const handleCreateJournal = useCallback(() => {
    setEditEntry(null)
    journalSheetRef.current?.present()
  }, [])

  // ジャーナル編集モーダルを開く
  const handleEditJournal = useCallback((entry: TimelineEntry) => {
    if (entry.type !== 'journal') return

    setEditEntry({
      id: entry.data.id,
      title: entry.data.title,
      content: entry.data.content,
    })
    journalSheetRef.current?.present()
  }, [])

  // モーダル閉じる
  const handleCloseSheet = useCallback(() => {
    journalSheetRef.current?.dismiss()
    setEditEntry(null)
  }, [])

  // 保存後にリフレッシュ
  const handleSaved = useCallback(() => {
    refetch()
  }, [refetch])

  // エントリータップ
  const handleEntryPress = useCallback(
    (entry: TimelineEntry) => {
      if (entry.type === 'journal') {
        handleEditJournal(entry)
      }
      // TODO: item_completed / step_completed の場合はアイテム詳細を開く
    },
    [handleEditJournal],
  )

  // エントリー長押し（ジャーナルの編集メニュー）
  const handleEntryLongPress = useCallback(
    (entry: TimelineEntry) => {
      if (entry.type === 'journal') {
        handleEditJournal(entry)
      }
    },
    [handleEditJournal],
  )

  // リストアイテムのレンダリング
  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'date') {
        return <DateSeparator date={item.date} />
      }

      return (
        <TimelineEntryCard
          entry={item.entry}
          onPress={() => handleEntryPress(item.entry)}
          onLongPress={() => handleEntryLongPress(item.entry)}
        />
      )
    },
    [handleEntryPress, handleEntryLongPress],
  )

  // キー抽出
  const keyExtractor = useCallback((item: ListItem) => {
    if (item.type === 'date') {
      return `date-${item.date}`
    }
    return item.entry.id
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
      {/* ヘッダー */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text className={`text-2xl font-bold ${colors.text}`}>タイムライン</Text>
        <Pressable
          className={`flex-row items-center rounded-full ${colors.primary} px-4 py-2 ${colors.primaryActive}`}
          onPress={handleCreateJournal}
        >
          <BookOpen size={16} color="#FFFFFF" />
          <Text className="ml-1.5 text-sm font-medium text-white">書く</Text>
        </Pressable>
      </View>

      {/* タイムラインリスト */}
      {listData.length === 0 ? (
        <EmptyState onCreatePress={handleCreateJournal} colors={colors} />
      ) : (
        <FlatList
          data={listData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primaryHex}
              colors={[colors.primaryHex]}
            />
          }
        />
      )}

      {/* ジャーナル入力シート */}
      <JournalInputSheet
        ref={journalSheetRef}
        onClose={handleCloseSheet}
        onSaved={handleSaved}
        editEntry={editEntry}
      />
    </SafeAreaView>
  )
}
