/**
 * ダッシュボード oRPC Procedures
 *
 * 管理画面ダッシュボード用の統計データ取得
 * プロジェクトに応じて統計項目をカスタマイズしてください
 */

import { z } from 'zod'
import { type ORPCContext, requireRole } from '../../middleware/orpc-auth.js'

/**
 * ダッシュボード統計データ取得 Procedure
 *
 * プロジェクトに応じて返す統計データをカスタマイズしてください
 */
export const getDashboardStats = requireRole(['admin', 'counselor'])
  .output(
    z.object({
      // TODO: プロジェクトに応じて統計項目を追加
      totalUsers: z.number(),
      // 例:
      // monthlyActiveUsers: z.number(),
      // totalOrders: z.number(),
    }),
  )
  .handler(async ({ context }) => {
    const ctx = context as unknown as ORPCContext
    // TODO: プロジェクトに応じて統計データを取得
    // 例:
    // const { prisma } = ctx
    // const totalUsers = await prisma.user.count()
    void ctx // 未使用エラーを防ぐ（実装時に削除）

    const totalUsers = 0

    return {
      totalUsers,
    }
  })
