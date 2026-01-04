/**
 * ユーザー向けoRPCクライアント
 *
 * サーバー側のUserRouterを型安全に呼び出すクライアント
 */

import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import type { UserRouter } from '@repo/server/procedures/user'

/**
 * oRPC Linkの作成
 */
const link = new RPCLink({
  url: `${window.location.origin}/api/user/rpc`,
  fetch: (input, init) => {
    // Cookie認証を含める
    return fetch(input, {
      ...init,
      credentials: 'include',
    })
  },
})

/**
 * ユーザー向けoRPCクライアントインスタンス
 *
 * 使用例:
 * ```ts
 * const result = await userOrpcClient.contact.getThreads({ userId, page: 1, limit: 50 })
 * // resultは完全に型安全
 * ```
 */
export const userOrpcClient: RouterClient<UserRouter> = createORPCClient(link)
