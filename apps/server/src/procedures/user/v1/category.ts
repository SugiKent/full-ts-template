/**
 * カテゴリー oRPC Procedures
 *
 * カテゴリーの CRUD 操作
 */
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { prisma } from '../../../db/client.js'
import { getDeviceId, type ORPCContext, requireDevice } from '../../../middleware/orpc-auth.js'
import * as categoryRepo from '../../../repositories/category.repository.js'
import { createLayerLogger, serializeError } from '../../../utils/logger.js'

const logger = createLayerLogger('procedure', 'category')

// 認証済み + 利用規約同意必須ベース
const authenticated = requireDevice.use(({ context, next }) => {
  const ctx = context as unknown as ORPCContext
  if (!ctx.device?.hasAgreedToTerms) {
    throw new ORPCError('FORBIDDEN', { message: 'Terms agreement required' })
  }
  return next({ context })
})

/**
 * カテゴリーを整形
 */
function formatCategory(cat: NonNullable<Awaited<ReturnType<typeof categoryRepo.findById>>>) {
  return {
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    sortOrder: cat.sortOrder,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
  }
}

/**
 * カテゴリー一覧を取得
 */
const list = authenticated.handler(async ({ context }) => {
  const deviceId = getDeviceId(context)

  try {
    const categories = await categoryRepo.findByDeviceId(prisma, deviceId)

    return {
      success: true as const,
      data: categories.map(formatCategory),
    }
  } catch (error) {
    logger.error({ error: serializeError(error), deviceId }, 'Failed to list categories')
    throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to list categories' })
  }
})

/**
 * カテゴリーを作成
 */
const create = authenticated
  .input(
    z.object({
      name: z.string().min(1).max(100),
      icon: z.string().max(50).optional(),
      color: z.string().max(20).optional(),
      sortOrder: z.number().int().min(0).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      const category = await categoryRepo.create(prisma, {
        deviceId,
        name: input.name,
        icon: input.icon ?? null,
        color: input.color ?? null,
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      })

      return {
        success: true as const,
        data: formatCategory(category),
      }
    } catch (error) {
      logger.error({ error: serializeError(error), deviceId }, 'Failed to create category')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create category' })
    }
  })

/**
 * カテゴリーを更新
 */
const update = authenticated
  .input(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1).max(100).optional(),
      icon: z.string().max(50).nullable().optional(),
      color: z.string().max(20).nullable().optional(),
      sortOrder: z.number().int().min(0).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      // 所有権確認
      const existing = await categoryRepo.findById(prisma, input.id)
      if (!existing || existing.deviceId !== deviceId) {
        throw new ORPCError('NOT_FOUND', { message: 'Category not found' })
      }

      const category = await categoryRepo.update(prisma, input.id, {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.icon !== undefined && { icon: input.icon }),
        ...(input.color !== undefined && { color: input.color }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      })

      return {
        success: true as const,
        data: formatCategory(category),
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to update category')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to update category' })
    }
  })

/**
 * カテゴリーを削除
 */
const deleteCategory = authenticated
  .input(
    z.object({
      id: z.string().min(1),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      // 所有権確認
      const existing = await categoryRepo.findById(prisma, input.id)
      if (!existing || existing.deviceId !== deviceId) {
        throw new ORPCError('NOT_FOUND', { message: 'Category not found' })
      }

      await categoryRepo.deleteById(prisma, input.id)

      return {
        success: true as const,
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to delete category')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to delete category' })
    }
  })

export const categoryRouter = {
  list,
  create,
  update,
  delete: deleteCategory,
}
