/**
 * 管理画面API oRPC Router
 *
 * すべての管理画面ProcedureをまとめたAppRouter
 * プロジェクトに応じてProcedureを追加してください
 */

import { adminContactRouter } from './contact.js'
import { getDashboardStats } from './dashboard.js'
import { adminJobsRouter } from './jobs.js'

/**
 * AppRouter
 *
 * クライアント側で型安全にアクセスするためのルーター定義
 */
export const adminRouter = {
  dashboard: {
    getStats: getDashboardStats,
  },
  contacts: adminContactRouter,
  jobs: adminJobsRouter,
  // TODO: プロジェクトに応じてProcedureを追加
  // 例:
  // users: {
  //   list: listUsers,
  //   get: getUser,
  //   create: createUser,
  //   update: updateUser,
  //   delete: deleteUser,
  // },
}

/**
 * AppRouter型
 *
 * クライアント側でこの型を使用してoRPCクライアントを初期化
 */
export type AdminRouter = typeof adminRouter
