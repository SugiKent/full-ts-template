/**
 * 管理画面ダッシュボードページ
 * プロジェクトに応じて統計カードやクイックアクションをカスタマイズしてください
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { useAdminAuth } from '../../hooks/useAdminAuth'

export default function Dashboard() {
  const { user, loading, error } = useAdminAuth()
  const navigate = useNavigate()

  // 未認証の場合はログインページにリダイレクト
  useEffect(() => {
    if (!loading && !user) {
      // エラーがある場合はクエリパラメータで渡す
      if (error) {
        navigate(`/admin/login?error=${encodeURIComponent(error)}`)
      } else {
        navigate('/admin/login')
      }
    }
  }, [user, loading, error, navigate])

  // ローディング中
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
          <p className="mt-2 text-sm text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 未認証の場合は何も表示しない（リダイレクト処理が実行される）
  if (!user) {
    return null
  }

  // TODO: プロジェクトに応じて統計データを取得・表示
  const statsCards = [
    { name: '統計項目1', value: '0', icon: '📊' },
    { name: '統計項目2', value: '0', icon: '📈' },
    { name: '統計項目3', value: '0', icon: '📉' },
  ]

  return (
    <AdminLayout title="管理画面ダッシュボード" currentPath="dashboard">
      {/* 統計カードグリッド */}
      <div className="px-4 py-6 sm:px-0">
        <h2 className="mb-4 text-lg font-medium text-gray-900">概要</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {statsCards.map((stat) => (
            <div key={stat.name} className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-3xl">{stat.icon}</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-gray-500">{stat.name}</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{stat.value}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* クイックアクション */}
      <div className="px-4 py-6 sm:px-0">
        <h2 className="mb-4 text-lg font-medium text-gray-900">クイックアクション</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* TODO: プロジェクトに応じてクイックアクションを追加 */}
          <button
            type="button"
            onClick={() => {
              // TODO: 適切なページへ遷移
            }}
            className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <span className="mb-2 block text-3xl">➕</span>
            <span className="block text-sm font-medium text-gray-900">アクション1</span>
            <span className="mt-1 block text-xs text-gray-500">説明文をここに記載</span>
          </button>
          <button
            type="button"
            onClick={() => {
              // TODO: 適切なページへ遷移
            }}
            className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <span className="mb-2 block text-3xl">⚙️</span>
            <span className="block text-sm font-medium text-gray-900">アクション2</span>
            <span className="mt-1 block text-xs text-gray-500">説明文をここに記載</span>
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
