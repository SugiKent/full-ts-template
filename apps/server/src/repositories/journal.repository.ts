/**
 * ジャーナル Repository
 *
 * ジャーナルエントリーのデータアクセス層（タイムライン機能）
 */
import type { PrismaOrTransaction } from '../db/client.js'

/**
 * デバイスに紐づくジャーナルエントリー一覧を取得（ページネーション対応）
 */
export async function findByDeviceId(
  prisma: PrismaOrTransaction,
  deviceId: string,
  options?: {
    cursor?: string
    limit?: number
  },
) {
  const limit = options?.limit ?? 50

  return prisma.journalEntry.findMany({
    where: { deviceId },
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // 次ページの有無を判定するため +1
    ...(options?.cursor && {
      cursor: { id: options.cursor },
      skip: 1, // カーソル自体はスキップ
    }),
  })
}

/**
 * デバイスに紐づくジャーナルエントリー数を取得
 */
export async function countByDeviceId(prisma: PrismaOrTransaction, deviceId: string) {
  return prisma.journalEntry.count({
    where: { deviceId },
  })
}

/**
 * ID でジャーナルエントリーを取得
 */
export async function findById(prisma: PrismaOrTransaction, id: string) {
  return prisma.journalEntry.findUnique({
    where: { id },
  })
}

/**
 * ジャーナルエントリーを作成
 */
export async function create(
  prisma: PrismaOrTransaction,
  data: {
    deviceId: string
    title?: string | null
    content: string
  },
) {
  return prisma.journalEntry.create({
    data: {
      deviceId: data.deviceId,
      title: data.title ?? null,
      content: data.content,
    },
  })
}

/**
 * ジャーナルエントリーを更新
 */
export async function update(
  prisma: PrismaOrTransaction,
  id: string,
  data: {
    title?: string | null
    content?: string
  },
) {
  return prisma.journalEntry.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
    },
  })
}

/**
 * ジャーナルエントリーを削除
 */
export async function deleteById(prisma: PrismaOrTransaction, id: string) {
  return prisma.journalEntry.delete({
    where: { id },
  })
}

/**
 * デバイスに紐づくジャーナルエントリーをすべて削除
 */
export async function deleteByDeviceId(prisma: PrismaOrTransaction, deviceId: string) {
  return prisma.journalEntry.deleteMany({
    where: { deviceId },
  })
}
