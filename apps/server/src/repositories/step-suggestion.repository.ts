/**
 * ステップ候補 Repository
 *
 * AIが事前生成した未採用ステップ候補のデータアクセス層
 */
import type { PrismaOrTransaction } from '../db/client.js'

/**
 * ID でステップ候補を取得
 */
export async function findById(prisma: PrismaOrTransaction, id: string) {
  return prisma.stepSuggestion.findUnique({
    where: { id },
  })
}

/**
 * アイテムに紐づくステップ候補一覧を取得
 */
export async function findByItemId(prisma: PrismaOrTransaction, itemId: string) {
  return prisma.stepSuggestion.findMany({
    where: { itemId },
    orderBy: { sortOrder: 'asc' },
  })
}

/**
 * アイテムに紐づくステップ候補の数を取得
 */
export async function countByItemId(prisma: PrismaOrTransaction, itemId: string) {
  return prisma.stepSuggestion.count({
    where: { itemId },
  })
}

/**
 * ステップ候補を作成
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
  return prisma.stepSuggestion.create({
    data: {
      itemId: data.itemId,
      title: data.title,
      description: data.description ?? null,
      sortOrder: data.sortOrder ?? 0,
    },
  })
}

/**
 * ステップ候補を一括作成
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
  return prisma.stepSuggestion.createManyAndReturn({
    data: data.map((item) => ({
      itemId: item.itemId,
      title: item.title,
      description: item.description ?? null,
      sortOrder: item.sortOrder ?? 0,
    })),
  })
}

/**
 * ステップ候補を削除
 */
export async function deleteById(prisma: PrismaOrTransaction, id: string) {
  return prisma.stepSuggestion.delete({
    where: { id },
  })
}

/**
 * アイテムに紐づくステップ候補をすべて削除
 */
export async function deleteByItemId(prisma: PrismaOrTransaction, itemId: string) {
  return prisma.stepSuggestion.deleteMany({
    where: { itemId },
  })
}
