/**
 * オンボーディング oRPC Procedures
 *
 * オンボーディング完了とホーム画面データ取得
 */
import { ORPCError } from '@orpc/server'
import { CompleteOnboardingInputSchema } from '@wishlist/shared/schemas/onboarding'
import { prisma } from '../../../db/client.js'
import {
  getDeviceContext,
  getDeviceId,
  type ORPCContext,
  requireDevice,
} from '../../../middleware/orpc-auth.js'
import * as categoryRepo from '../../../repositories/category.repository.js'
import * as monthlyGoalRepo from '../../../repositories/monthly-goal.repository.js'
import * as stepRepo from '../../../repositories/step.repository.js'
import * as userSettingsRepo from '../../../repositories/user-settings.repository.js'
import * as wishlistItemRepo from '../../../repositories/wishlist-item.repository.js'
import { createLayerLogger, serializeError } from '../../../utils/logger.js'

const logger = createLayerLogger('procedure', 'onboarding')

/**
 * 日付を ISO 文字列に変換（null 安全）
 */
function toISOString(date: Date | null): string | null {
  return date ? date.toISOString() : null
}

// 認証済み + 利用規約同意必須ベース
const authenticated = requireDevice.use(({ context, next }) => {
  const ctx = context as unknown as ORPCContext
  if (!ctx.device?.hasAgreedToTerms) {
    throw new ORPCError('FORBIDDEN', { message: 'Terms agreement required' })
  }
  return next({ context })
})

/**
 * オンボーディング完了
 *
 * オンボーディングで収集したデータを一括保存
 */
const completeOnboarding = authenticated
  .input(CompleteOnboardingInputSchema)
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    logger.info({ deviceId, itemCount: input.items.length }, 'Completing onboarding')

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. カテゴリーを一括作成
        const createdCategories = await categoryRepo.createMany(
          tx,
          input.categories.map((cat, idx) => ({
            deviceId,
            name: cat.name,
            icon: cat.icon ?? null,
            color: cat.color ?? null,
            sortOrder: cat.sortOrder ?? idx,
          })),
        )

        // クライアントID -> サーバーIDのマッピング
        const categoryIdMap: Record<string, string> = {}
        for (let i = 0; i < input.categories.length; i++) {
          const clientId = input.categories[i]?.clientId
          const serverId = createdCategories[i]?.id
          if (clientId && serverId) {
            categoryIdMap[clientId] = serverId
          }
        }

        // 2. アイテムを一括作成
        const createdItems = await wishlistItemRepo.createMany(
          tx,
          input.items.map((item, idx) => ({
            deviceId,
            title: item.title,
            description: item.description ?? null,
            targetDate: item.targetDate ? new Date(item.targetDate) : null,
            priority: item.priority ?? 0,
            sortOrder: item.sortOrder ?? idx,
          })),
        )

        // クライアントID -> サーバーIDのマッピング
        const itemIdMap: Record<string, string> = {}
        for (let i = 0; i < input.items.length; i++) {
          const clientId = input.items[i]?.clientId
          const serverId = createdItems[i]?.id
          if (clientId && serverId) {
            itemIdMap[clientId] = serverId
          }
        }

        // 3. アイテムとカテゴリーの紐付け
        const itemCategoryRelations: Array<{ itemId: string; categoryId: string }> = []
        for (const item of input.items) {
          const itemId = itemIdMap[item.clientId]
          if (!itemId) continue

          for (const catClientId of item.categoryClientIds) {
            const categoryId = categoryIdMap[catClientId]
            if (categoryId) {
              itemCategoryRelations.push({ itemId, categoryId })
            }
          }
        }

        if (itemCategoryRelations.length > 0) {
          await wishlistItemRepo.addCategories(tx, itemCategoryRelations)
        }

        // 4. ステップを一括作成
        const stepIdMap: Record<string, string> = {}
        const allSteps: Array<{
          itemId: string
          title: string
          description?: string | null
          sortOrder: number
          clientId: string
        }> = []

        for (const [itemClientId, steps] of Object.entries(input.stepsByItem)) {
          const itemId = itemIdMap[itemClientId]
          if (!itemId) continue

          for (const [idx, step] of steps.entries()) {
            allSteps.push({
              itemId,
              title: step.title,
              description: step.description ?? null,
              sortOrder: step.sortOrder ?? idx,
              clientId: step.clientId,
            })
          }
        }

        if (allSteps.length > 0) {
          const createdSteps = await stepRepo.createMany(
            tx,
            allSteps.map((s) => ({
              itemId: s.itemId,
              title: s.title,
              description: s.description ?? null,
              sortOrder: s.sortOrder,
            })),
          )

          for (let i = 0; i < allSteps.length; i++) {
            const clientId = allSteps[i]?.clientId
            const serverId = createdSteps[i]?.id
            if (clientId && serverId) {
              stepIdMap[clientId] = serverId
            }
          }
        }

        // 5. 月次目標を一括作成
        const monthlyGoalIdMap: Record<string, string> = {}

        if (input.monthlyGoals.length > 0) {
          const createdGoals = await monthlyGoalRepo.createMany(
            tx,
            input.monthlyGoals.map((goal, idx) => ({
              deviceId,
              itemId: goal.itemClientId ? (itemIdMap[goal.itemClientId] ?? null) : null,
              title: goal.title,
              targetMonth: new Date(goal.targetMonth),
              sortOrder: goal.sortOrder ?? idx,
            })),
          )

          for (let i = 0; i < input.monthlyGoals.length; i++) {
            const clientId = input.monthlyGoals[i]?.clientId
            const serverId = createdGoals[i]?.id
            if (clientId && serverId) {
              monthlyGoalIdMap[clientId] = serverId
            }
          }
        }

        // 6. ユーザー設定を作成
        await userSettingsRepo.upsert(tx, {
          deviceId,
          notificationFrequency: input.notificationFrequency,
          onboardingCompletedAt: new Date(),
        })

        return {
          categoryIdMap,
          itemIdMap,
          stepIdMap,
          monthlyGoalIdMap,
        }
      })

      logger.info({ deviceId, result }, 'Onboarding completed successfully')

      return {
        success: true as const,
        data: result,
      }
    } catch (error) {
      logger.error({ error: serializeError(error), deviceId }, 'Failed to complete onboarding')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to complete onboarding' })
    }
  })

/**
 * ホーム画面データを取得
 *
 * アイテム一覧、カテゴリー一覧、ユーザー設定を返す
 */
const getHomeData = authenticated.handler(async ({ context }) => {
  const deviceId = getDeviceId(context)

  logger.info({ deviceId }, 'Getting home data')

  try {
    const [items, categories, settings] = await Promise.all([
      wishlistItemRepo.findByDeviceId(prisma, deviceId),
      categoryRepo.findByDeviceId(prisma, deviceId),
      userSettingsRepo.findByDeviceId(prisma, deviceId),
    ])

    // レスポンス用に整形
    const formattedItems = items.map((item) => ({
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
    }))

    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      sortOrder: cat.sortOrder,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
    }))

    const formattedSettings = settings
      ? {
          id: settings.id,
          notificationFrequency: settings.notificationFrequency,
          themeId: settings.themeId,
          onboardingCompletedAt: toISOString(settings.onboardingCompletedAt),
          createdAt: settings.createdAt.toISOString(),
          updatedAt: settings.updatedAt.toISOString(),
        }
      : null

    return {
      success: true as const,
      data: {
        items: formattedItems,
        categories: formattedCategories,
        settings: formattedSettings,
      },
    }
  } catch (error) {
    logger.error({ error: serializeError(error), deviceId }, 'Failed to get home data')
    throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to get home data' })
  }
})

/**
 * オンボーディング必要判定
 *
 * アイテムが0件ならオンボーディング必要
 */
const needsOnboarding = requireDevice.handler(async ({ context }) => {
  const deviceContext = getDeviceContext(context)
  const deviceId = deviceContext.id

  try {
    const itemCount = await wishlistItemRepo.countByDeviceId(prisma, deviceId)

    return {
      success: true as const,
      data: {
        needsOnboarding: itemCount === 0,
        hasAgreedToTerms: deviceContext.hasAgreedToTerms,
      },
    }
  } catch (error) {
    logger.error({ error: serializeError(error), deviceId }, 'Failed to check onboarding status')
    throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to check onboarding status' })
  }
})

export const onboardingRouter = {
  completeOnboarding,
  getHomeData,
  needsOnboarding,
}
