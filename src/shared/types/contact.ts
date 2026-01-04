/**
 * お問い合わせ・サポート機能の型定義
 */

// ========================================
// カテゴリ定義
// ========================================

/** お問い合わせカテゴリ */
export const CONTACT_CATEGORIES = {
  /** 技術的な問題 */
  TECHNICAL: 'technical',
  /** 料金について */
  BILLING: 'billing',
  /** 機能リクエスト */
  FEATURE_REQUEST: 'feature_request',
  /** その他 */
  OTHER: 'other',
} as const

export type ContactCategory = (typeof CONTACT_CATEGORIES)[keyof typeof CONTACT_CATEGORIES]

/** カテゴリの表示名 */
export const CONTACT_CATEGORY_LABELS: Record<ContactCategory, string> = {
  [CONTACT_CATEGORIES.TECHNICAL]: '技術的な問題',
  [CONTACT_CATEGORIES.BILLING]: '料金について',
  [CONTACT_CATEGORIES.FEATURE_REQUEST]: '機能リクエスト',
  [CONTACT_CATEGORIES.OTHER]: 'その他',
}

// ========================================
// ステータス定義
// ========================================

/** お問い合わせステータス */
export const CONTACT_STATUS = {
  /** 未対応 */
  OPEN: 'open',
  /** 対応中 */
  IN_PROGRESS: 'in_progress',
  /** 解決済み */
  RESOLVED: 'resolved',
  /** クローズ */
  CLOSED: 'closed',
} as const

export type ContactStatus = (typeof CONTACT_STATUS)[keyof typeof CONTACT_STATUS]

/** ステータスの表示名 */
export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  [CONTACT_STATUS.OPEN]: '未対応',
  [CONTACT_STATUS.IN_PROGRESS]: '対応中',
  [CONTACT_STATUS.RESOLVED]: '解決済み',
  [CONTACT_STATUS.CLOSED]: 'クローズ',
}

// ========================================
// 送信者タイプ定義
// ========================================

/** メッセージ送信者タイプ */
const SENDER_TYPE = {
  /** ユーザー */
  USER: 'user',
  /** 管理者 */
  ADMIN: 'admin',
} as const

export type SenderType = (typeof SENDER_TYPE)[keyof typeof SENDER_TYPE]

// ========================================
// スレッド関連の型
// ========================================

/** スレッド情報 */
export interface ContactThreadInfo {
  id: string
  userId: string
  category: ContactCategory
  subject: string
  status: ContactStatus
  createdAt: Date
  updatedAt: Date
  unreadCount?: number | undefined
  lastMessage?: ContactMessageInfo | undefined
  user?:
    | {
        name: string
        email: string
      }
    | undefined
}

/** スレッド一覧フィルタ */
export interface ThreadListFilter {
  status?: ContactStatus
  category?: ContactCategory
}

/** ページネーション */
export interface PaginationParams {
  page: number
  limit: number
}

// ========================================
// メッセージ関連の型
// ========================================

/** メッセージ情報 */
export interface ContactMessageInfo {
  id: string
  threadId: string
  senderType: SenderType
  senderId: string | null
  content: string
  isRead: boolean
  createdAt: Date
}
