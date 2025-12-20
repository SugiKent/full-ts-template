/**
 * oRPCクライアント
 *
 * サーバー側のAdminRouterを型安全に呼び出すクライアント
 */

import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import type { AdminRouter } from '../../server/procedures/admin/index'

/**
 * oRPC Linkの作成
 */
const link = new RPCLink({
  url: `${window.location.origin}/api/admin/rpc`,
  fetch: (input, init) => {
    // Cookie認証を含める
    return fetch(input, {
      ...init,
      credentials: 'include',
    })
  },
})

/**
 * oRPCクライアントインスタンス
 *
 * 使用例:
 * ```ts
 * const result = await orpcClient.users.list({ page: 1, limit: 50 })
 * // resultは完全に型安全
 * ```
 */
export const orpcClient: RouterClient<AdminRouter> = createORPCClient(link)
