/**
 * ウィッシュリストアイテム Repository
 *
 * ウィッシュリストアイテムのデータアクセス層
 */
import type { PrismaOrTransaction } from '../db/client.js'

/**
 * アイテム取得時のインクルード設定
 */
const itemInclude = {
  categories: {
    include: {
      category: true,
    },
  },
  steps: {
    orderBy: { sortOrder: 'asc' as const },
  },
  monthlyGoals: {
    orderBy: { targetMonth: 'asc' as const },
  },
}

/**
 * デバイスに紐づくアイテム一覧を取得
 */
export async function findByDeviceId(prisma: PrismaOrTransaction, deviceId: string) {
  return prisma.wishlistItem.findMany({
    where: { deviceId },
    include: itemInclude,
    orderBy: { sortOrder: 'asc' },
  })
}

/**
 * デバイスに紐づくアイテム数を取得
 */
export async function countByDeviceId(prisma: PrismaOrTransaction, deviceId: string) {
  return prisma.wishlistItem.count({
    where: { deviceId },
  })
}

/**
 * ID でアイテムを取得
 */
export async function findById(prisma: PrismaOrTransaction, id: string) {
  return prisma.wishlistItem.findUnique({
    where: { id },
    include: itemInclude,
  })
}

/**
 * アイテムを作成
 */
export async function create(
  prisma: PrismaOrTransaction,
  data: {
    deviceId: string
    title: string
    description?: string | null
    targetDate?: Date | null
    priority?: number
    sortOrder?: number
  },
) {
  return prisma.wishlistItem.create({
    data: {
      deviceId: data.deviceId,
      title: data.title,
      description: data.description ?? null,
      targetDate: data.targetDate ?? null,
      priority: data.priority ?? 0,
      sortOrder: data.sortOrder ?? 0,
    },
    include: itemInclude,
  })
}

/**
 * アイテムを一括作成（カテゴリー紐付けなし）
 */
export async function createMany(
  prisma: PrismaOrTransaction,
  data: Array<{
    deviceId: string
    title: string
    description?: string | null
    targetDate?: Date | null
    priority?: number
    sortOrder?: number
  }>,
) {
  return prisma.wishlistItem.createManyAndReturn({
    data: data.map((item) => ({
      deviceId: item.deviceId,
      title: item.title,
      description: item.description ?? null,
      targetDate: item.targetDate ?? null,
      priority: item.priority ?? 0,
      sortOrder: item.sortOrder ?? 0,
    })),
  })
}

/**
 * アイテムを更新
 */
export async function update(
  prisma: PrismaOrTransaction,
  id: string,
  data: {
    title?: string
    description?: string | null
    targetDate?: Date | null
    priority?: number
    isCompleted?: boolean
    completedAt?: Date | null
    sortOrder?: number
  },
) {
  return prisma.wishlistItem.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.targetDate !== undefined && { targetDate: data.targetDate }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted }),
      ...(data.completedAt !== undefined && { completedAt: data.completedAt }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
    include: itemInclude,
  })
}

/**
 * アイテムを完了としてマーク
 */
export async function markAsCompleted(prisma: PrismaOrTransaction, id: string) {
  return prisma.wishlistItem.update({
    where: { id },
    data: {
      isCompleted: true,
      completedAt: new Date(),
    },
    include: itemInclude,
  })
}

/**
 * アイテムの完了を取り消し
 */
export async function markAsIncomplete(prisma: PrismaOrTransaction, id: string) {
  return prisma.wishlistItem.update({
    where: { id },
    data: {
      isCompleted: false,
      completedAt: null,
    },
    include: itemInclude,
  })
}

/**
 * アイテムを削除
 */
export async function deleteById(prisma: PrismaOrTransaction, id: string) {
  return prisma.wishlistItem.delete({
    where: { id },
  })
}

/**
 * デバイスに紐づくアイテムをすべて削除
 */
export async function deleteByDeviceId(prisma: PrismaOrTransaction, deviceId: string) {
  return prisma.wishlistItem.deleteMany({
    where: { deviceId },
  })
}

/**
 * アイテムにカテゴリーを紐付け
 */
export async function addCategory(prisma: PrismaOrTransaction, itemId: string, categoryId: string) {
  return prisma.wishlistItemCategory.create({
    data: {
      itemId,
      categoryId,
    },
  })
}

/**
 * アイテムにカテゴリーを一括紐付け
 */
export async function addCategories(
  prisma: PrismaOrTransaction,
  data: Array<{
    itemId: string
    categoryId: string
  }>,
) {
  return prisma.wishlistItemCategory.createMany({
    data,
    skipDuplicates: true,
  })
}

/**
 * アイテムからカテゴリーを削除
 */
export async function removeCategory(
  prisma: PrismaOrTransaction,
  itemId: string,
  categoryId: string,
) {
  return prisma.wishlistItemCategory.delete({
    where: {
      itemId_categoryId: {
        itemId,
        categoryId,
      },
    },
  })
}

/**
 * アイテムのカテゴリーをすべて削除
 */
export async function removeAllCategories(prisma: PrismaOrTransaction, itemId: string) {
  return prisma.wishlistItemCategory.deleteMany({
    where: { itemId },
  })
}
