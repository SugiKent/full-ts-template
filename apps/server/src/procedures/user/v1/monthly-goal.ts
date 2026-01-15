/**
 * 月次目標 oRPC Procedures
 *
 * 月次目標の CRUD 操作
 */
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { prisma } from '../../../db/client.js'
import { getDeviceId, type ORPCContext, requireDevice } from '../../../middleware/orpc-auth.js'
import * as monthlyGoalRepo from '../../../repositories/monthly-goal.repository.js'
import { createLayerLogger, serializeError } from '../../../utils/logger.js'

const logger = createLayerLogger('procedure', 'monthly-goal')

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
 * 月次目標を整形
 */
function formatMonthlyGoal(
  goal: NonNullable<Awaited<ReturnType<typeof monthlyGoalRepo.findById>>>,
) {
  return {
    id: goal.id,
    itemId: goal.itemId,
    title: goal.title,
    targetMonth: goal.targetMonth.toISOString(),
    isCompleted: goal.isCompleted,
    completedAt: toISOString(goal.completedAt),
    sortOrder: goal.sortOrder,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  }
}

/**
 * 月次目標一覧を取得
 */
const list = authenticated
  .input(
    z
      .object({
        targetMonth: z
          .string()
          .regex(/^\d{4}-\d{2}-01$/)
          .optional(),
      })
      .optional(),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      let goals: Awaited<ReturnType<typeof monthlyGoalRepo.findByDeviceId>>

      if (input?.targetMonth) {
        goals = await monthlyGoalRepo.findByDeviceIdAndMonth(
          prisma,
          deviceId,
          new Date(input.targetMonth),
        )
      } else {
        goals = await monthlyGoalRepo.findByDeviceId(prisma, deviceId)
      }

      return {
        success: true as const,
        data: goals.map(formatMonthlyGoal),
      }
    } catch (error) {
      logger.error({ error: serializeError(error), deviceId }, 'Failed to list monthly goals')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to list monthly goals' })
    }
  })

/**
 * 月次目標を作成
 */
const create = authenticated
  .input(
    z.object({
      title: z.string().min(1).max(200),
      targetMonth: z.string().regex(/^\d{4}-\d{2}-01$/),
      itemId: z.string().optional(),
      sortOrder: z.number().int().min(0).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      const goal = await monthlyGoalRepo.create(prisma, {
        deviceId,
        itemId: input.itemId ?? null,
        title: input.title,
        targetMonth: new Date(input.targetMonth),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      })

      return {
        success: true as const,
        data: formatMonthlyGoal(goal),
      }
    } catch (error) {
      logger.error({ error: serializeError(error), deviceId }, 'Failed to create monthly goal')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create monthly goal' })
    }
  })

/**
 * 月次目標を更新
 */
const update = authenticated
  .input(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1).max(200).optional(),
      targetMonth: z
        .string()
        .regex(/^\d{4}-\d{2}-01$/)
        .optional(),
      itemId: z.string().nullable().optional(),
      sortOrder: z.number().int().min(0).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      // 所有権確認
      const existing = await monthlyGoalRepo.findById(prisma, input.id)
      if (!existing || existing.deviceId !== deviceId) {
        throw new ORPCError('NOT_FOUND', { message: 'Monthly goal not found' })
      }

      const goal = await monthlyGoalRepo.update(prisma, input.id, {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.targetMonth !== undefined && { targetMonth: new Date(input.targetMonth) }),
        ...(input.itemId !== undefined && { itemId: input.itemId }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      })

      return {
        success: true as const,
        data: formatMonthlyGoal(goal),
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to update monthly goal')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to update monthly goal' })
    }
  })

/**
 * 月次目標の完了状態を切り替え
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
      const existing = await monthlyGoalRepo.findById(prisma, input.id)
      if (!existing || existing.deviceId !== deviceId) {
        throw new ORPCError('NOT_FOUND', { message: 'Monthly goal not found' })
      }

      const goal = existing.isCompleted
        ? await monthlyGoalRepo.markAsIncomplete(prisma, input.id)
        : await monthlyGoalRepo.markAsCompleted(prisma, input.id)

      return {
        success: true as const,
        data: formatMonthlyGoal(goal),
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error(
        { error: serializeError(error), deviceId },
        'Failed to toggle monthly goal completion',
      )
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to toggle monthly goal completion',
      })
    }
  })

/**
 * 月次目標を削除
 */
const deleteMonthlyGoal = authenticated
  .input(
    z.object({
      id: z.string().min(1),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      // 所有権確認
      const existing = await monthlyGoalRepo.findById(prisma, input.id)
      if (!existing || existing.deviceId !== deviceId) {
        throw new ORPCError('NOT_FOUND', { message: 'Monthly goal not found' })
      }

      await monthlyGoalRepo.deleteById(prisma, input.id)

      return {
        success: true as const,
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to delete monthly goal')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to delete monthly goal' })
    }
  })

export const monthlyGoalRouter = {
  list,
  create,
  update,
  toggleComplete,
  delete: deleteMonthlyGoal,
}
