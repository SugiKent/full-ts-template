/**
 * 管理画面お問い合わせ一覧ページ
 */
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CONTACT_CATEGORIES,
  CONTACT_CATEGORY_LABELS,
  CONTACT_STATUS,
  CONTACT_STATUS_LABELS,
  type ContactCategory,
  type ContactStatus,
} from '../../../shared/types/contact'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { orpcClient } from '../../services/orpc-client'

type ThreadItem = {
  id: string
  userId: string
  category: ContactCategory
  subject: string
  status: ContactStatus
  createdAt: Date
  updatedAt: Date
  unreadCount?: number
  user?: {
    name: string
    email: string
  }
  lastMessage?: {
    content: string
    createdAt: Date
  }
}

type ThreadsResponse = {
  threads: ThreadItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function Contacts() {
  const { user, loading: authLoading, error: authError } = useAdminAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<ThreadsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const limit = 20

  // フィルタ
  const [statusFilter, setStatusFilter] = useState<ContactStatus | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<ContactCategory | ''>('')

  const fetchThreads = useCallback(
    async (currentPage: number) => {
      setLoading(true)
      setError(null)
      try {
        const params: {
          page: number
          limit: number
          status?: ContactStatus
          category?: ContactCategory
        } = { page: currentPage, limit }

        if (statusFilter) {
          params.status = statusFilter
        }
        if (categoryFilter) {
          params.category = categoryFilter
        }

        const result = await orpcClient.contacts.getThreads(params)
        setData(result as ThreadsResponse)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'お問い合わせ一覧の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    },
    [statusFilter, categoryFilter],
  )

  useEffect(() => {
    if (!authLoading && !user) {
      if (authError) {
        navigate(`/admin/login?error=${encodeURIComponent(authError)}`)
      } else {
        navigate('/admin/login')
      }
    }
  }, [user, authLoading, authError, navigate])

  useEffect(() => {
    if (user) {
      fetchThreads(page)
    }
  }, [user, page, fetchThreads])

  // フィルタ変更時にページをリセット
  // biome-ignore lint/correctness/useExhaustiveDependencies: フィルタ変更時にページリセットを実行
  useEffect(() => {
    setPage(1)
  }, [statusFilter, categoryFilter])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
          <p className="mt-2 text-sm text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // ステータスバッジのスタイル
  const getStatusStyle = (status: ContactStatus) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <AdminLayout title="お問い合わせ管理" currentPath="contacts">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">お問い合わせ管理</h1>
        </div>

        {/* フィルタ */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">
              ステータス
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ContactStatus | '')}
              className="mt-1 block w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">すべて</option>
              {Object.entries(CONTACT_STATUS).map(([key, value]) => (
                <option key={key} value={value}>
                  {CONTACT_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700">
              カテゴリ
            </label>
            <select
              id="categoryFilter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ContactCategory | '')}
              className="mt-1 block w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">すべて</option>
              {Object.entries(CONTACT_CATEGORIES).map(([key, value]) => (
                <option key={key} value={value}>
                  {CONTACT_CATEGORY_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
              <p className="mt-2 text-sm text-gray-600">読み込み中...</p>
            </div>
          </div>
        ) : data ? (
          <>
            <div className="mb-4 text-sm text-gray-600">
              全 {data.total} 件中 {(page - 1) * limit + 1} - {Math.min(page * limit, data.total)}{' '}
              件を表示
            </div>

            {data.threads.length === 0 ? (
              <div className="rounded-lg bg-white p-12 text-center shadow">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">お問い合わせはありません</h3>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        件名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        ユーザー
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        カテゴリ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        最終更新
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {data.threads.map((thread) => (
                      <tr key={thread.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusStyle(thread.status)}`}
                            >
                              {CONTACT_STATUS_LABELS[thread.status]}
                            </span>
                            {thread.unreadCount && thread.unreadCount > 0 && (
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                                {thread.unreadCount}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/admin/contacts/${thread.id}`}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                          >
                            {thread.subject}
                          </Link>
                          {thread.lastMessage && (
                            <p className="mt-1 max-w-xs truncate text-sm text-gray-500">
                              {thread.lastMessage.content}
                            </p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {thread.user ? (
                            <div>
                              <p className="font-medium text-gray-900">{thread.user.name}</p>
                              <p className="text-gray-500">{thread.user.email}</p>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {CONTACT_CATEGORY_LABELS[thread.category]}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatDate(thread.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  前へ
                </button>
                <span className="text-sm text-gray-600">
                  {page} / {data.totalPages} ページ
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  次へ
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </AdminLayout>
  )
}
