/**
 * お問い合わせ一覧ページ
 *
 * ユーザーが自分のお問い合わせを一覧表示・新規作成
 */
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import {
  CONTACT_CATEGORIES,
  type ContactCategory,
  type ContactStatus,
} from '../../../shared/types/contact'
import { UserLayout } from '../../components/user/UserLayout'
import { useUserAuth } from '../../hooks/useUserAuth'
import { userOrpcClient } from '../../services/user-orpc-client'

interface ThreadItem {
  id: string
  category: ContactCategory
  subject: string
  status: ContactStatus
  createdAt: Date
  updatedAt: Date
  lastMessage?: {
    content: string
    createdAt: Date
  }
}

// カテゴリラベル
const CATEGORY_LABELS: Record<ContactCategory, string> = {
  technical: '技術的な問題',
  billing: '料金について',
  feature_request: '機能リクエスト',
  other: 'その他',
}

// ステータスラベル
const STATUS_LABELS: Record<ContactStatus, string> = {
  open: '未対応',
  in_progress: '対応中',
  resolved: '解決済み',
  closed: 'クローズ',
}

export default function Contact() {
  const { t } = useTranslation('common')
  const { user, loading: authLoading, error: authError, signOut } = useUserAuth()
  const navigate = useNavigate()

  const [threads, setThreads] = useState<ThreadItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // フォーム状態
  const [category, setCategory] = useState<ContactCategory>(CONTACT_CATEGORIES.OTHER)
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // 未認証の場合はログインページにリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      if (authError) {
        navigate(`/user/login?error=${encodeURIComponent(authError)}`)
      } else {
        navigate('/user/login')
      }
    }
  }, [user, authLoading, authError, navigate])

  // スレッド一覧を取得
  const fetchThreads = useCallback(async () => {
    if (!user?.id) return

    try {
      const result = await userOrpcClient.contact.getThreads({
        userId: user.id,
        page: 1,
        limit: 50,
      })
      setThreads(result.threads as ThreadItem[])
    } catch (error) {
      console.error('Failed to fetch threads:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchThreads()
  }, [fetchThreads])

  // お問い合わせ送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !subject.trim() || !content.trim()) return

    setSubmitting(true)
    setFormError(null)

    try {
      const result = await userOrpcClient.contact.createThread({
        userId: user.id,
        category,
        subject: subject.trim(),
        content: content.trim(),
      })

      if (result.success && result.thread) {
        // スレッド詳細ページに遷移
        navigate(`/user/contact/${result.thread.id}`)
      } else {
        setFormError(result.error || '送信に失敗しました')
      }
    } catch (error) {
      console.error('Failed to create thread:', error)
      setFormError('送信に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  // ローディング中
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent" />
          <p className="mt-2 text-sm text-gray-600">{t('loading')}</p>
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

  return (
    <UserLayout
      title={t('contact.title')}
      description={t('contact.description')}
      currentPath="contact"
      user={{ name: user.name, email: user.email }}
      onLogout={signOut}
    >
      <div className="mx-auto max-w-4xl">
        {/* ヘッダー */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t('contact.title')}</h1>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {showForm ? t('cancel') : t('contact.new')}
          </button>
        </div>

        {/* 新規作成フォーム */}
        {showForm && (
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-medium text-gray-900">{t('contact.new')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* カテゴリ */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  カテゴリ <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ContactCategory)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {Object.entries(CONTACT_CATEGORIES).map(([key, value]) => (
                    <option key={key} value={value}>
                      {CATEGORY_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>

              {/* 件名 */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  件名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder={t('contact.subjectPlaceholder')}
                />
              </div>

              {/* 本文 */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  本文 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  maxLength={10000}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder={t('contact.contentPlaceholder')}
                />
              </div>

              {/* エラー */}
              {formError && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              {/* 送信ボタン */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !subject.trim() || !content.trim()}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <svg
                        className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      送信中...
                    </>
                  ) : (
                    '送信する'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* お問い合わせ一覧 */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">{t('contact.history')}</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-r-transparent" />
            </div>
          ) : threads.length === 0 ? (
            <div className="px-6 py-12 text-center">
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                お問い合わせ履歴がありません
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                ご質問やお困りのことがあればお気軽にお問い合わせください
              </p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                新規お問い合わせ
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {threads.map((thread) => (
                <li key={thread.id}>
                  <Link
                    to={`/user/contact/${thread.id}`}
                    className="block px-6 py-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusStyle(thread.status)}`}
                          >
                            {STATUS_LABELS[thread.status]}
                          </span>
                          <span className="text-xs text-gray-500">
                            {CATEGORY_LABELS[thread.category]}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm font-medium text-gray-900">
                          {thread.subject}
                        </p>
                        {thread.lastMessage && (
                          <p className="mt-1 truncate text-sm text-gray-500">
                            {thread.lastMessage.content}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(thread.updatedAt).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </UserLayout>
  )
}
