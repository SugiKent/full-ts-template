/**
 * ユーザー側API共通スキーマ定義（Zod）
 *
 * 一般ユーザー向けAPIのスキーマ
 * プロジェクトに応じてスキーマを追加してください
 */

import { z } from 'zod'

// ============================================================================
// 共通スキーマ
// ============================================================================

/**
 * 汎用的な成功レスポンススキーマ
 */
export const SuccessResponseSchema = z.object({
  success: z.boolean(),
})

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>

// ============================================================================
// TODO: プロジェクト固有のスキーマをここに追加
// ============================================================================

// 例: プロフィール取得レスポンス
// export const GetProfileResponseSchema = z.object({
//   id: z.string(),
//   name: z.string(),
//   email: z.string().email(),
// })
// export type GetProfileResponse = z.infer<typeof GetProfileResponseSchema>

// 例: プロフィール更新リクエスト
// export const UpdateProfileInputSchema = z.object({
//   name: z.string().min(1).max(100).optional(),
// })
// export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>
