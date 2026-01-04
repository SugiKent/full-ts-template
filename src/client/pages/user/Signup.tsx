/**
 * ユーザーアカウント新規登録ページ（パスワードレス - マジックリンク）
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useUserAuth } from '../../hooks/useUserAuth'

export default function UserSignup() {
  const { t } = useTranslation('auth')
  const { t: tCommon } = useTranslation('common')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false)

  const { user, signUp, signIn } = useUserAuth()
  const navigate = useNavigate()

  // すでにログイン済みの場合はホームにリダイレクト
  useEffect(() => {
    if (user) {
      navigate('/user/home')
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const result = await signUp(email, name)

      if (result.success) {
        setIsMagicLinkSent(true)
      } else {
        setErrorMessage(result.error || '登録に失敗しました')
      }
    } catch (_err) {
      setErrorMessage('登録に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendMagicLink = async () => {
    setIsSubmitting(true)
    try {
      await signIn(email)
    } catch (_err) {
      // 再送信エラーは無視
    } finally {
      setIsSubmitting(false)
    }
  }

  // マジックリンク送信完了画面
  if (isMagicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{t('signup.linkSent')}</h2>
            <p className="mt-3 text-gray-600">{t('signup.linkSentDescription')}</p>
            <p className="mt-2 text-sm text-gray-500">{email}</p>
          </div>

          <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
            <p className="text-sm text-blue-800">{t('signup.checkSpam')}</p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleResendMagicLink}
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? tCommon('submitting') : t('signup.resendLink')}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMagicLinkSent(false)
                setName('')
                setEmail('')
              }}
              className="w-full flex justify-center py-2 px-4 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              {t('signup.tryDifferentEmail')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('signup.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">{t('signup.emailHint')}</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                名前
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('signup.namePlaceholder')}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="you@example.com"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <p className="text-sm text-gray-500">{t('signup.confirmHint')}</p>

          {errorMessage && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{errorMessage}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? tCommon('submitting') : t('signup.sendLink')}
            </button>
          </div>

          <div className="text-sm text-center">
            <Link to="/user/login" className="font-medium text-blue-600 hover:text-blue-500">
              {t('signup.existingAccountLink')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
