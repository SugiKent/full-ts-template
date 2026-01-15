/**
 * タイムライン関連の型定義
 *
 * モバイルアプリとサーバー間で共有する型
 */

/**
 * タイムラインエントリーのタイプ
 */
export const TIMELINE_ENTRY_TYPES = ['journal', 'item_completed', 'step_completed'] as const
export type TimelineEntryType = (typeof TIMELINE_ENTRY_TYPES)[number]

/**
 * ジャーナルエントリー
 */
export type JournalEntry = {
  id: string
  title: string | null
  content: string
  createdAt: string
  updatedAt: string
}

/**
 * アイテム完了ログ
 */
export type ItemCompletedLog = {
  id: string
  itemId: string
  title: string
  completedAt: string
}

/**
 * ステップ完了ログ
 */
export type StepCompletedLog = {
  id: string
  stepId: string
  itemId: string
  title: string
  itemTitle: string
  completedAt: string
}

/**
 * タイムラインエントリー（統合型）
 */
export type TimelineEntry =
  | {
      type: 'journal'
      id: string
      timestamp: string
      data: JournalEntry
    }
  | {
      type: 'item_completed'
      id: string
      timestamp: string
      data: ItemCompletedLog
    }
  | {
      type: 'step_completed'
      id: string
      timestamp: string
      data: StepCompletedLog
    }

/**
 * タイムライン取得レスポンス
 */
export type GetTimelineResponse = {
  success: true
  data: {
    entries: TimelineEntry[]
    nextCursor: string | null
    hasMore: boolean
  }
}

/**
 * ジャーナルエントリー作成入力
 */
export type CreateJournalEntryInput = {
  title?: string
  content: string
}

/**
 * ジャーナルエントリー更新入力
 */
export type UpdateJournalEntryInput = {
  id: string
  title?: string | null
  content?: string
}

/**
 * ジャーナルエントリー削除入力
 */
export type DeleteJournalEntryInput = {
  id: string
}

/**
 * ジャーナルエントリーレスポンス
 */
export type JournalEntryResponse = {
  success: true
  data: JournalEntry
}

/**
 * ジャーナルの最大文字数
 */
export const JOURNAL_MAX_CONTENT_LENGTH = 5000 as const
