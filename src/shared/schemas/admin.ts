/**
 * 管理画面API共通スキーマ定義（Zod）
 *
 * サーバー・クライアント間で型を共有するためのスキーマ
 * プロジェクトに応じてスキーマを追加してください
 */

import { z } from 'zod'

// ============================================================================
// 共通スキーマ（ページネーションなど）
// ============================================================================

/**
 * ページネーション情報スキーマ
 */
export const PaginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
})

export type Pagination = z.infer<typeof PaginationSchema>

/**
 * ページネーション付きレスポンススキーマファクトリ
 * 使用例: createPaginatedResponseSchema(UserSchema)
 */
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: PaginationSchema,
  })

/**
 * 汎用的な成功レスポンススキーマ
 */
export const SuccessResponseSchema = z.object({
  success: z.boolean(),
})

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>

/**
 * 汎用的なID入力スキーマ
 */
export const IdInputSchema = z.object({
  id: z.string().min(1, 'IDは必須です'),
})

export type IdInput = z.infer<typeof IdInputSchema>

// ============================================================================
// TODO: プロジェクト固有のスキーマをここに追加
// ============================================================================

// 例: ユーザースキーマ
// export const UserSchema = z.object({
//   id: z.string(),
//   name: z.string(),
//   email: z.string().email(),
//   createdAt: z.string(), // ISO 8601形式
//   updatedAt: z.string(), // ISO 8601形式
// })
// export type User = z.infer<typeof UserSchema>

// 例: ユーザー一覧取得リクエスト
// export const ListUsersInputSchema = z.object({
//   page: z.number().int().min(1).default(1),
//   limit: z.number().int().min(1).max(100).default(50),
//   search: z.string().optional(),
// })
// export type ListUsersInput = z.infer<typeof ListUsersInputSchema>

// 例: ユーザー一覧レスポンス
// export const ListUsersOutputSchema = createPaginatedResponseSchema(UserSchema)
// export type ListUsersOutput = z.infer<typeof ListUsersOutputSchema>
