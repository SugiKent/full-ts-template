/**
 * デバイス認証 oRPC Procedures
 *
 * Device ID ベースの匿名認証機能
 */
import { ORPCError, os } from '@orpc/server'
import { z } from 'zod'
import { prisma } from '../../../db/client.js'
import { getDeviceContext, requireDevice } from '../../../middleware/orpc-auth.js'
import * as deviceRepo from '../../../repositories/device.repository.js'
import { createLayerLogger, serializeError } from '../../../utils/logger.js'

const logger = createLayerLogger('procedure', 'device-auth')

// ========================================
// 入力スキーマ定義
// ========================================

const RegisterDeviceInput = z.object({
  deviceId: z.string().uuid(),
  platform: z.enum(['ios', 'android']).optional(),
  appVersion: z.string().optional(),
})

const RefreshTokenInput = z.object({
  deviceId: z.string().uuid(),
})

const GetDeviceStatusInput = z.object({
  deviceId: z.string().uuid(),
})

// agreeToTerms は認証必須で入力不要（deviceId はコンテキストから取得）

// ========================================
// 出力型定義
// ========================================

interface RegisterDeviceResult {
  success: boolean
  error: string | null
  accessToken: string | null
  expiresAt: Date | null
  isNewDevice: boolean
}

interface RefreshTokenResult {
  success: boolean
  error: string | null
  accessToken: string | null
  expiresAt: Date | null
}

interface DeviceStatusResult {
  success: boolean
  error: string | null
  device: {
    deviceId: string
    platform: string | null
    hasAgreedToTerms: boolean
    firstSeenAt: Date
    lastSeenAt: Date
  } | null
}

interface AgreeToTermsResult {
  success: boolean
  error: string | null
}

interface DeleteDeviceDataResult {
  success: boolean
  error: string | null
}

// ========================================
// Procedures
// ========================================

/**
 * デバイスを登録してアクセストークンを発行
 *
 * - 新規デバイス: 登録してトークンを発行
 * - 既存デバイス: 既存トークンを失効させて新規トークンを発行
 */
const registerDevice = os
  .input(RegisterDeviceInput)
  .handler(async ({ input }): Promise<RegisterDeviceResult> => {
    logger.info({ deviceId: input.deviceId, platform: input.platform }, 'Registering device')

    try {
      // 既存デバイスを確認
      const existingDevice = await deviceRepo.findByDeviceId(prisma, input.deviceId)

      let isNewDevice = false

      if (!existingDevice) {
        // 新規デバイスを作成
        await deviceRepo.createDevice(prisma, {
          deviceId: input.deviceId,
          platform: input.platform ?? null,
          appVersion: input.appVersion ?? null,
        })
        isNewDevice = true
        logger.info({ deviceId: input.deviceId }, 'New device created')
      } else {
        // 既存デバイスの情報を更新
        await deviceRepo.updateDevice(prisma, input.deviceId, {
          platform: input.platform ?? null,
          appVersion: input.appVersion ?? null,
        })
        logger.info({ deviceId: input.deviceId }, 'Existing device updated')
      }

      // トークンを発行（既存トークンは refreshAccessToken 内で失効させる）
      const tokenRecord = isNewDevice
        ? await deviceRepo.createAccessToken(prisma, input.deviceId)
        : await deviceRepo.refreshAccessToken(prisma, input.deviceId)

      return {
        success: true,
        error: null,
        accessToken: tokenRecord.token,
        expiresAt: tokenRecord.expiresAt,
        isNewDevice,
      }
    } catch (error) {
      logger.error({ error: serializeError(error), input }, 'Failed to register device')
      return {
        success: false,
        error: 'Failed to register device',
        accessToken: null,
        expiresAt: null,
        isNewDevice: false,
      }
    }
  })

/**
 * アクセストークンを更新
 */
const refreshToken = os
  .input(RefreshTokenInput)
  .handler(async ({ input }): Promise<RefreshTokenResult> => {
    logger.info({ deviceId: input.deviceId }, 'Refreshing access token')

    try {
      const device = await deviceRepo.findByDeviceId(prisma, input.deviceId)

      if (!device) {
        return {
          success: false,
          error: 'Device not found',
          accessToken: null,
          expiresAt: null,
        }
      }

      const tokenRecord = await deviceRepo.refreshAccessToken(prisma, input.deviceId)

      return {
        success: true,
        error: null,
        accessToken: tokenRecord.token,
        expiresAt: tokenRecord.expiresAt,
      }
    } catch (error) {
      logger.error({ error: serializeError(error), input }, 'Failed to refresh token')
      return {
        success: false,
        error: 'Failed to refresh token',
        accessToken: null,
        expiresAt: null,
      }
    }
  })

/**
 * デバイス状態を取得
 */
const getDeviceStatus = os
  .input(GetDeviceStatusInput)
  .handler(async ({ input }): Promise<DeviceStatusResult> => {
    logger.info({ deviceId: input.deviceId }, 'Getting device status')

    try {
      const device = await deviceRepo.findByDeviceId(prisma, input.deviceId)

      if (!device) {
        return {
          success: false,
          error: 'Device not found',
          device: null,
        }
      }

      return {
        success: true,
        error: null,
        device: {
          deviceId: device.deviceId,
          platform: device.platform,
          hasAgreedToTerms: device.hasAgreedToTerms,
          firstSeenAt: device.firstSeenAt,
          lastSeenAt: device.lastSeenAt,
        },
      }
    } catch (error) {
      logger.error({ error: serializeError(error), input }, 'Failed to get device status')
      return {
        success: false,
        error: 'Failed to get device status',
        device: null,
      }
    }
  })

/**
 * 利用規約に同意
 *
 * 認証必須 - deviceId はコンテキストから取得
 */
const agreeToTerms = requireDevice.handler(async ({ context }): Promise<AgreeToTermsResult> => {
  const deviceContext = getDeviceContext(context)
  const deviceId = deviceContext.deviceId

  logger.info({ deviceId }, 'Recording terms agreement')

  try {
    await deviceRepo.recordTermsAgreement(prisma, deviceId)

    return {
      success: true,
      error: null,
    }
  } catch (error) {
    logger.error({ error: serializeError(error), deviceId }, 'Failed to record terms agreement')
    return {
      success: false,
      error: 'Failed to record terms agreement',
    }
  }
})

/**
 * デバイスに紐づくすべてのデータを削除
 *
 * - 認証必須（requireDevice）
 * - Device レコードを削除（Cascade で関連データも削除）
 */
const deleteDeviceData = requireDevice.handler(
  async ({ context }): Promise<DeleteDeviceDataResult> => {
    const deviceContext = getDeviceContext(context)
    const deviceId = deviceContext.deviceId

    logger.info({ deviceId }, 'Deleting device data')

    try {
      await deviceRepo.deleteDevice(prisma, deviceId)

      logger.info({ deviceId }, 'Device data deleted successfully')

      return {
        success: true,
        error: null,
      }
    } catch (error) {
      logger.error({ error: serializeError(error), deviceId }, 'Failed to delete device data')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to delete device data' })
    }
  },
)

// ========================================
// Router
// ========================================

export const deviceAuthRouter = {
  registerDevice,
  refreshToken,
  getDeviceStatus,
  agreeToTerms,
  deleteDeviceData,
}
