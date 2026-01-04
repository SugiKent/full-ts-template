/**
 * ユーザー用認証フック
 * Better Auth Clientを使用してマジックリンク認証を提供します（パスワードレス）
 */
import { createAuthClient } from 'better-auth/client'
import { magicLinkClient } from 'better-auth/client/plugins'
import { useEffect, useState } from 'react'

// Better Auth Clientインスタンスを作成
// Vite proxy経由でAPIサーバーに転送される
export const userAuthClient = createAuthClient({
  baseURL: window.location.origin,
  plugins: [magicLinkClient()],
})

// ユーザーの型定義
export interface User {
  id: string
  email: string
  name: string
  emailVerified: boolean
  image?: string
  role: 'user' | 'admin'
  createdAt: string
  updatedAt: string
}

/**
 * ユーザー用認証フック（パスワードレス）
 */
export function useUserAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 初回マウント時にセッションを取得
  useEffect(() => {
    async function loadSession() {
      try {
        setLoading(true)
        const result = await userAuthClient.getSession()

        // getSessionの結果は { data: { user, session } | null, error: ... } の形式
        if (result.data && 'user' in result.data && result.data.user) {
          const sessionUser = result.data.user as unknown as User
          // ロールチェック: userロールのみ許可
          if (sessionUser.role !== 'user') {
            // 許可されていないロールの場合はセッションをクリア
            await userAuthClient.signOut()
            setUser(null)
            setError('このアカウントではユーザーページにアクセスできません')
          } else {
            setUser(sessionUser)
          }
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error('Failed to load session:', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [])

  /**
   * パスワードレス登録（マジックリンク送信）
   * 一般ユーザーとして登録（role='user'）
   */
  const signUp = async (email: string, name: string) => {
    try {
      setError(null)
      setLoading(true)

      // カスタムエンドポイントを使用してパスワードレス登録
      const response = await fetch('/api/auth/register-passwordless', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          role: 'user',
          callbackURL: `${window.location.origin}/user/home`,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || '登録に失敗しました')
        return { success: false, error: result.error }
      }

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登録に失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  /**
   * マジックリンクでサインイン（パスワードレス）
   */
  const signIn = async (email: string) => {
    try {
      setError(null)
      setLoading(true)

      const result = await userAuthClient.signIn.magicLink({
        email,
        callbackURL: `${window.location.origin}/user/home`,
      })

      if (result.error) {
        setError(result.error.message || 'ログインに失敗しました')
        return { success: false, error: result.error.message }
      }

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ログインに失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  /**
   * ログアウト
   */
  const signOut = async () => {
    try {
      setLoading(true)
      await userAuthClient.signOut()
      setUser(null)
      setError(null)
    } catch (err) {
      console.error('Failed to sign out:', err)
      setError(err instanceof Error ? err.message : 'ログアウトに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
  }
}
