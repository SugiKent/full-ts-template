/**
 * ユーザーホームページ
 * ログイン後のメイン画面
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserAuth } from '../../hooks/useUserAuth'

export default function UserHome() {
  const { user, loading, error, signOut } = useUserAuth()
  const navigate = useNavigate()

  // 未認証の場合はログインページにリダイレクト
  useEffect(() => {
    if (!loading && !user) {
      // エラーがある場合はクエリパラメータで渡す
      if (error) {
        navigate(`/user/login?error=${encodeURIComponent(error)}`)
      } else {
        navigate('/user/login')
      }
    }
  }, [user, loading, error, navigate])

  const handleLogout = async () => {
    await signOut()
    navigate('/user/login')
  }

  // ローディング中
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-2 text-sm text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 未認証の場合は何も表示しない（リダイレクト処理が実行される）
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ホーム</h1>
              <p className="mt-1 text-sm text-gray-500">ようこそ、{user.name}さん</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ウェルカムカード */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    aria-label="ユーザーアイコン"
                    role="img"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <h2 className="text-lg font-medium text-gray-900">アカウント情報</h2>
                <div className="mt-2 text-sm text-gray-500">
                  <p>名前: {user.name}</p>
                  <p>メールアドレス: {user.email}</p>
                  <p>アカウントタイプ: {user.role === 'admin' ? '管理者' : 'ユーザー'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* プレースホルダーカード1 */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">📊</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">機能1</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {/* TODO: プロジェクトに応じて実装 */}
                      コンテンツ
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* プレースホルダーカード2 */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">📈</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">機能2</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {/* TODO: プロジェクトに応じて実装 */}
                      コンテンツ
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* プレースホルダーカード3 */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">⚙️</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">機能3</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {/* TODO: プロジェクトに応じて実装 */}
                      コンテンツ
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
