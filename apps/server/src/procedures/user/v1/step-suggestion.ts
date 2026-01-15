/**
 * AI ステップ候補 oRPC Procedures
 *
 * AIが事前生成したステップ候補の管理
 * - listByItemId: アイテムの候補一覧取得
 * - adopt: 候補を採用（Step に変換）
 * - dismiss: 候補を却下
 * - regenerate: 候補を再生成
 * - suggest: AI でステップを提案（レガシー、オンボーディング用）
 */
import { ORPCError } from '@orpc/server'
import { SuggestStepsInputSchema } from '@wishlist/shared/schemas/onboarding'
import { z } from 'zod'
import { prisma } from '../../../db/client.js'
import { getDeviceId, type ORPCContext, requireDevice } from '../../../middleware/orpc-auth.js'
import * as stepRepo from '../../../repositories/step.repository.js'
import * as stepSuggestionRepo from '../../../repositories/step-suggestion.repository.js'
import * as wishlistItemRepo from '../../../repositories/wishlist-item.repository.js'
import { enqueueJob, STEP_SUGGESTION_QUEUE } from '../../../services/job-queue.service.js'
import {
  MIN_SUGGESTION_COUNT,
  shouldEnqueueReplenishJob,
  suggestSteps,
} from '../../../services/step-suggestion.service.js'
import { createLayerLogger, serializeError } from '../../../utils/logger.js'

const logger = createLayerLogger('procedure', 'step-suggestion')

// 認証済み + 利用規約同意必須ベース
const authenticated = requireDevice.use(({ context, next }) => {
  const ctx = context as unknown as ORPCContext
  if (!ctx.device?.hasAgreedToTerms) {
    throw new ORPCError('FORBIDDEN', { message: 'Terms agreement required' })
  }
  return next({ context })
})

/**
 * ステップ提案
 *
 * AI を使用してウィッシュリストアイテムの達成ステップを提案
 */
const suggest = authenticated.input(SuggestStepsInputSchema).handler(async ({ input, context }) => {
  const deviceId = getDeviceId(context)

  logger.info({ deviceId, itemTitle: input.itemTitle }, 'Suggesting steps')

  try {
    const result = await suggestSteps({
      itemTitle: input.itemTitle,
      categoryIds: input.categoryIds ?? [],
      existingSteps: input.existingSteps ?? [],
      completedSteps: input.completedSteps ?? [],
    })

    return {
      success: true as const,
      data: result,
    }
  } catch (error) {
    logger.error({ error: serializeError(error), deviceId }, 'Failed to suggest steps')
    throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to suggest steps' })
  }
})

// ========================================
// 新規 Procedures: ステップ候補管理
// ========================================

/**
 * ステップ候補を整形
 */
function formatSuggestion(
  suggestion: NonNullable<Awaited<ReturnType<typeof stepSuggestionRepo.findById>>>,
) {
  return {
    id: suggestion.id,
    itemId: suggestion.itemId,
    title: suggestion.title,
    description: suggestion.description,
    sortOrder: suggestion.sortOrder,
    createdAt: suggestion.createdAt.toISOString(),
  }
}

/**
 * ステップを整形
 */
function formatStep(step: NonNullable<Awaited<ReturnType<typeof stepRepo.findById>>>) {
  return {
    id: step.id,
    itemId: step.itemId,
    title: step.title,
    description: step.description,
    isCompleted: step.isCompleted,
    completedAt: step.completedAt ? step.completedAt.toISOString() : null,
    sortOrder: step.sortOrder,
    createdAt: step.createdAt.toISOString(),
    updatedAt: step.updatedAt.toISOString(),
  }
}

/**
 * アイテムに紐づくステップ候補一覧を取得
 */
const listByItemId = authenticated
  .input(
    z.object({
      itemId: z.string().min(1),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      // アイテムの所有権確認
      const item = await wishlistItemRepo.findById(prisma, input.itemId)
      if (!item || item.deviceId !== deviceId) {
        throw new ORPCError('NOT_FOUND', { message: 'Item not found' })
      }

      const suggestions = await stepSuggestionRepo.findByItemId(prisma, input.itemId)

      return {
        success: true as const,
        data: suggestions.map(formatSuggestion),
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to list suggestions')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to list suggestions' })
    }
  })

/**
 * ステップ候補を採用（候補 → 正式なステップに変換）
 *
 * 1. 候補を Step テーブルにコピー
 * 2. 候補を削除
 * 3. 残り候補数が MIN_SUGGESTION_COUNT 以下なら補充ジョブをエンキュー
 */
const adopt = authenticated
  .input(
    z.object({
      suggestionId: z.string().min(1),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      // 候補を取得
      const suggestion = await stepSuggestionRepo.findById(prisma, input.suggestionId)
      if (!suggestion) {
        throw new ORPCError('NOT_FOUND', { message: 'Suggestion not found' })
      }

      // アイテムの所有権確認
      const item = await wishlistItemRepo.findById(prisma, suggestion.itemId)
      if (!item || item.deviceId !== deviceId) {
        throw new ORPCError('NOT_FOUND', { message: 'Suggestion not found' })
      }

      // トランザクションで候補を Step に変換
      const result = await prisma.$transaction(async (tx) => {
        // 現在のステップ数を取得して sortOrder を決定
        const existingSteps = await stepRepo.findByItemId(tx, suggestion.itemId)
        const maxSortOrder =
          existingSteps.length > 0 ? Math.max(...existingSteps.map((s) => s.sortOrder)) : -1

        // Step を作成
        const step = await stepRepo.create(tx, {
          itemId: suggestion.itemId,
          title: suggestion.title,
          description: suggestion.description,
          sortOrder: maxSortOrder + 1,
        })

        // 候補を削除
        await stepSuggestionRepo.deleteById(tx, suggestion.id)

        // 残り候補数を取得
        const remainingCount = await stepSuggestionRepo.countByItemId(tx, suggestion.itemId)

        return { step, remainingCount }
      })

      // 候補が MIN_SUGGESTION_COUNT 以下になったら補充ジョブをエンキュー
      if (result.remainingCount <= MIN_SUGGESTION_COUNT) {
        const shouldEnqueue = await shouldEnqueueReplenishJob(suggestion.itemId)
        if (shouldEnqueue) {
          await enqueueJob(STEP_SUGGESTION_QUEUE, {
            type: 'replenish',
            data: { itemId: suggestion.itemId },
          })
          logger.info({ itemId: suggestion.itemId }, 'Replenish job enqueued after adopt')
        }
      }

      logger.info(
        { deviceId, suggestionId: input.suggestionId, stepId: result.step.id },
        'Suggestion adopted',
      )

      return {
        success: true as const,
        data: formatStep(result.step),
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to adopt suggestion')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to adopt suggestion' })
    }
  })

/**
 * ステップ候補を却下（削除のみ）
 *
 * 1. 候補を削除
 * 2. 残り候補数が MIN_SUGGESTION_COUNT 以下なら補充ジョブをエンキュー
 */
const dismiss = authenticated
  .input(
    z.object({
      suggestionId: z.string().min(1),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      // 候補を取得
      const suggestion = await stepSuggestionRepo.findById(prisma, input.suggestionId)
      if (!suggestion) {
        throw new ORPCError('NOT_FOUND', { message: 'Suggestion not found' })
      }

      // アイテムの所有権確認
      const item = await wishlistItemRepo.findById(prisma, suggestion.itemId)
      if (!item || item.deviceId !== deviceId) {
        throw new ORPCError('NOT_FOUND', { message: 'Suggestion not found' })
      }

      const itemId = suggestion.itemId

      // 候補を削除
      await stepSuggestionRepo.deleteById(prisma, input.suggestionId)

      // 残り候補数を確認して補充ジョブをエンキュー
      const remainingCount = await stepSuggestionRepo.countByItemId(prisma, itemId)
      if (remainingCount <= MIN_SUGGESTION_COUNT) {
        const shouldEnqueue = await shouldEnqueueReplenishJob(itemId)
        if (shouldEnqueue) {
          await enqueueJob(STEP_SUGGESTION_QUEUE, {
            type: 'replenish',
            data: { itemId },
          })
          logger.info({ itemId }, 'Replenish job enqueued after dismiss')
        }
      }

      logger.info({ deviceId, suggestionId: input.suggestionId }, 'Suggestion dismissed')

      return {
        success: true as const,
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to dismiss suggestion')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to dismiss suggestion' })
    }
  })

/**
 * ステップ候補を再生成
 *
 * 既存の候補をすべて削除し、新規に生成ジョブをエンキュー
 */
const regenerate = authenticated
  .input(
    z.object({
      itemId: z.string().min(1),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      // アイテムの所有権確認
      const item = await wishlistItemRepo.findById(prisma, input.itemId)
      if (!item || item.deviceId !== deviceId) {
        throw new ORPCError('NOT_FOUND', { message: 'Item not found' })
      }

      // 再生成ジョブをエンキュー（Worker が既存候補を削除して新規生成）
      await enqueueJob(STEP_SUGGESTION_QUEUE, {
        type: 'regenerate',
        data: { itemId: input.itemId, deleteExisting: true },
      })

      logger.info({ deviceId, itemId: input.itemId }, 'Regenerate job enqueued')

      return {
        success: true as const,
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to regenerate suggestions')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to regenerate suggestions' })
    }
  })

export const stepSuggestionRouter = {
  suggest,
  listByItemId,
  adopt,
  dismiss,
  regenerate,
}
