/**
 * 管理画面共通レイアウトコンポーネント
 * すべての管理画面で統一されたヘッダーとナビゲーションを提供
 */
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../hooks/useAdminAuth'

export type NavItem = {
  path: string
  label: string
  route: string
}

type AdminLayoutProps = {
  children: React.ReactNode
  title: string
  description?: string
  currentPath: string
  navItems?: NavItem[]
}

const defaultNavItems: NavItem[] = [
  { path: 'dashboard', label: 'ダッシュボード', route: '/admin/dashboard' },
]

export function AdminLayout({
  children,
  title,
  description,
  currentPath,
  navItems = defaultNavItems,
}: AdminLayoutProps) {
  const { user, signOut } = useAdminAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
            <div className="flex items-center gap-4">
              {user && <span className="text-sm text-gray-600">{user.name}</span>}
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

      {/* ナビゲーション */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.route)}
                className={`border-b-2 px-1 py-4 text-sm font-medium ${
                  currentPath === item.path
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
