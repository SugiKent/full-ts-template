/**
 * 管理画面API型定義
 */

/**
 * ページネーション共通レスポンス型
 */
export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * ユーザー情報
 */
export type UserInfo = {
  id: string
  name: string
  email: string
  role: string
  createdAt: string // ISO 8601形式
  updatedAt: string // ISO 8601形式
}

/**
 * ダッシュボード統計
 */
export type DashboardStats = {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
}
