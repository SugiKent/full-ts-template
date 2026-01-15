/**
 * ステップ提案サービス
 *
 * AI を使用してウィッシュリストアイテムの達成ステップを提案
 * Worker による非同期候補生成をサポート
 */
import { z } from 'zod'
import { getRedisClient } from '../config/redis.js'
import type { PrismaOrTransaction } from '../db/client.js'
import * as StepSuggestionRepository from '../repositories/step-suggestion.repository.js'
import * as WishlistItemRepository from '../repositories/wishlist-item.repository.js'
import { createLayerLogger, serializeError } from '../utils/logger.js'
import { createStructuredCompletion, isLLMAvailable } from './llm-provider.service.js'

const logger = createLayerLogger('service', 'step-suggestion')

/**
 * ステップ提案レスポンススキーマ
 */
const StepSuggestionResponseSchema = z.object({
  steps: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
    }),
  ),
})

type StepSuggestionResponse = z.infer<typeof StepSuggestionResponseSchema>

/**
 * ステップ提案入力
 */
export interface SuggestStepsInput {
  itemTitle: string
  categoryIds?: string[]
  existingSteps?: string[]
  completedSteps?: string[]
}

/**
 * システムプロンプト
 */
const SYSTEM_PROMPT = `あなたは目標達成の専門家です。ユーザーのウィッシュリストアイテム（やりたいこと・欲しいもの）に対して、具体的で実行可能なステップを提案してください。

## ルール

1. **具体的なアクション**: 各ステップは具体的で実行可能なアクションにする
2. **段階的な進行**: 簡単なステップから始め、徐々に難易度を上げる
3. **3〜5ステップ**: 通常は3〜5個のステップを提案する
4. **重複回避**: 既存のステップや完了済みステップと重複しない
5. **進捗考慮**: 完了済みステップがある場合は、次のステップを提案する

## 出力形式

JSON形式で以下の構造を返してください:
{
  "steps": [
    {
      "title": "ステップのタイトル（短く簡潔に）",
      "description": "詳細な説明（任意）"
    }
  ]
}

descriptionは、より詳しい説明が必要な場合のみ含めてください。`

/**
 * ユーザープロンプトを生成
 */
function buildUserPrompt(input: SuggestStepsInput): string {
  let prompt = `## ウィッシュリストアイテム\n${input.itemTitle}\n`

  if (input.categoryIds && input.categoryIds.length > 0) {
    prompt += `\n## カテゴリー\n${input.categoryIds.join(', ')}\n`
  }

  if (input.existingSteps && input.existingSteps.length > 0) {
    prompt += `\n## 既存のステップ（これらと重複しないでください）\n${input.existingSteps.map((s) => `- ${s}`).join('\n')}\n`
  }

  if (input.completedSteps && input.completedSteps.length > 0) {
    prompt += `\n## 完了済みのステップ（これらの進捗を踏まえて次のステップを提案してください）\n${input.completedSteps.map((s) => `- ${s}`).join('\n')}\n`
  }

  prompt += '\n上記のウィッシュリストアイテムを達成するためのステップを提案してください。'

  return prompt
}

/**
 * デフォルトのステップを生成（LLM 利用不可時）
 */
function generateDefaultSteps(itemTitle: string): StepSuggestionResponse {
  return {
    steps: [
      { title: '情報を集める', description: `${itemTitle}について調べる` },
      { title: '計画を立てる', description: '具体的なスケジュールと予算を決める' },
      { title: '準備をする', description: '必要なものを揃える' },
      { title: '実行する', description: '計画に沿って行動を開始する' },
      { title: '振り返る', description: '進捗を確認し、必要に応じて調整する' },
    ],
  }
}

/**
 * ステップを提案
 */
export async function suggestSteps(input: SuggestStepsInput): Promise<StepSuggestionResponse> {
  logger.info({ itemTitle: input.itemTitle }, 'Suggesting steps')

  // LLM が利用不可の場合はデフォルトのステップを返す
  if (!isLLMAvailable()) {
    logger.warn('LLM not available, returning default steps')
    return generateDefaultSteps(input.itemTitle)
  }

  try {
    const userPrompt = buildUserPrompt(input)

    const response = await createStructuredCompletion(
      SYSTEM_PROMPT,
      userPrompt,
      StepSuggestionResponseSchema,
      'step_suggestion_response',
      {
        temperature: 0.7,
        maxTokens: 1000,
      },
    )

    logger.info(
      { itemTitle: input.itemTitle, stepCount: response.steps.length },
      'Steps suggested successfully',
    )

    return response
  } catch (error) {
    logger.error(
      { error: serializeError(error), input },
      'Failed to suggest steps, returning default',
    )
    return generateDefaultSteps(input.itemTitle)
  }
}

// ========================================
// 候補の生成・補充・重複排除
// ========================================

/** 目標候補数 */
export const TARGET_SUGGESTION_COUNT = 5
/** 最小候補数（これを下回ったら補充） */
export const MIN_SUGGESTION_COUNT = 2

/** デバウンスキーのプレフィックス */
const DEBOUNCE_KEY_PREFIX = 'step-suggestion:debounce:'
/** デバウンスの有効期限（秒） */
const DEBOUNCE_TTL_SECONDS = 10

/**
 * アイテムに対してステップ候補を生成し、DBに保存する
 *
 * @param prisma - Prisma クライアント
 * @param itemId - 対象アイテムのID
 * @param deleteExisting - 既存の候補を削除するか（タイトル変更時など）
 */
export async function generateSuggestionsForItem(
  prisma: PrismaOrTransaction,
  itemId: string,
  deleteExisting = false,
): Promise<void> {
  logger.info({ itemId, deleteExisting }, 'Generating suggestions for item')

  // アイテム情報を取得
  const item = await WishlistItemRepository.findById(prisma, itemId)
  if (!item) {
    logger.warn({ itemId }, 'Item not found, skipping suggestion generation')
    return
  }

  // 既存候補を削除（必要な場合）
  if (deleteExisting) {
    await StepSuggestionRepository.deleteByItemId(prisma, itemId)
  }

  // 現在の候補数を確認
  const currentCount = await StepSuggestionRepository.countByItemId(prisma, itemId)
  const countToGenerate = TARGET_SUGGESTION_COUNT - currentCount

  if (countToGenerate <= 0) {
    logger.info({ itemId, currentCount }, 'Sufficient suggestions exist, skipping')
    return
  }

  // 既存ステップと既存候補のタイトルを取得（重複回避用）
  const existingSteps = item.steps.map((s) => s.title)
  const completedSteps = item.steps.filter((s) => s.isCompleted).map((s) => s.title)
  const existingSuggestions = await StepSuggestionRepository.findByItemId(prisma, itemId)
  const existingSuggestionTitles = existingSuggestions.map((s) => s.title)

  // AI で候補を生成
  const response = await suggestSteps({
    itemTitle: item.title,
    existingSteps: [...existingSteps, ...existingSuggestionTitles],
    completedSteps,
  })

  // 既存と重複しない候補を抽出
  const newSuggestions = response.steps
    .filter(
      (step) =>
        !existingSteps.includes(step.title) && !existingSuggestionTitles.includes(step.title),
    )
    .slice(0, countToGenerate)

  if (newSuggestions.length === 0) {
    logger.info({ itemId }, 'No new unique suggestions generated')
    return
  }

  // DBに保存
  const maxSortOrder =
    existingSuggestions.length > 0 ? Math.max(...existingSuggestions.map((s) => s.sortOrder)) : -1

  await StepSuggestionRepository.createMany(
    prisma,
    newSuggestions.map((suggestion, index) => ({
      itemId,
      title: suggestion.title,
      description: suggestion.description ?? null,
      sortOrder: maxSortOrder + 1 + index,
    })),
  )

  logger.info({ itemId, generatedCount: newSuggestions.length }, 'Suggestions generated and saved')
}

/**
 * 候補が不足していれば補充する
 *
 * @param prisma - Prisma クライアント
 * @param itemId - 対象アイテムのID
 */
export async function ensureSuggestions(
  prisma: PrismaOrTransaction,
  itemId: string,
): Promise<void> {
  const currentCount = await StepSuggestionRepository.countByItemId(prisma, itemId)

  if (currentCount < MIN_SUGGESTION_COUNT) {
    logger.info(
      { itemId, currentCount, minRequired: MIN_SUGGESTION_COUNT },
      'Suggestions below minimum, replenishing',
    )
    await generateSuggestionsForItem(prisma, itemId, false)
  }
}

/**
 * replenish ジョブをエンキューすべきか判定する（デバウンス）
 *
 * 直近 DEBOUNCE_TTL_SECONDS 以内に同じ itemId でエンキュー済みならスキップ
 * Redis SET NX EX を使用してアトミックに判定
 *
 * @param itemId - 対象アイテムのID
 * @returns エンキューすべきなら true
 */
export async function shouldEnqueueReplenishJob(itemId: string): Promise<boolean> {
  const key = `${DEBOUNCE_KEY_PREFIX}${itemId}`
  const redis = getRedisClient()

  // SET NX (存在しない場合のみセット) + EX (有効期限)
  const result = await redis.set(key, '1', 'EX', DEBOUNCE_TTL_SECONDS, 'NX')

  // result が 'OK' なら新規セット成功 = エンキューすべき
  // result が null なら既にキーが存在 = スキップ
  const shouldEnqueue = result === 'OK'

  logger.debug(
    { itemId, shouldEnqueue, debounceSeconds: DEBOUNCE_TTL_SECONDS },
    'Checked replenish job debounce',
  )

  return shouldEnqueue
}
