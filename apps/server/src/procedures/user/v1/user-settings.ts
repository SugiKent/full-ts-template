/**
 * ユーザー設定 oRPC Procedures
 *
 * テーマ設定等のユーザー設定管理
 */
import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { prisma } from '../../../db/client.js'
import { getDeviceId, requireDevice } from '../../../middleware/orpc-auth.js'
import * as userSettingsRepo from '../../../repositories/user-settings.repository.js'
import { createLayerLogger, serializeError } from '../../../utils/logger.js'

const logger = createLayerLogger('procedure', 'user-settings')

// ========================================
// 入力スキーマ定義
// ========================================

/**
 * 有効なテーマID一覧
 * apps/mobile/src/constants/theme.ts と同期すること
 */
const VALID_THEME_IDS = [
  // ウォーム系
  'honey',
  'sunset',
  'coffee',
  // クール系
  'ocean',
  'sky',
  'mint',
  // ナチュラル系
  'forest',
  'lime',
  // ロマンティック系
  'sakura',
  'rose',
  'lavender',
  'grape',
  // モノトーン系
  'stone',
  'slate',
  'midnight',
] as const

type ThemeId = (typeof VALID_THEME_IDS)[number]

const UpdateSettingsInput = z.object({
  notificationFrequency: z.enum(['daily', 'every3days', 'weekly', 'monthly']).optional(),
  themeId: z.enum(VALID_THEME_IDS).optional(),
})

// ========================================
// Procedures
// ========================================

/**
 * ユーザー設定を取得
 */
const getSettings = requireDevice.handler(async ({ context }) => {
  const deviceId = getDeviceId(context)

  logger.info({ deviceId }, 'Getting user settings')

  try {
    const settings = await userSettingsRepo.findByDeviceId(prisma, deviceId)

    if (!settings) {
      return {
        success: true as const,
        data: null,
      }
    }

    return {
      success: true as const,
      data: {
        id: settings.id,
        notificationFrequency: settings.notificationFrequency,
        themeId: settings.themeId,
        onboardingCompletedAt: settings.onboardingCompletedAt?.toISOString() ?? null,
        createdAt: settings.createdAt.toISOString(),
        updatedAt: settings.updatedAt.toISOString(),
      },
    }
  } catch (error) {
    logger.error({ error: serializeError(error), deviceId }, 'Failed to get user settings')
    throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to get user settings' })
  }
})

/**
 * ユーザー設定を更新
 */
const updateSettings = requireDevice
  .input(UpdateSettingsInput)
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    logger.info({ deviceId, input }, 'Updating user settings')

    try {
      // 設定が存在しない場合は作成、存在する場合は更新
      // undefined 値をフィルタリング（exactOptionalPropertyTypes 対応）
      const updateData: {
        deviceId: string
        notificationFrequency?: 'daily' | 'every3days' | 'weekly' | 'monthly'
        themeId?: ThemeId
      } = { deviceId }

      if (input.notificationFrequency !== undefined) {
        updateData.notificationFrequency = input.notificationFrequency
      }
      if (input.themeId !== undefined) {
        updateData.themeId = input.themeId
      }

      const settings = await userSettingsRepo.upsert(prisma, updateData)

      return {
        success: true as const,
        data: {
          id: settings.id,
          notificationFrequency: settings.notificationFrequency,
          themeId: settings.themeId,
          onboardingCompletedAt: settings.onboardingCompletedAt?.toISOString() ?? null,
          createdAt: settings.createdAt.toISOString(),
          updatedAt: settings.updatedAt.toISOString(),
        },
      }
    } catch (error) {
      logger.error({ error: serializeError(error), deviceId }, 'Failed to update user settings')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to update user settings' })
    }
  })

// ========================================
// Router
// ========================================

export const userSettingsRouter = {
  getSettings,
  updateSettings,
}
