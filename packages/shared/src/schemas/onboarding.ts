/**
 * オンボーディング関連の Zod スキーマ定義
 *
 * サーバー・クライアント間で型を共有するためのスキーマ
 */

import { z } from 'zod'

/**
 * 通知頻度
 */
export const NotificationFrequencySchema = z.enum([
  'daily',
  'every3days',
  'weekly',
  'monthly',
  'none',
])
export type NotificationFrequency = z.infer<typeof NotificationFrequencySchema>

/**
 * アイテム優先度
 */
export const ItemPrioritySchema = z.union([z.literal(0), z.literal(1), z.literal(2)])
export type ItemPriority = z.infer<typeof ItemPrioritySchema>

/**
 * カテゴリー入力スキーマ
 */
export const CategoryInputSchema = z.object({
  clientId: z.string().min(1, 'クライアントIDは必須です'),
  name: z.string().min(1, 'カテゴリー名は必須です').max(100, 'カテゴリー名は100文字以内です'),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  sortOrder: z.number().int().min(0).default(0),
})
export type CategoryInput = z.infer<typeof CategoryInputSchema>

/**
 * ウィッシュリストアイテム入力スキーマ
 */
export const WishlistItemInputSchema = z.object({
  clientId: z.string().min(1, 'クライアントIDは必須です'),
  title: z.string().min(1, 'タイトルは必須です').max(200, 'タイトルは200文字以内です'),
  description: z.string().max(2000).optional(),
  targetDate: z.string().datetime().optional(),
  priority: ItemPrioritySchema.default(0),
  categoryClientIds: z.array(z.string()).default([]),
  sortOrder: z.number().int().min(0).default(0),
})
export type WishlistItemInput = z.infer<typeof WishlistItemInputSchema>

/**
 * ステップ入力スキーマ
 */
export const StepInputSchema = z.object({
  clientId: z.string().min(1, 'クライアントIDは必須です'),
  title: z.string().min(1, 'ステップ名は必須です').max(200, 'ステップ名は200文字以内です'),
  description: z.string().max(1000).optional(),
  sortOrder: z.number().int().min(0).default(0),
})
export type StepInput = z.infer<typeof StepInputSchema>

/**
 * 月次目標入力スキーマ
 */
export const MonthlyGoalInputSchema = z.object({
  clientId: z.string().min(1, 'クライアントIDは必須です'),
  title: z.string().min(1, '目標名は必須です').max(200, '目標名は200文字以内です'),
  targetMonth: z.string().regex(/^\d{4}-\d{2}-01$/, '対象月はYYYY-MM-01形式です'),
  itemClientId: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
})
export type MonthlyGoalInput = z.infer<typeof MonthlyGoalInputSchema>

/**
 * オンボーディング完了リクエストスキーマ
 */
export const CompleteOnboardingInputSchema = z.object({
  categories: z.array(CategoryInputSchema).max(50, 'カテゴリーは50件以内です'),
  items: z
    .array(WishlistItemInputSchema)
    .min(1, '最低1件のアイテムが必要です')
    .max(100, 'アイテムは100件以内です'),
  stepsByItem: z.record(z.string(), z.array(StepInputSchema).max(50, 'ステップは50件以内です')),
  monthlyGoals: z.array(MonthlyGoalInputSchema).max(50, '月次目標は50件以内です'),
  // 1stリリースでは通知機能なし。将来の実装に備えてデフォルト値を設定
  notificationFrequency: NotificationFrequencySchema.default('daily'),
})
export type CompleteOnboardingInput = z.infer<typeof CompleteOnboardingInputSchema>

/**
 * AI ステップ提案リクエストスキーマ
 */
export const SuggestStepsInputSchema = z.object({
  itemTitle: z.string().min(1, 'アイテム名は必須です').max(200),
  categoryIds: z.array(z.string()).optional(),
  existingSteps: z.array(z.string()).optional(),
  completedSteps: z.array(z.string()).optional(),
})
export type SuggestStepsInput = z.infer<typeof SuggestStepsInputSchema>

/**
 * ステップ提案レスポンススキーマ
 */
export const SuggestedStepSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
})
export type SuggestedStep = z.infer<typeof SuggestedStepSchema>

/**
 * カテゴリースキーマ
 */
export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Category = z.infer<typeof CategorySchema>

/**
 * ステップスキーマ
 */
export const StepSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  isCompleted: z.boolean(),
  completedAt: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Step = z.infer<typeof StepSchema>

/**
 * 月次目標スキーマ
 */
export const MonthlyGoalSchema = z.object({
  id: z.string(),
  itemId: z.string().nullable(),
  title: z.string(),
  targetMonth: z.string(),
  isCompleted: z.boolean(),
  completedAt: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type MonthlyGoal = z.infer<typeof MonthlyGoalSchema>

/**
 * ウィッシュリストアイテムスキーマ
 */
export const WishlistItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  targetDate: z.string().nullable(),
  priority: ItemPrioritySchema,
  isCompleted: z.boolean(),
  completedAt: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  categories: z.array(CategorySchema),
  steps: z.array(StepSchema),
  monthlyGoals: z.array(MonthlyGoalSchema),
})
export type WishlistItem = z.infer<typeof WishlistItemSchema>

/**
 * ユーザー設定スキーマ
 */
export const UserSettingsSchema = z.object({
  id: z.string(),
  notificationFrequency: NotificationFrequencySchema,
  onboardingCompletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type UserSettings = z.infer<typeof UserSettingsSchema>

/**
 * ホーム画面データスキーマ
 */
export const HomeDataSchema = z.object({
  items: z.array(WishlistItemSchema),
  categories: z.array(CategorySchema),
  settings: UserSettingsSchema.nullable(),
})
export type HomeData = z.infer<typeof HomeDataSchema>
