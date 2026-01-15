/**
 * oRPC認証ミドルウェア
 *
 * Better Auth経由で認証状態を検証し、ロールベースのアクセス制御を提供
 * Device ID認証もサポート
 */

import { ORPCError, os } from '@orpc/server'
import type { PrismaClient } from '@prisma/client'

/**
 * デバイスコンテキスト型定義
 */
export interface DeviceContext {
  id: string
  deviceId: string
  hasAgreedToTerms: boolean
}

/**
 * ユーザーコンテキスト型定義
 */
export interface UserContext {
  id: string
  email: string
  role: string
}

/**
 * oRPCコンテキスト型定義
 */
export interface ORPCContext {
  prisma: PrismaClient
  device?: DeviceContext
  user?: UserContext
}

/**
 * デバイス認証済みコンテキスト型定義
 */
export interface AuthenticatedDeviceContext extends ORPCContext {
  device: DeviceContext
}

/**
 * コンテキストからデバイス ID を取得
 *
 * requireDevice ミドルウェア通過後に使用
 * デバイスが存在しない場合はエラーをスロー
 */
export function getDeviceId(context: unknown): string {
  const ctx = context as ORPCContext
  if (!ctx.device) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Device context not found' })
  }
  return ctx.device.id
}

/**
 * コンテキストからデバイスコンテキストを取得
 *
 * requireDevice ミドルウェア通過後に使用
 * デバイスが存在しない場合はエラーをスロー
 */
export function getDeviceContext(context: unknown): DeviceContext {
  const ctx = context as ORPCContext
  if (!ctx.device) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Device context not found' })
  }
  return ctx.device
}

/**
 * 認証必須ミドルウェア（ユーザー認証）
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
 * デバイス認証必須ミドルウェア
 *
 * デバイスが認証されていない場合はUNAUTHORIZEDエラーを返す
 */
export const requireDevice = os.use(({ context, next }) => {
  const ctx = context as unknown as ORPCContext

  if (!ctx.device) {
    throw new ORPCError('UNAUTHORIZED')
  }

  return next({ context })
})

/**
 * 利用規約同意必須ミドルウェア
 *
 * デバイスが利用規約に同意していない場合はFORBIDDENエラーを返す
 */
export const requireTermsAgreement = os.use(({ context, next }) => {
  const ctx = context as unknown as ORPCContext

  if (!ctx.device) {
    throw new ORPCError('UNAUTHORIZED')
  }

  if (!ctx.device.hasAgreedToTerms) {
    throw new ORPCError('FORBIDDEN', { message: 'Terms agreement required' })
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
