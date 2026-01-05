import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import type { UserRouter } from '@repo/server/procedures/user'
import * as SecureStore from 'expo-secure-store'
import { API_URL } from '@/constants'

/**
 * RPCLink using expo/fetch
 * Supports Event Iterator for streaming
 */
const link = new RPCLink({
  url: `${API_URL}/api/user/rpc`,
  async fetch(request, init) {
    // Dynamic import expo/fetch
    const { fetch } = await import('expo/fetch')

    // Get token from SecureStore
    const token = await SecureStore.getItemAsync('session_token')

    const headers = new Headers(request.headers)
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    return fetch(request.url, {
      body: await request.blob(),
      headers,
      method: request.method,
      signal: request.signal,
      ...init,
    })
  },
})

/**
 * oRPC client instance
 */
export const orpcClient: RouterClient<UserRouter> = createORPCClient(link)
