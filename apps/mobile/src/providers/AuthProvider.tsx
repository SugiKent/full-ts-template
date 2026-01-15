/**
 * 認証プロバイダー
 *
 * Device ID ベースの匿名認証を管理
 */
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  clearAuthData,
  getAccessToken,
  getOrCreateDeviceId,
  getPlatform,
  isTokenExpired,
  saveAccessToken,
} from '../services/device.service'
import { orpcClient } from '../services/orpc-client'

interface AuthContextType {
  /** デバイス ID */
  deviceId: string | null
  /** 認証済みかどうか */
  isAuthenticated: boolean
  /** 認証処理中かどうか */
  isLoading: boolean
  /** エラー */
  error: Error | null
  /** 認証状態を更新 */
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  /**
   * デバイスを登録してトークンを取得
   */
  const registerDevice = useCallback(async (deviceIdToRegister: string) => {
    const result = await orpcClient.auth.registerDevice({
      deviceId: deviceIdToRegister,
      platform: getPlatform(),
    })

    if (!result.success || !result.accessToken || !result.expiresAt) {
      throw new Error(result.error || 'Failed to register device')
    }

    await saveAccessToken(result.accessToken, result.expiresAt)
    return true
  }, [])

  /**
   * トークンがサーバーで有効かどうかを検証
   *
   * getDeviceStatus API を使ってデバイスが存在するか確認
   * 存在しない = トークンが無効（DBリセットなど）
   */
  const verifyTokenValidity = useCallback(async (deviceIdToVerify: string): Promise<boolean> => {
    try {
      const result = await orpcClient.auth.getDeviceStatus({
        deviceId: deviceIdToVerify,
      })
      // デバイスが存在すればトークンは有効
      return result.success && result.device !== null
    } catch {
      // API エラーの場合は無効とみなす
      return false
    }
  }, [])

  /**
   * 認証を初期化
   *
   * 1. ローカルにトークンがあれば、サーバーで有効性を検証
   * 2. 無効な場合（DBリセットなど）は再登録
   * 3. トークンがない場合は新規登録
   */
  const initializeAuth = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Device ID を取得または生成
      const id = await getOrCreateDeviceId()
      setDeviceId(id)

      // 既存のトークンを確認
      const existingToken = await getAccessToken()

      if (existingToken) {
        // トークンが期限切れかチェック
        const expired = await isTokenExpired()

        if (expired) {
          // 期限切れの場合は再登録（refreshToken はDBにデバイスが必要なため）
          console.log('Token expired, re-registering device')
          await registerDevice(id)
        } else {
          // 期限内でも、サーバーでトークンが有効か検証
          const isValid = await verifyTokenValidity(id)

          if (!isValid) {
            // トークンが無効（DBリセットなど）→ 再登録
            console.log('Token invalid (device not found in DB), re-registering device')
            await clearAuthData()
            await registerDevice(id)
          }
          // 有効な場合はそのまま使用
        }
      } else {
        // トークンがない場合はデバイスを登録
        await registerDevice(id)
      }

      setIsAuthenticated(true)
    } catch (err) {
      console.error('Auth initialization failed:', err)
      setError(err instanceof Error ? err : new Error('Authentication failed'))
      setIsAuthenticated(false)

      // 認証データをクリアして再試行可能にする
      await clearAuthData()
    } finally {
      setIsLoading(false)
    }
  }, [registerDevice, verifyTokenValidity])

  /**
   * 認証状態を更新（リトライ用）
   */
  const refreshAuth = useCallback(async () => {
    await initializeAuth()
  }, [initializeAuth])

  // アプリ起動時に認証を初期化
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <AuthContext.Provider
      value={{
        deviceId,
        isAuthenticated,
        isLoading,
        error,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
