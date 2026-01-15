/**
 * 月次目標 Repository
 *
 * 月次目標のデータアクセス層
 */
import type { PrismaOrTransaction } from '../db/client.js'

/**
 * デバイスに紐づく月次目標一覧を取得
 */
export async function findByDeviceId(prisma: PrismaOrTransaction, deviceId: string) {
  return prisma.monthlyGoal.findMany({
    where: { deviceId },
    orderBy: [{ targetMonth: 'asc' }, { sortOrder: 'asc' }],
  })
}

/**
 * デバイスに紐づく特定月の目標一覧を取得
 */
export async function findByDeviceIdAndMonth(
  prisma: PrismaOrTransaction,
  deviceId: string,
  targetMonth: Date,
) {
  return prisma.monthlyGoal.findMany({
    where: {
      deviceId,
      targetMonth,
    },
    orderBy: { sortOrder: 'asc' },
  })
}

/**
 * ID で月次目標を取得
 */
export async function findById(prisma: PrismaOrTransaction, id: string) {
  return prisma.monthlyGoal.findUnique({
    where: { id },
  })
}

/**
 * 月次目標を作成
 */
export async function create(
  prisma: PrismaOrTransaction,
  data: {
    deviceId: string
    itemId?: string | null
    title: string
    targetMonth: Date
    sortOrder?: number
  },
) {
  return prisma.monthlyGoal.create({
    data: {
      deviceId: data.deviceId,
      itemId: data.itemId ?? null,
      title: data.title,
      targetMonth: data.targetMonth,
      sortOrder: data.sortOrder ?? 0,
    },
  })
}

/**
 * 月次目標を一括作成
 */
export async function createMany(
  prisma: PrismaOrTransaction,
  data: Array<{
    deviceId: string
    itemId?: string | null
    title: string
    targetMonth: Date
    sortOrder?: number
  }>,
) {
  return prisma.monthlyGoal.createManyAndReturn({
    data: data.map((item) => ({
      deviceId: item.deviceId,
      itemId: item.itemId ?? null,
      title: item.title,
      targetMonth: item.targetMonth,
      sortOrder: item.sortOrder ?? 0,
    })),
  })
}

/**
 * 月次目標を更新
 */
export async function update(
  prisma: PrismaOrTransaction,
  id: string,
  data: {
    itemId?: string | null
    title?: string
    targetMonth?: Date
    isCompleted?: boolean
    completedAt?: Date | null
    sortOrder?: number
  },
) {
  return prisma.monthlyGoal.update({
    where: { id },
    data: {
      ...(data.itemId !== undefined && { itemId: data.itemId }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.targetMonth !== undefined && { targetMonth: data.targetMonth }),
      ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted }),
      ...(data.completedAt !== undefined && { completedAt: data.completedAt }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  })
}

/**
 * 月次目標を完了としてマーク
 */
export async function markAsCompleted(prisma: PrismaOrTransaction, id: string) {
  return prisma.monthlyGoal.update({
    where: { id },
    data: {
      isCompleted: true,
      completedAt: new Date(),
    },
  })
}

/**
 * 月次目標の完了を取り消し
 */
export async function markAsIncomplete(prisma: PrismaOrTransaction, id: string) {
  return prisma.monthlyGoal.update({
    where: { id },
    data: {
      isCompleted: false,
      completedAt: null,
    },
  })
}

/**
 * 月次目標を削除
 */
export async function deleteById(prisma: PrismaOrTransaction, id: string) {
  return prisma.monthlyGoal.delete({
    where: { id },
  })
}

/**
 * デバイスに紐づく月次目標をすべて削除
 */
export async function deleteByDeviceId(prisma: PrismaOrTransaction, deviceId: string) {
  return prisma.monthlyGoal.deleteMany({
    where: { deviceId },
  })
}
