import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import type { V1Router } from '@wishlist/server/procedures/user'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { API_URL } from '@/constants'
import { getAccessToken } from './device.service'

/**
 * アプリバージョンを取得
 */
function getAppVersion(): string {
  return Constants.expoConfig?.version ?? '1.0.0'
}

/**
 * OS バージョンを取得
 * 形式: "iOS/17.0" or "Android/14"
 *
 * Note: Platform.Version を使用（expo-device はネイティブモジュールが必要で
 * Expo Go では動作しないため）
 */
function getOSVersion(): string {
  const osName = Platform.OS === 'ios' ? 'iOS' : 'Android'
  const osVersion = String(Platform.Version)
  return `${osName}/${osVersion}`
}

/**
 * RPCLink using expo/fetch
 * Supports Event Iterator for streaming
 */
const link = new RPCLink({
  url: `${API_URL}/api/user/v1/rpc`,
  async fetch(request, init) {
    // Dynamic import expo/fetch
    const { fetch } = await import('expo/fetch')

    // Get access token from device service
    const token = await getAccessToken()

    const headers = new Headers(request.headers)
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    // Add app version headers
    headers.set('X-App-Version', getAppVersion())
    headers.set('X-OS-Version', getOSVersion())

    // Note: signal type cast needed due to React Native and Node.js type differences
    return fetch(request.url, {
      body: await request.blob(),
      headers,
      method: request.method,
      ...(request.signal && { signal: request.signal as unknown as AbortSignal }),
      ...init,
    })
  },
})

/**
 * oRPC client instance (v1 API)
 */
export const orpcClient: RouterClient<V1Router> = createORPCClient(link)
