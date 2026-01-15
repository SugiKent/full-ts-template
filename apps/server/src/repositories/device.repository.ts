/**
 * デバイスRepository
 *
 * Device ID認証のためのデータアクセス層
 */
import { randomBytes } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'

/** トークン有効期限（90日） */
const TOKEN_EXPIRY_DAYS = 90

/**
 * トークンを生成（64文字の hex 文字列）
 */
function generateToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * トークンの有効期限を計算
 */
function calculateTokenExpiry(): Date {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS)
  return expiresAt
}

/**
 * Device ID でデバイスを取得
 */
export async function findByDeviceId(prisma: PrismaClient, deviceId: string) {
  return prisma.device.findUnique({
    where: { deviceId },
  })
}

/**
 * 内部 ID でデバイスを取得
 */
export async function findById(prisma: PrismaClient, id: string) {
  return prisma.device.findUnique({
    where: { id },
  })
}

/**
 * 新規デバイスを登録
 */
export async function createDevice(
  prisma: PrismaClient,
  data: {
    deviceId: string
    platform?: string | null
    appVersion?: string | null
  },
) {
  return prisma.device.create({
    data: {
      deviceId: data.deviceId,
      platform: data.platform ?? null,
      appVersion: data.appVersion ?? null,
    },
  })
}

/**
 * デバイス情報を更新
 */
export async function updateDevice(
  prisma: PrismaClient,
  deviceId: string,
  data: {
    platform?: string | null
    appVersion?: string | null
    hasAgreedToTerms?: boolean
    termsAgreedAt?: Date | null
  },
) {
  return prisma.device.update({
    where: { deviceId },
    data: {
      ...(data.platform !== undefined && { platform: data.platform }),
      ...(data.appVersion !== undefined && { appVersion: data.appVersion }),
      ...(data.hasAgreedToTerms !== undefined && { hasAgreedToTerms: data.hasAgreedToTerms }),
      ...(data.termsAgreedAt !== undefined && { termsAgreedAt: data.termsAgreedAt }),
    },
  })
}

/**
 * 最終アクセス日時を更新
 */
export async function updateLastSeen(prisma: PrismaClient, deviceId: string) {
  return prisma.device.update({
    where: { deviceId },
    data: {
      lastSeenAt: new Date(),
    },
  })
}

/**
 * アクセストークンを生成
 */
export async function createAccessToken(prisma: PrismaClient, deviceId: string) {
  const device = await findByDeviceId(prisma, deviceId)
  if (!device) {
    throw new Error('Device not found')
  }

  const token = generateToken()
  const expiresAt = calculateTokenExpiry()

  return prisma.deviceAccessToken.create({
    data: {
      deviceId: device.id,
      token,
      expiresAt,
    },
  })
}

/**
 * トークンを検証し、関連するデバイス情報を返す
 */
export async function validateAccessToken(prisma: PrismaClient, token: string) {
  const accessToken = await prisma.deviceAccessToken.findUnique({
    where: { token },
    include: { device: true },
  })

  if (!accessToken) {
    return null
  }

  // 失効済みチェック
  if (accessToken.revokedAt) {
    return null
  }

  // 有効期限チェック
  if (accessToken.expiresAt < new Date()) {
    return null
  }

  return {
    token: accessToken,
    device: accessToken.device,
  }
}

/**
 * トークンを更新（古いトークンを失効させ、新しいトークンを発行）
 */
export async function refreshAccessToken(prisma: PrismaClient, deviceId: string) {
  const device = await findByDeviceId(prisma, deviceId)
  if (!device) {
    throw new Error('Device not found')
  }

  // 既存の有効なトークンをすべて失効させる
  await prisma.deviceAccessToken.updateMany({
    where: {
      deviceId: device.id,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  })

  // 新しいトークンを発行
  const token = generateToken()
  const expiresAt = calculateTokenExpiry()

  return prisma.deviceAccessToken.create({
    data: {
      deviceId: device.id,
      token,
      expiresAt,
    },
  })
}

/**
 * 特定のトークンを失効させる
 */
export async function revokeAccessToken(prisma: PrismaClient, token: string) {
  return prisma.deviceAccessToken.update({
    where: { token },
    data: {
      revokedAt: new Date(),
    },
  })
}

/**
 * デバイスの利用規約同意を記録
 */
export async function recordTermsAgreement(prisma: PrismaClient, deviceId: string) {
  return prisma.device.update({
    where: { deviceId },
    data: {
      hasAgreedToTerms: true,
      termsAgreedAt: new Date(),
    },
  })
}

/**
 * デバイスを削除（関連するトークンも削除される）
 */
export async function deleteDevice(prisma: PrismaClient, deviceId: string) {
  return prisma.device.delete({
    where: { deviceId },
  })
}
