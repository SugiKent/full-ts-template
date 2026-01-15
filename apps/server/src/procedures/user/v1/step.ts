/**
 * ステップ oRPC Procedures
 *
 * ステップの CRUD 操作
 * - ステップ完了時: 候補更新ジョブを Worker にエンキュー
 */
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { prisma } from '../../../db/client.js'
import { getDeviceId, type ORPCContext, requireDevice } from '../../../middleware/orpc-auth.js'
import * as stepRepo from '../../../repositories/step.repository.js'
import * as wishlistItemRepo from '../../../repositories/wishlist-item.repository.js'
import { enqueueJob, STEP_SUGGESTION_QUEUE } from '../../../services/job-queue.service.js'
import { createLayerLogger, serializeError } from '../../../utils/logger.js'

const logger = createLayerLogger('procedure', 'step')

// 認証済み + 利用規約同意必須ベース
const authenticated = requireDevice.use(({ context, next }) => {
  const ctx = context as unknown as ORPCContext
  if (!ctx.device?.hasAgreedToTerms) {
    throw new ORPCError('FORBIDDEN', { message: 'Terms agreement required' })
  }
  return next({ context })
})

/**
 * 日付を ISO 文字列に変換（null 安全）
 */
function toISOString(date: Date | null): string | null {
  return date ? date.toISOString() : null
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
    completedAt: toISOString(step.completedAt),
    sortOrder: step.sortOrder,
    createdAt: step.createdAt.toISOString(),
    updatedAt: step.updatedAt.toISOString(),
  }
}

/**
 * アイテムに紐づくステップ一覧を取得
 */
const list = authenticated
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

      const steps = await stepRepo.findByItemId(prisma, input.itemId)

      return {
        success: true as const,
        data: steps.map(formatStep),
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to list steps')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to list steps' })
    }
  })

/**
 * ステップを作成
 */
const create = authenticated
  .input(
    z.object({
      itemId: z.string().min(1),
      title: z.string().min(1).max(200),
      description: z.string().max(1000).optional(),
      sortOrder: z.number().int().min(0).optional(),
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

      const step = await stepRepo.create(prisma, {
        itemId: input.itemId,
        title: input.title,
        description: input.description ?? null,
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      })

      return {
        success: true as const,
        data: formatStep(step),
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to create step')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create step' })
    }
  })

/**
 * ステップを更新
 */
const update = authenticated
  .input(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(1000).nullable().optional(),
      sortOrder: z.number().int().min(0).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      // ステップとアイテムの所有権確認
      const existing = await stepRepo.findById(prisma, input.id)
      if (!existing) {
        throw new ORPCError('NOT_FOUND', { message: 'Step not found' })
      }

      const item = await wishlistItemRepo.findById(prisma, existing.itemId)
      if (!item || item.deviceId !== deviceId) {
        throw new ORPCError('NOT_FOUND', { message: 'Step not found' })
      }

      const step = await stepRepo.update(prisma, input.id, {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      })

      return {
        success: true as const,
        data: formatStep(step),
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to update step')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to update step' })
    }
  })

/**
 * ステップの完了状態を切り替え
 *
 * ステップが完了状態になった場合、進捗を踏まえた候補更新ジョブをエンキュー
 */
const toggleComplete = authenticated
  .input(
    z.object({
      id: z.string().min(1),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      // ステップとアイテムの所有権確認
      const existing = await stepRepo.findById(prisma, input.id)
      if (!existing) {
        throw new ORPCError('NOT_FOUND', { message: 'Step not found' })
      }

      const item = await wishlistItemRepo.findById(prisma, existing.itemId)
      if (!item || item.deviceId !== deviceId) {
        throw new ORPCError('NOT_FOUND', { message: 'Step not found' })
      }

      const wasCompleted = existing.isCompleted
      const step = wasCompleted
        ? await stepRepo.markAsIncomplete(prisma, input.id)
        : await stepRepo.markAsCompleted(prisma, input.id)

      // ステップが新たに完了した場合、候補更新ジョブをエンキュー
      // （完了ステップを踏まえた新しい候補を生成するため）
      if (!wasCompleted && step.isCompleted) {
        await enqueueJob(STEP_SUGGESTION_QUEUE, {
          type: 'update',
          data: { itemId: existing.itemId },
        })
        logger.info(
          { deviceId, itemId: existing.itemId, stepId: input.id },
          'Step suggestion update job enqueued (step completed)',
        )
      }

      return {
        success: true as const,
        data: formatStep(step),
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to toggle step completion')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to toggle step completion' })
    }
  })

/**
 * ステップを削除
 */
const deleteStep = authenticated
  .input(
    z.object({
      id: z.string().min(1),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      // ステップとアイテムの所有権確認
      const existing = await stepRepo.findById(prisma, input.id)
      if (!existing) {
        throw new ORPCError('NOT_FOUND', { message: 'Step not found' })
      }

      const item = await wishlistItemRepo.findById(prisma, existing.itemId)
      if (!item || item.deviceId !== deviceId) {
        throw new ORPCError('NOT_FOUND', { message: 'Step not found' })
      }

      await stepRepo.deleteById(prisma, input.id)

      return {
        success: true as const,
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to delete step')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to delete step' })
    }
  })

export const stepRouter = {
  list,
  create,
  update,
  toggleComplete,
  delete: deleteStep,
}
