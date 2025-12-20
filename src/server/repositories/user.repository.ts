/**
 * ユーザーRepository サンプル
 *
 * Prismaを使用したデータアクセス層のサンプル実装
 * プロジェクトに応じてカスタマイズしてください
 */
import type { PrismaClient } from '@prisma/client'

/**
 * IDでユーザーを取得
 */
export async function findById(prisma: PrismaClient, id: string) {
  return prisma.user.findUnique({
    where: { id },
  })
}

/**
 * メールアドレスでユーザーを取得
 */
export async function findByEmail(prisma: PrismaClient, email: string) {
  return prisma.user.findUnique({
    where: { email },
  })
}

/**
 * ユーザー一覧を取得（ページネーション付き）
 */
export async function findAll(prisma: PrismaClient, options: { page: number; limit: number }) {
  const { page, limit } = options
  const skip = (page - 1) * limit

  return prisma.user.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * ユーザー総数を取得
 */
export async function countAll(prisma: PrismaClient) {
  return prisma.user.count()
}

/**
 * ユーザーがadminロールかどうかをチェック
 */
export function isAdmin(user: { role: string } | null): boolean {
  if (!user) return false
  return user.role === 'admin'
}
