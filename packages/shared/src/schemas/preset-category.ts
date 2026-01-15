/**
 * プリセットカテゴリー関連の Zod スキーマ定義
 *
 * サーバー・クライアント間で型を共有するためのスキーマ
 */

import { z } from 'zod'

/**
 * プリセットカテゴリースキーマ
 *
 * オンボーディング時にユーザーに提示するカテゴリー
 */
export const PresetCategorySchema = z.object({
  id: z.string(),
  title: z.string(),
  icon: z.string(),
})
export type PresetCategory = z.infer<typeof PresetCategorySchema>

/**
 * プリセットカテゴリー一覧レスポンススキーマ
 */
export const GetPresetCategoriesResponseSchema = z.object({
  categories: z.array(PresetCategorySchema),
})
export type GetPresetCategoriesResponse = z.infer<typeof GetPresetCategoriesResponseSchema>
