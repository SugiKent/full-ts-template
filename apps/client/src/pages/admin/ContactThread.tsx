/**
 * 管理画面お問い合わせスレッド詳細ページ
 */

import {
  CONTACT_CATEGORY_LABELS,
  CONTACT_STATUS,
  CONTACT_STATUS_LABELS,
  type ContactCategory,
  type ContactStatus,
} from '@shared/types/contact'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { orpcClient } from '../../services/orpc-client'

type Message = {
  id: string
  senderType: string
  senderId: string | null
  content: string
  isRead: boolean
  createdAt: Date
}

type ThreadDetail = {
  id: string
  userId: string
  category: ContactCategory
  subject: string
  status: ContactStatus
  createdAt: Date
  updatedAt: Date
  user: {
    name: string
    email: string
  }
  messages: Message[]
}

export default function ContactThread() {
  const { threadId } = useParams<{ threadId: string }>()
  const { user, loading: authLoading, error: authError } = useAdminAuth()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [thread, setThread] = useState<ThreadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 返信フォーム
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  // ステータス変更
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchThread = useCallback(async () => {
    if (!threadId) return

    setLoading(true)
    setError(null)
    try {
      const result = await orpcClient.contacts.getThread({ threadId })
      if (result.success && result.thread) {
        setThread(result.thread as ThreadDetail)
      } else {
        setError(result.error || 'スレッドが見つかりません')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スレッドの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [threadId])

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
    if (user && threadId) {
      fetchThread()
    }
  }, [user, threadId, fetchThread])

  // メッセージ一覧の最下部にスクロール
  // biome-ignore lint/correctness/useExhaustiveDependencies: thread.messages変更時にスクロールを実行
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread?.messages])

  // メッセージ送信
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!threadId || !newMessage.trim()) return

    setSending(true)
    setSendError(null)

    try {
      const result = await orpcClient.contacts.sendMessage({
        threadId,
        content: newMessage.trim(),
      })

      if (result.success) {
        setNewMessage('')
        await fetchThread()
      } else {
        setSendError(result.error || 'メッセージの送信に失敗しました')
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'メッセージの送信に失敗しました')
    } finally {
      setSending(false)
    }
  }

  // ステータス変更
  const handleStatusChange = async (newStatus: ContactStatus) => {
    if (!threadId || !thread) return

    setUpdatingStatus(true)
    try {
      const result = await orpcClient.contacts.updateStatus({
        threadId,
        status: newStatus,
      })

      if (result.success) {
        setThread({ ...thread, status: newStatus })
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

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

  return (
    <AdminLayout title="お問い合わせ詳細" currentPath="contacts">
      <div className="px-4 py-6 sm:px-0">
        {/* パンくずリスト */}
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link to="/admin/contacts" className="hover:text-indigo-600">
                お問い合わせ管理
              </Link>
            </li>
            <li>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </li>
            <li className="text-gray-900">詳細</li>
          </ol>
        </nav>

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
        ) : thread ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* メインコンテンツ */}
            <div className="lg:col-span-2">
              <div className="rounded-lg bg-white shadow">
                {/* ヘッダー */}
                <div className="border-b border-gray-200 px-6 py-4">
                  <h1 className="text-xl font-bold text-gray-900">{thread.subject}</h1>
                  <div className="mt-2 flex items-center gap-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusStyle(thread.status)}`}
                    >
                      {CONTACT_STATUS_LABELS[thread.status]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {CONTACT_CATEGORY_LABELS[thread.category]}
                    </span>
                  </div>
                </div>

                {/* メッセージ履歴 */}
                <div className="max-h-96 overflow-y-auto px-6 py-4">
                  <div className="space-y-4">
                    {thread.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-3 ${
                            message.senderType === 'admin'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                          <p
                            className={`mt-1 text-xs ${
                              message.senderType === 'admin' ? 'text-indigo-200' : 'text-gray-500'
                            }`}
                          >
                            {message.senderType === 'admin' ? '運営' : thread.user.name}
                            {' - '}
                            {new Date(message.createdAt).toLocaleString('ja-JP')}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* 返信フォーム */}
                <div className="border-t border-gray-200 px-6 py-4">
                  <form onSubmit={handleSendMessage}>
                    <div className="flex gap-3">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={3}
                        maxLength={10000}
                        placeholder="返信を入力..."
                        className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sending ? (
                          <svg
                            className="h-5 w-5 animate-spin text-white"
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
                        ) : (
                          '送信'
                        )}
                      </button>
                    </div>
                    {sendError && <p className="mt-2 text-sm text-red-600">{sendError}</p>}
                  </form>
                </div>
              </div>
            </div>

            {/* サイドバー */}
            <div className="space-y-6">
              {/* ユーザー情報 */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-sm font-medium text-gray-900">ユーザー情報</h2>
                <dl className="mt-4 space-y-3">
                  <div>
                    <dt className="text-xs text-gray-500">名前</dt>
                    <dd className="mt-1 text-sm text-gray-900">{thread.user.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">メールアドレス</dt>
                    <dd className="mt-1 text-sm text-gray-900">{thread.user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">作成日時</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(thread.createdAt).toLocaleString('ja-JP')}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* ステータス変更 */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-sm font-medium text-gray-900">ステータス変更</h2>
                <div className="mt-4 space-y-2">
                  {Object.entries(CONTACT_STATUS).map(([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleStatusChange(value)}
                      disabled={updatingStatus || thread.status === value}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm ${
                        thread.status === value
                          ? 'bg-indigo-100 text-indigo-800 font-medium'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <span>{CONTACT_STATUS_LABELS[value]}</span>
                      {thread.status === value && (
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  )
}
