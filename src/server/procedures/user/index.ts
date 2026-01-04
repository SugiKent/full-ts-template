/**
 * ユーザー向けAPI oRPC Router
 *
 * 一般ユーザー向けProcedureをまとめたRouter
 * プロジェクトに応じてProcedureを追加してください
 */

import { os } from '@orpc/server'
import { contactRouter } from './contact.js'

/**
 * UserRouter
 *
 * クライアント側で型安全にアクセスするためのルーター定義
 */
export const userRouter = os.router({
  contact: os.router(contactRouter),
  // TODO: プロジェクトに応じてProcedureを追加
  // 例:
  // profile: os.router({
  //   get: getProfileProcedure,
  //   update: updateProfileProcedure,
  // }),
})

/**
 * UserRouter型
 *
 * クライアント側でこの型を使用してoRPCクライアントを初期化
 */
export type UserRouter = typeof userRouter
