/**
 * ユーザー設定 Repository
 *
 * ユーザー設定のデータアクセス層
 */
import type { PrismaOrTransaction } from '../db/client.js'

/**
 * デバイスに紐づく設定を取得
 */
export async function findByDeviceId(prisma: PrismaOrTransaction, deviceId: string) {
  return prisma.userSettings.findUnique({
    where: { deviceId },
  })
}

/**
 * ID で設定を取得
 */
export async function findById(prisma: PrismaOrTransaction, id: string) {
  return prisma.userSettings.findUnique({
    where: { id },
  })
}

/**
 * ユーザー設定を作成
 */
export async function create(
  prisma: PrismaOrTransaction,
  data: {
    deviceId: string
    notificationFrequency?: string
    themeId?: string
    onboardingCompletedAt?: Date | null
  },
) {
  return prisma.userSettings.create({
    data: {
      deviceId: data.deviceId,
      notificationFrequency: data.notificationFrequency ?? 'daily',
      themeId: data.themeId ?? 'warm',
      onboardingCompletedAt: data.onboardingCompletedAt ?? null,
    },
  })
}

/**
 * ユーザー設定を更新
 */
export async function update(
  prisma: PrismaOrTransaction,
  deviceId: string,
  data: {
    notificationFrequency?: string
    themeId?: string
    onboardingCompletedAt?: Date | null
  },
) {
  return prisma.userSettings.update({
    where: { deviceId },
    data: {
      ...(data.notificationFrequency !== undefined && {
        notificationFrequency: data.notificationFrequency,
      }),
      ...(data.themeId !== undefined && {
        themeId: data.themeId,
      }),
      ...(data.onboardingCompletedAt !== undefined && {
        onboardingCompletedAt: data.onboardingCompletedAt,
      }),
    },
  })
}

/**
 * ユーザー設定を作成または更新（upsert）
 */
export async function upsert(
  prisma: PrismaOrTransaction,
  data: {
    deviceId: string
    notificationFrequency?: string
    themeId?: string
    onboardingCompletedAt?: Date | null
  },
) {
  return prisma.userSettings.upsert({
    where: { deviceId: data.deviceId },
    create: {
      deviceId: data.deviceId,
      notificationFrequency: data.notificationFrequency ?? 'daily',
      themeId: data.themeId ?? 'warm',
      onboardingCompletedAt: data.onboardingCompletedAt ?? null,
    },
    update: {
      ...(data.notificationFrequency !== undefined && {
        notificationFrequency: data.notificationFrequency,
      }),
      ...(data.themeId !== undefined && {
        themeId: data.themeId,
      }),
      ...(data.onboardingCompletedAt !== undefined && {
        onboardingCompletedAt: data.onboardingCompletedAt,
      }),
    },
  })
}

/**
 * オンボーディング完了を記録
 */
export async function markOnboardingComplete(prisma: PrismaOrTransaction, deviceId: string) {
  return prisma.userSettings.upsert({
    where: { deviceId },
    create: {
      deviceId,
      onboardingCompletedAt: new Date(),
    },
    update: {
      onboardingCompletedAt: new Date(),
    },
  })
}

/**
 * ユーザー設定を削除
 */
export async function deleteByDeviceId(prisma: PrismaOrTransaction, deviceId: string) {
  return prisma.userSettings.delete({
    where: { deviceId },
  })
}
