/**
 * お問い合わせスレッド詳細ページ
 *
 * ユーザーがスレッドの履歴を確認・メッセージ送信
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CONTACT_STATUS,
  type ContactCategory,
  type ContactStatus,
} from '../../../shared/types/contact'
import { UserLayout } from '../../components/user/UserLayout'
import { useUserAuth } from '../../hooks/useUserAuth'
import { userOrpcClient } from '../../services/user-orpc-client'

interface Message {
  id: string
  senderType: string
  content: string
  createdAt: Date
}

interface ThreadDetail {
  id: string
  category: ContactCategory
  subject: string
  status: ContactStatus
  createdAt: Date
  updatedAt: Date
  messages: Message[]
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

export default function ContactThread() {
  const { t } = useTranslation('common')
  const { threadId } = useParams<{ threadId: string }>()
  const { user, loading: authLoading, error: authError, signOut } = useUserAuth()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [thread, setThread] = useState<ThreadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // メッセージ送信フォーム
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

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

  // スレッド詳細を取得
  const fetchThread = useCallback(async () => {
    if (!user?.id || !threadId) return

    try {
      const result = await userOrpcClient.contact.getThread({
        userId: user.id,
        threadId,
      })

      if (result.success && result.thread) {
        setThread(result.thread as ThreadDetail)
      } else {
        setError(result.error || 'お問い合わせが見つかりません')
      }
    } catch (err) {
      console.error('Failed to fetch thread:', err)
      setError('読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }, [user?.id, threadId])

  useEffect(() => {
    fetchThread()
  }, [fetchThread])

  // メッセージ一覧の最下部にスクロール
  // biome-ignore lint/correctness/useExhaustiveDependencies: thread.messages変更時にスクロールを実行
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread?.messages])

  // メッセージ送信
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !threadId || !newMessage.trim()) return

    setSending(true)
    setSendError(null)

    try {
      const result = await userOrpcClient.contact.sendMessage({
        userId: user.id,
        threadId,
        content: newMessage.trim(),
      })

      if (result.success) {
        setNewMessage('')
        // スレッドを再取得
        await fetchThread()
      } else {
        setSendError(result.error || '送信に失敗しました')
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      setSendError('送信に失敗しました')
    } finally {
      setSending(false)
    }
  }

  // スレッドがクローズ/解決済みか
  const isClosed =
    thread?.status === CONTACT_STATUS.RESOLVED || thread?.status === CONTACT_STATUS.CLOSED

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
      title={t('contact.threadTitle')}
      description={t('contact.threadDescription')}
      currentPath="contact"
      user={{ name: user.name, email: user.email }}
      onLogout={signOut}
    >
      <div className="mx-auto max-w-4xl">
        {/* パンくずリスト */}
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link to="/user/contact" className="hover:text-indigo-600">
                お問い合わせ
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
            <li className="text-gray-900">{t('detail')}</li>
          </ol>
        </nav>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-r-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
            <Link
              to="/user/contact"
              className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              お問い合わせ一覧に戻る
            </Link>
          </div>
        ) : thread ? (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            {/* ヘッダー */}
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusStyle(thread.status)}`}
                >
                  {STATUS_LABELS[thread.status]}
                </span>
                <span className="text-xs text-gray-500">{CATEGORY_LABELS[thread.category]}</span>
              </div>
              <h1 className="mt-2 text-xl font-bold text-gray-900">{thread.subject}</h1>
              <p className="mt-1 text-sm text-gray-500">
                作成日: {new Date(thread.createdAt).toLocaleString('ja-JP')}
              </p>
            </div>

            {/* メッセージ履歴 */}
            <div className="max-h-96 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {thread.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.senderType === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      <p
                        className={`mt-1 text-xs ${
                          message.senderType === 'user' ? 'text-indigo-200' : 'text-gray-500'
                        }`}
                      >
                        {message.senderType === 'user' ? t('you') : t('operator')}
                        {' - '}
                        {new Date(message.createdAt).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* メッセージ送信フォーム */}
            <div className="border-t border-gray-200 px-6 py-4">
              {isClosed ? (
                <div className="rounded-md bg-gray-50 p-4 text-center">
                  <p className="text-sm text-gray-600">
                    このお問い合わせは「{STATUS_LABELS[thread.status]}」となっています。
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    新しいお問い合わせは
                    <Link
                      to="/user/contact"
                      className="ml-1 font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      こちら
                    </Link>
                    から作成してください。
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage}>
                  <div className="flex gap-3">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                      maxLength={10000}
                      placeholder={t('contact.messagePlaceholder')}
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
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {sendError && <p className="mt-2 text-sm text-red-600">{sendError}</p>}
                </form>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </UserLayout>
  )
}
