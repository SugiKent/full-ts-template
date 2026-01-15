/**
 * ユーザー向けAPI oRPC Router
 *
 * 一般ユーザー向けProcedureをまとめたRouter
 * v1 Router を re-export して後方互換性を維持
 */

import { v1Router } from './v1/index.js'

/**
 * UserRouter
 *
 * v1 Router を直接エクスポート（後方互換性のため）
 * 新規コードは `/api/user/v1/rpc` を使用すること
 */
export const userRouter = v1Router

/**
 * UserRouter型
 *
 * クライアント側でこの型を使用してoRPCクライアントを初期化
 */
export type UserRouter = typeof userRouter

// v1 Router もエクスポート
export { type V1Router, v1Router } from './v1/index.js'
