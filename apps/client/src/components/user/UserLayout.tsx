/**
 * ユーザー向け共通レイアウトコンポーネント
 * すべてのユーザー向け画面で統一されたヘッダーとナビゲーションを提供
 */
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export type NavItem = {
  path: string
  label: string
  route: string
}

type UserLayoutProps = {
  children: React.ReactNode
  title: string
  description?: string
  currentPath: string
  navItems?: NavItem[]
  // TODO: プロジェクトに応じて認証フックから取得したユーザー情報を渡す
  user?: { name: string; email?: string }
  onLogout?: () => void
}

export function UserLayout({
  children,
  title,
  description,
  currentPath,
  navItems,
  user,
  onLogout,
}: UserLayoutProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  const defaultNavItems: NavItem[] = [
    { path: 'home', label: t('navigation.home'), route: '/user/home' },
    { path: 'contact', label: t('navigation.contact'), route: '/user/contact' },
  ]

  const navItemsToUse = navItems ?? defaultNavItems

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout()
    }
    navigate('/user/login')
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
              {onLogout && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                >
                  ログアウト
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ナビゲーション */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navItemsToUse.map((item) => (
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
