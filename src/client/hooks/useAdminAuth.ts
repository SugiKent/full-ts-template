/**
 * 管理画面用認証フック
 * Better Auth Clientを使用してログイン/ログアウト機能を提供します
 */
import { createAuthClient } from 'better-auth/client'
import { magicLinkClient } from 'better-auth/client/plugins'
import { useEffect, useState } from 'react'

// Better Auth Clientインスタンスを作成
// Vite proxy経由でAPIサーバーに転送される
export const adminAuthClient = createAuthClient({
  baseURL: window.location.origin,
  plugins: [magicLinkClient()],
})

// 管理者ユーザーの型定義
export interface AdminUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
  image?: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

/**
 * 管理画面用認証フック
 */
export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 初回マウント時にセッションを取得
  useEffect(() => {
    async function loadSession() {
      try {
        setLoading(true)
        const result = await adminAuthClient.getSession()

        // getSessionの結果は { data: { user, session } | null, error: ... } の形式
        if (result.data && 'user' in result.data && result.data.user) {
          const sessionUser = result.data.user as unknown as AdminUser
          // ロールチェック: adminロールのみ許可
          if (sessionUser.role !== 'admin') {
            // 許可されていないロールの場合はセッションをクリア
            await adminAuthClient.signOut()
            setUser(null)
            setError('このアカウントでは管理画面にアクセスできません')
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
   * 管理者として登録（role='admin'）
   */
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setError(null)
      setLoading(true)

      // Better Authのカスタムフィールド(role)を含めて登録
      const result = await adminAuthClient.signUp.email({
        email,
        password,
        name,
        // @ts-expect-error - roleはサーバー側で設定されたカスタムフィールド
        role: 'admin',
      })

      if (result.error) {
        setError(result.error.message || '登録に失敗しました')
        return { success: false, error: result.error.message }
      }

      // Better Authのレスポンスから user を取得
      const responseData = result.data
      if (responseData && 'user' in responseData && responseData.user) {
        setUser(responseData.user as unknown as AdminUser)
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
   * ロールチェック: adminロールのみ許可
   */
  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)

      const result = await adminAuthClient.signIn.email({
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
        const signedInUser = responseData.user as unknown as AdminUser

        // ロールチェック: adminロールのみ許可
        if (signedInUser.role !== 'admin') {
          // 許可されていないロールの場合はサインアウトしてエラー
          await adminAuthClient.signOut()
          setUser(null)
          const errorMsg =
            '一般ユーザーアカウントでは管理画面にログインできません。ユーザーページからログインしてください。'
          setError(errorMsg)
          return { success: false, error: errorMsg }
        }

        setUser(signedInUser)

        // セッションが確実に確立されるよう、再度getSessionを呼び出す
        const sessionResult = await adminAuthClient.getSession()
        if (sessionResult.data && 'user' in sessionResult.data && sessionResult.data.user) {
          setUser(sessionResult.data.user as unknown as AdminUser)
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
      await adminAuthClient.signOut()
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
   * ロールチェック
   */
  const hasRole = (allowedRoles: string[]) => {
    return user?.role ? allowedRoles.includes(user.role) : false
  }

  /**
   * マジックリンクを送信
   */
  const sendMagicLink = async (email: string) => {
    try {
      setError(null)
      setLoading(true)

      const result = await adminAuthClient.signIn.magicLink({
        email,
        callbackURL: `${window.location.origin}/admin/dashboard`,
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

  /**
   * メール認証を再送信
   */
  const resendVerificationEmail = async () => {
    try {
      setError(null)
      setLoading(true)

      const result = await adminAuthClient.sendVerificationEmail({
        email: user?.email || '',
        callbackURL: `${window.location.origin}/admin/dashboard`,
      })

      if (result.error) {
        setError(result.error.message || '認証メールの送信に失敗しました')
        return { success: false, error: result.error.message }
      }

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '認証メールの送信に失敗しました'
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
    hasRole,
    sendMagicLink,
    resendVerificationEmail,
  }
}
