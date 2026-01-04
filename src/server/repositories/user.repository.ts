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

/**
 * IDでユーザーの名前とメールアドレスのみを取得
 */
export async function findNameEmailById(
  prisma: PrismaClient,
  id: string,
): Promise<{ name: string; email: string } | null> {
  return prisma.user.findUnique({
    where: { id },
    select: {
      name: true,
      email: true,
    },
  })
}

/**
 * ユーザーを作成
 */
export async function create(
  prisma: PrismaClient,
  data: {
    email: string
    name: string
    role: string
    emailVerified: boolean
  },
) {
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      emailVerified: data.emailVerified,
    },
  })
}

/**
 * IDでユーザーを更新
 */
export async function updateById(
  prisma: PrismaClient,
  id: string,
  data: {
    emailVerified?: boolean
  },
) {
  return prisma.user.update({
    where: { id },
    data,
  })
}

/**
 * メールアドレスでユーザーを削除
 */
export async function deleteByEmail(prisma: PrismaClient, email: string) {
  return prisma.user.delete({
    where: { email },
  })
}
