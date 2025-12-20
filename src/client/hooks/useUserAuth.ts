/**
 * ユーザー用認証フック
 * Better Auth Clientを使用してログイン/ログアウト機能を提供します
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
 * ユーザー用認証フック
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
   * Email/パスワードでサインアップ（新規登録）
   * 一般ユーザーとして登録（role='user'）
   */
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setError(null)
      setLoading(true)

      // Better Authのカスタムフィールド(role)を含めて登録
      const result = await userAuthClient.signUp.email({
        email,
        password,
        name,
        // @ts-expect-error - roleはサーバー側で設定されたカスタムフィールド
        role: 'user',
      })

      if (result.error) {
        setError(result.error.message || '登録に失敗しました')
        return { success: false, error: result.error.message }
      }

      // Better Authのレスポンスから user を取得
      const responseData = result.data
      if (responseData && 'user' in responseData && responseData.user) {
        setUser(responseData.user as unknown as User)
        return { success: true }
      }

      setError('登録に失敗しました')
      return { success: false, error: '登録に失敗しました' }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登録に失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Email/パスワードでサインイン
   * ロールチェック: userロールのみ許可
   */
  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)

      const result = await userAuthClient.signIn.email({
        email,
        password,
      })

      if (result.error) {
        setError(result.error.message || 'ログインに失敗しました')
        return { success: false, error: result.error.message }
      }

      // Better Authのレスポンスから user を取得
      // result.data は { user, session } またはnullを含む可能性がある
      const responseData = result.data
      if (responseData && 'user' in responseData && responseData.user) {
        const signedInUser = responseData.user as unknown as User

        // ロールチェック: userロールのみ許可
        if (signedInUser.role !== 'user') {
          // 許可されていないロールの場合はサインアウトしてエラー
          await userAuthClient.signOut()
          setUser(null)
          const errorMsg =
            '管理者アカウントではこちらからログインできません。管理画面からログインしてください。'
          setError(errorMsg)
          return { success: false, error: errorMsg }
        }

        setUser(signedInUser)

        // セッションが確実に確立されるよう、再度getSessionを呼び出す
        const sessionResult = await userAuthClient.getSession()
        if (sessionResult.data && 'user' in sessionResult.data && sessionResult.data.user) {
          setUser(sessionResult.data.user as unknown as User)
        }

        return { success: true }
      }

      setError('ログインに失敗しました')
      return { success: false, error: 'ログインに失敗しました' }
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

  /**
   * マジックリンクを送信
   */
  const sendMagicLink = async (email: string) => {
    try {
      setError(null)
      setLoading(true)

      const result = await userAuthClient.signIn.magicLink({
        email,
        callbackURL: `${window.location.origin}/user/home`,
      })

      if (result.error) {
        setError(result.error.message || 'マジックリンクの送信に失敗しました')
        return { success: false, error: result.error.message }
      }

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'マジックリンクの送信に失敗しました'
      setError(errorMessage)
      return { success: false, error: errorMessage }
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
    sendMagicLink,
  }
}
