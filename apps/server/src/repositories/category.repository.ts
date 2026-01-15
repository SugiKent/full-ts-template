/**
 * カテゴリー Repository
 *
 * カテゴリーのデータアクセス層
 */
import type { PrismaOrTransaction } from '../db/client.js'

/**
 * デバイスに紐づくカテゴリー一覧を取得
 */
export async function findByDeviceId(prisma: PrismaOrTransaction, deviceId: string) {
  return prisma.category.findMany({
    where: { deviceId },
    orderBy: { sortOrder: 'asc' },
  })
}

/**
 * ID でカテゴリーを取得
 */
export async function findById(prisma: PrismaOrTransaction, id: string) {
  return prisma.category.findUnique({
    where: { id },
  })
}

/**
 * カテゴリーを作成
 */
export async function create(
  prisma: PrismaOrTransaction,
  data: {
    deviceId: string
    name: string
    icon?: string | null
    color?: string | null
    sortOrder?: number
  },
) {
  return prisma.category.create({
    data: {
      deviceId: data.deviceId,
      name: data.name,
      icon: data.icon ?? null,
      color: data.color ?? null,
      sortOrder: data.sortOrder ?? 0,
    },
  })
}

/**
 * カテゴリーを一括作成
 */
export async function createMany(
  prisma: PrismaOrTransaction,
  data: Array<{
    deviceId: string
    name: string
    icon?: string | null
    color?: string | null
    sortOrder?: number
  }>,
) {
  return prisma.category.createManyAndReturn({
    data: data.map((item) => ({
      deviceId: item.deviceId,
      name: item.name,
      icon: item.icon ?? null,
      color: item.color ?? null,
      sortOrder: item.sortOrder ?? 0,
    })),
  })
}

/**
 * カテゴリーを更新
 */
export async function update(
  prisma: PrismaOrTransaction,
  id: string,
  data: {
    name?: string
    icon?: string | null
    color?: string | null
    sortOrder?: number
  },
) {
  return prisma.category.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  })
}

/**
 * カテゴリーを削除
 */
export async function deleteById(prisma: PrismaOrTransaction, id: string) {
  return prisma.category.delete({
    where: { id },
  })
}

/**
 * デバイスに紐づくカテゴリーをすべて削除
 */
export async function deleteByDeviceId(prisma: PrismaOrTransaction, deviceId: string) {
  return prisma.category.deleteMany({
    where: { deviceId },
  })
}
