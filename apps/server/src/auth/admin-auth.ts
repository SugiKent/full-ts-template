/**
 * 管理画面用 Better Auth 設定
 * Email/パスワード認証 + マジックリンク認証を提供します
 */
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { magicLink } from 'better-auth/plugins'
import { prisma } from '../db/client'
import {
  sendMagicLinkEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../services/email.service'

export const adminAuth = betterAuth({
  // ベースパス設定（/api/auth がデフォルト）
  basePath: '/api/auth',

  // ベースURL設定（開発環境とCORS対応）
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:8080',

  // 信頼するOrigins（開発環境と本番環境）
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',').map((origin) => origin.trim())
    : process.env.NODE_ENV === 'production'
      ? [process.env.PRODUCTION_URL || 'https://yourdomain.com']
      : ['http://localhost:5173', 'http://localhost:8080'],

  // データベースアダプター（PostgreSQL + Prisma）
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  // Email/パスワード認証を有効化
  emailAndPassword: {
    enabled: true,
    // メール認証を有効化
    requireEmailVerification: true,
    // メール認証メール送信
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      await sendVerificationEmail(user.email, url)
    },
    // パスワードリセットメール送信
    sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
      await sendPasswordResetEmail(user.email, url)
    },
  },

  // プラグイン
  plugins: [
    // マジックリンク認証
    magicLink({
      // マジックリンクの有効期限（15分）
      expiresIn: 60 * 15,
      // マジックリンクメール送信
      sendMagicLink: async ({ email, url }: { email: string; url: string }) => {
        await sendMagicLinkEmail(email, url)
      },
    }),
  ],

  // セッション設定（管理画面用: 8時間有効）
  session: {
    expiresIn: 60 * 60 * 8, // 8時間（業務時間を想定）
    updateAge: 60 * 60 * 2, // 2時間ごとに更新
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5分
    },
  },

  // セキュリティ設定
  advanced: {
    // Cookieのデフォルト属性設定
    defaultCookieAttributes: {
      // sameSite設定: 開発環境では 'lax'、本番環境でも 'lax' を推奨
      // NOTE: sameSite='none' を使用する場合は secure=true が必須
      sameSite: 'lax' as 'lax' | 'strict' | 'none',
      // 本番環境またはngrok（HTTPS）使用時はSecure Cookieを使用
      secure: !!(
        process.env.NODE_ENV === 'production' || process.env.BETTER_AUTH_URL?.startsWith('https')
      ),
      // クライアント側JavaScriptからのアクセスを防止
      httpOnly: true,
    },
    crossSubDomainCookies: {
      enabled: false,
    },
  },

  // カスタムフィールド: ロール
  // admin: 管理者, user: 一般ユーザー
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'user', // デフォルトは一般ユーザー
        input: true, // 登録時にロールを指定可能
      },
    },
  },
})

export type AdminAuth = typeof adminAuth
