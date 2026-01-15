/**
 * ステップ Repository
 *
 * ステップのデータアクセス層
 */
import type { PrismaOrTransaction } from '../db/client.js'

/**
 * アイテムに紐づくステップ一覧を取得
 */
export async function findByItemId(prisma: PrismaOrTransaction, itemId: string) {
  return prisma.step.findMany({
    where: { itemId },
    orderBy: { sortOrder: 'asc' },
  })
}

/**
 * ID でステップを取得
 */
export async function findById(prisma: PrismaOrTransaction, id: string) {
  return prisma.step.findUnique({
    where: { id },
  })
}

/**
 * ステップを作成
 */
export async function create(
  prisma: PrismaOrTransaction,
  data: {
    itemId: string
    title: string
    description?: string | null
    sortOrder?: number
  },
) {
  return prisma.step.create({
    data: {
      itemId: data.itemId,
      title: data.title,
      description: data.description ?? null,
      sortOrder: data.sortOrder ?? 0,
    },
  })
}

/**
 * ステップを一括作成
 */
export async function createMany(
  prisma: PrismaOrTransaction,
  data: Array<{
    itemId: string
    title: string
    description?: string | null
    sortOrder?: number
  }>,
) {
  return prisma.step.createManyAndReturn({
    data: data.map((item) => ({
      itemId: item.itemId,
      title: item.title,
      description: item.description ?? null,
      sortOrder: item.sortOrder ?? 0,
    })),
  })
}

/**
 * ステップを更新
 */
export async function update(
  prisma: PrismaOrTransaction,
  id: string,
  data: {
    title?: string
    description?: string | null
    isCompleted?: boolean
    completedAt?: Date | null
    sortOrder?: number
  },
) {
  return prisma.step.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted }),
      ...(data.completedAt !== undefined && { completedAt: data.completedAt }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  })
}

/**
 * ステップを完了としてマーク
 */
export async function markAsCompleted(prisma: PrismaOrTransaction, id: string) {
  return prisma.step.update({
    where: { id },
    data: {
      isCompleted: true,
      completedAt: new Date(),
    },
  })
}

/**
 * ステップの完了を取り消し
 */
export async function markAsIncomplete(prisma: PrismaOrTransaction, id: string) {
  return prisma.step.update({
    where: { id },
    data: {
      isCompleted: false,
      completedAt: null,
    },
  })
}

/**
 * ステップを削除
 */
export async function deleteById(prisma: PrismaOrTransaction, id: string) {
  return prisma.step.delete({
    where: { id },
  })
}

/**
 * アイテムに紐づくステップをすべて削除
 */
export async function deleteByItemId(prisma: PrismaOrTransaction, itemId: string) {
  return prisma.step.deleteMany({
    where: { itemId },
  })
}
