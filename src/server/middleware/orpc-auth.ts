/**
 * oRPC認証ミドルウェア
 *
 * Better Auth経由で認証状態を検証し、ロールベースのアクセス制御を提供
 */

import { ORPCError, os } from '@orpc/server'
import type { PrismaClient } from '@prisma/client'

/**
 * oRPCコンテキスト型定義
 */
export interface ORPCContext {
  prisma: PrismaClient
  user?: {
    id: string
    email: string
    role: string
  }
}

/**
 * 認証必須ミドルウェア
 *
 * ユーザーが認証されていない場合はUNAUTHORIZEDエラーを返す
 */
export const requireAuth = os.use(({ context, next }) => {
  const ctx = context as unknown as ORPCContext

  if (!ctx.user) {
    throw new ORPCError('UNAUTHORIZED')
  }

  return next({ context })
})

/**
 * ロールベース認証ミドルウェア
 *
 * 指定されたロールのいずれかを持つユーザーのみアクセスを許可
 *
 * @param roles - 許可するロールの配列
 */
export const requireRole = (roles: string[]) =>
  os.use(({ context, next }) => {
    const ctx = context as unknown as ORPCContext

    if (!ctx.user) {
      throw new ORPCError('UNAUTHORIZED')
    }

    if (!roles.includes(ctx.user.role)) {
      throw new ORPCError('FORBIDDEN')
    }

    return next({ context })
  })
