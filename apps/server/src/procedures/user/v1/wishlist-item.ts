/**
 * ウィッシュリストアイテム oRPC Procedures
 *
 * アイテムの CRUD 操作
 * - 作成時: ステップ候補生成ジョブをエンキュー
 * - 更新時: タイトル変更があれば候補再生成ジョブをエンキュー
 */
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { prisma } from '../../../db/client.js'
import { getDeviceId, type ORPCContext, requireDevice } from '../../../middleware/orpc-auth.js'
import * as stepSuggestionRepo from '../../../repositories/step-suggestion.repository.js'
import * as wishlistItemRepo from '../../../repositories/wishlist-item.repository.js'
import { enqueueJob, STEP_SUGGESTION_QUEUE } from '../../../services/job-queue.service.js'
import { createLayerLogger, serializeError } from '../../../utils/logger.js'

const logger = createLayerLogger('procedure', 'wishlist-item')

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
 * アイテムを整形
 */
function formatItem(
  item: NonNullable<Awaited<ReturnType<typeof wishlistItemRepo.findById>>>,
  suggestions?: Awaited<ReturnType<typeof stepSuggestionRepo.findByItemId>>,
) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    targetDate: toISOString(item.targetDate),
    priority: item.priority,
    isCompleted: item.isCompleted,
    completedAt: toISOString(item.completedAt),
    sortOrder: item.sortOrder,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    categories: item.categories.map((ic) => ({
      id: ic.category.id,
      name: ic.category.name,
      icon: ic.category.icon,
      color: ic.category.color,
      sortOrder: ic.category.sortOrder,
      createdAt: ic.category.createdAt.toISOString(),
      updatedAt: ic.category.updatedAt.toISOString(),
    })),
    steps: item.steps.map((step) => ({
      id: step.id,
      itemId: step.itemId,
      title: step.title,
      description: step.description,
      isCompleted: step.isCompleted,
      completedAt: toISOString(step.completedAt),
      sortOrder: step.sortOrder,
      createdAt: step.createdAt.toISOString(),
      updatedAt: step.updatedAt.toISOString(),
    })),
    monthlyGoals: item.monthlyGoals.map((goal) => ({
      id: goal.id,
      itemId: goal.itemId,
      title: goal.title,
      targetMonth: goal.targetMonth.toISOString(),
      isCompleted: goal.isCompleted,
      completedAt: toISOString(goal.completedAt),
      sortOrder: goal.sortOrder,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    })),
    // ステップ候補（Worker で非同期生成されるため、取得時点では空の場合あり）
    suggestions:
      suggestions?.map((suggestion) => ({
        id: suggestion.id,
        itemId: suggestion.itemId,
        title: suggestion.title,
        description: suggestion.description,
        sortOrder: suggestion.sortOrder,
        createdAt: suggestion.createdAt.toISOString(),
      })) ?? [],
  }
}

/**
 * アイテム一覧を取得
 *
 * 一覧取得時はステップ候補は含めない（詳細取得時のみ）
 */
const list = authenticated.handler(async ({ context }) => {
  const deviceId = getDeviceId(context)

  try {
    const items = await wishlistItemRepo.findByDeviceId(prisma, deviceId)

    return {
      success: true as const,
      data: items.map((item) => formatItem(item)),
    }
  } catch (error) {
    logger.error({ error: serializeError(error), deviceId }, 'Failed to list items')
    throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to list items' })
  }
})

/**
 * アイテムを取得（ステップ候補も含む）
 */
const get = authenticated
  .input(
    z.object({
      id: z.string().min(1),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      const item = await wishlistItemRepo.findById(prisma, input.id)
      if (!item || item.deviceId !== deviceId) {
        throw new ORPCError('NOT_FOUND', { message: 'Item not found' })
      }

      // ステップ候補も取得
      const suggestions = await stepSuggestionRepo.findByItemId(prisma, input.id)

      return {
        success: true as const,
        data: formatItem(item, suggestions),
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to get item')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to get item' })
    }
  })

/**
 * アイテムを作成
 *
 * 作成後にステップ候補生成ジョブを Worker にエンキュー
 */
const create = authenticated
  .input(
    z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      targetDate: z.string().datetime().optional(),
      priority: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
      categoryIds: z.array(z.string()).optional(),
      sortOrder: z.number().int().min(0).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      const item = await prisma.$transaction(async (tx) => {
        // アイテムを作成
        const created = await wishlistItemRepo.create(tx, {
          deviceId,
          title: input.title,
          description: input.description ?? null,
          targetDate: input.targetDate ? new Date(input.targetDate) : null,
          ...(input.priority !== undefined && { priority: input.priority }),
          ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        })

        // カテゴリーを紐付け
        if (input.categoryIds && input.categoryIds.length > 0) {
          await wishlistItemRepo.addCategories(
            tx,
            input.categoryIds.map((categoryId) => ({
              itemId: created.id,
              categoryId,
            })),
          )
        }

        // 再取得してリレーションを含める
        return wishlistItemRepo.findById(tx, created.id)
      })

      if (!item) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create item' })
      }

      // ステップ候補生成ジョブを Worker にエンキュー（非同期）
      await enqueueJob(STEP_SUGGESTION_QUEUE, {
        type: 'generate',
        data: { itemId: item.id },
      })
      logger.info({ deviceId, itemId: item.id }, 'Step suggestion generate job enqueued')

      return {
        success: true as const,
        data: formatItem(item),
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to create item')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create item' })
    }
  })

/**
 * アイテムを更新
 *
 * タイトル変更時はステップ候補再生成ジョブを Worker にエンキュー
 */
const update = authenticated
  .input(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).nullable().optional(),
      targetDate: z.string().datetime().nullable().optional(),
      priority: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
      categoryIds: z.array(z.string()).optional(),
      sortOrder: z.number().int().min(0).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      // タイトル変更を追跡するため、トランザクション外で旧タイトルを記録
      let titleChanged = false

      const item = await prisma.$transaction(async (tx) => {
        // 所有権確認
        const existing = await wishlistItemRepo.findById(tx, input.id)
        if (!existing || existing.deviceId !== deviceId) {
          throw new ORPCError('NOT_FOUND', { message: 'Item not found' })
        }

        // タイトル変更があるか確認
        if (input.title !== undefined && input.title !== existing.title) {
          titleChanged = true
        }

        // アイテムを更新
        await wishlistItemRepo.update(tx, input.id, {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.targetDate !== undefined && {
            targetDate: input.targetDate ? new Date(input.targetDate) : null,
          }),
          ...(input.priority !== undefined && { priority: input.priority }),
          ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        })

        // カテゴリーを更新（指定された場合のみ）
        if (input.categoryIds !== undefined) {
          await wishlistItemRepo.removeAllCategories(tx, input.id)
          if (input.categoryIds.length > 0) {
            await wishlistItemRepo.addCategories(
              tx,
              input.categoryIds.map((categoryId) => ({
                itemId: input.id,
                categoryId,
              })),
            )
          }
        }

        // 再取得
        return wishlistItemRepo.findById(tx, input.id)
      })

      if (!item) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to update item' })
      }

      // タイトルが変更された場合、ステップ候補を再生成
      if (titleChanged) {
        await enqueueJob(STEP_SUGGESTION_QUEUE, {
          type: 'regenerate',
          data: { itemId: input.id, deleteExisting: true },
        })
        logger.info(
          { deviceId, itemId: input.id },
          'Step suggestion regenerate job enqueued (title changed)',
        )
      }

      return {
        success: true as const,
        data: formatItem(item),
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to update item')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to update item' })
    }
  })

/**
 * アイテムの完了状態を切り替え
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
      // 所有権確認
      const existing = await wishlistItemRepo.findById(prisma, input.id)
      if (!existing || existing.deviceId !== deviceId) {
        throw new ORPCError('NOT_FOUND', { message: 'Item not found' })
      }

      const item = existing.isCompleted
        ? await wishlistItemRepo.markAsIncomplete(prisma, input.id)
        : await wishlistItemRepo.markAsCompleted(prisma, input.id)

      return {
        success: true as const,
        data: formatItem(item),
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to toggle item completion')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to toggle item completion' })
    }
  })

/**
 * アイテムを削除
 */
const deleteItem = authenticated
  .input(
    z.object({
      id: z.string().min(1),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      // 所有権確認
      const existing = await wishlistItemRepo.findById(prisma, input.id)
      if (!existing || existing.deviceId !== deviceId) {
        throw new ORPCError('NOT_FOUND', { message: 'Item not found' })
      }

      await wishlistItemRepo.deleteById(prisma, input.id)

      return {
        success: true as const,
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to delete item')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to delete item' })
    }
  })

export const wishlistItemRouter = {
  list,
  get,
  create,
  update,
  toggleComplete,
  delete: deleteItem,
}
