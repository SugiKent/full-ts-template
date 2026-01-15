/**
 * デバイス認証サービス
 *
 * Device ID とアクセストークンの管理
 */
import * as Crypto from 'expo-crypto'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

// SecureStore キー
const DEVICE_ID_KEY = 'device_id'
const ACCESS_TOKEN_KEY = 'access_token'
const TOKEN_EXPIRES_AT_KEY = 'token_expires_at'

/**
 * Device ID を取得（存在しない場合は生成）
 */
export async function getOrCreateDeviceId(): Promise<string> {
  const existingId = await SecureStore.getItemAsync(DEVICE_ID_KEY)

  if (existingId) {
    return existingId
  }

  // UUID v4 を生成
  const newId = Crypto.randomUUID()
  await SecureStore.setItemAsync(DEVICE_ID_KEY, newId)

  return newId
}

/**
 * Device ID を取得
 */
export async function getDeviceId(): Promise<string | null> {
  return SecureStore.getItemAsync(DEVICE_ID_KEY)
}

/**
 * アクセストークンを取得
 */
export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
}

/**
 * アクセストークンを保存
 */
export async function saveAccessToken(token: string, expiresAt: Date): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token)
  await SecureStore.setItemAsync(TOKEN_EXPIRES_AT_KEY, expiresAt.toISOString())
}

/**
 * トークンの有効期限を取得
 */
export async function getTokenExpiresAt(): Promise<Date | null> {
  const expiresAtStr = await SecureStore.getItemAsync(TOKEN_EXPIRES_AT_KEY)

  if (!expiresAtStr) {
    return null
  }

  return new Date(expiresAtStr)
}

/**
 * トークンが期限切れかどうかをチェック
 */
export async function isTokenExpired(): Promise<boolean> {
  const expiresAt = await getTokenExpiresAt()

  if (!expiresAt) {
    return true
  }

  // 24時間前から期限切れとみなす（余裕を持たせる）
  const bufferMs = 24 * 60 * 60 * 1000
  return expiresAt.getTime() - bufferMs < Date.now()
}

/**
 * 認証データをクリア
 */
export async function clearAuthData(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY)
  await SecureStore.deleteItemAsync(TOKEN_EXPIRES_AT_KEY)
}

/**
 * すべての認証データをクリア（Device ID 含む）
 */
export async function clearAllData(): Promise<void> {
  await SecureStore.deleteItemAsync(DEVICE_ID_KEY)
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY)
  await SecureStore.deleteItemAsync(TOKEN_EXPIRES_AT_KEY)
}

/**
 * プラットフォームを取得
 */
export function getPlatform(): 'ios' | 'android' {
  return Platform.OS === 'ios' ? 'ios' : 'android'
}
