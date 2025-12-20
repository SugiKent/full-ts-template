/**
 * メール送信サービス
 *
 * 開発環境: Nodemailer + Mailpit (docker-compose)
 * 本番環境: TODO - SendGrid, AWS SES, Resend 等に置き換え
 */

import type { Transporter } from 'nodemailer'
import nodemailer from 'nodemailer'
import { createLogger } from '../utils/logger'

const logger = createLogger('email-service')

// メール設定
const emailConfig = {
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT) || 1025,
  secure: process.env.SMTP_SECURE === 'true',
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  from: {
    address: process.env.MAIL_FROM || 'noreply@example.com',
    name: process.env.MAIL_FROM_NAME || 'App',
  },
}

// Nodemailer トランスポーター
let transporter: Transporter | null = null

/**
 * トランスポーターを取得（遅延初期化）
 */
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    })

    logger.info(
      {
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
      },
      'Email transporter initialized',
    )
  }
  return transporter
}

/**
 * メール送信オプション
 */
interface SendEmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

/**
 * メールを送信
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, text, html } = options

  try {
    const transport = getTransporter()

    const result = await transport.sendMail({
      from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
      to,
      subject,
      text,
      html,
    })

    logger.info(
      {
        to,
        subject,
        messageId: result.messageId,
      },
      'Email sent successfully',
    )

    // 開発環境での確認用
    if (process.env.NODE_ENV !== 'production') {
      logger.info('📧 Mailpit で確認: http://localhost:8025')
    }
  } catch (error) {
    logger.error(
      {
        to,
        subject,
        error,
      },
      'Failed to send email',
    )
    throw error
  }
}

/**
 * メール認証用メールを送信
 */
export async function sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
  const subject = 'メールアドレスの確認'
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>メールアドレスの確認</h1>
        <p>アカウント登録ありがとうございます。</p>
        <p>以下のボタンをクリックして、メールアドレスを確認してください。</p>
        <p style="margin: 30px 0;">
          <a href="${verificationUrl}" class="button">メールアドレスを確認</a>
        </p>
        <p>ボタンが機能しない場合は、以下のURLをブラウザに貼り付けてください:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <div class="footer">
          <p>このメールに心当たりがない場合は、無視してください。</p>
        </div>
      </div>
    </body>
    </html>
  `
  const text = `
メールアドレスの確認

アカウント登録ありがとうございます。
以下のURLをクリックして、メールアドレスを確認してください。

${verificationUrl}

このメールに心当たりがない場合は、無視してください。
  `.trim()

  await sendEmail({ to, subject, text, html })
}

/**
 * マジックリンクログイン用メールを送信
 */
export async function sendMagicLinkEmail(to: string, magicLinkUrl: string): Promise<void> {
  const subject = 'ログインリンク'
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
        .warning { background-color: #FEF3C7; padding: 12px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>ログインリンク</h1>
        <p>以下のボタンをクリックしてログインしてください。</p>
        <p style="margin: 30px 0;">
          <a href="${magicLinkUrl}" class="button">ログインする</a>
        </p>
        <div class="warning">
          <strong>⚠️ セキュリティに関する注意</strong>
          <p style="margin: 5px 0 0 0;">このリンクは15分間のみ有効です。他の人と共有しないでください。</p>
        </div>
        <p>ボタンが機能しない場合は、以下のURLをブラウザに貼り付けてください:</p>
        <p style="word-break: break-all; color: #666;">${magicLinkUrl}</p>
        <div class="footer">
          <p>このメールに心当たりがない場合は、無視してください。</p>
        </div>
      </div>
    </body>
    </html>
  `
  const text = `
ログインリンク

以下のURLをクリックしてログインしてください。

${magicLinkUrl}

⚠️ セキュリティに関する注意:
このリンクは15分間のみ有効です。他の人と共有しないでください。

このメールに心当たりがない場合は、無視してください。
  `.trim()

  await sendEmail({ to, subject, text, html })
}

/**
 * パスワードリセット用メールを送信
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const subject = 'パスワードリセット'
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
        .warning { background-color: #FEF3C7; padding: 12px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>パスワードリセット</h1>
        <p>パスワードリセットのリクエストを受け付けました。</p>
        <p>以下のボタンをクリックして、新しいパスワードを設定してください。</p>
        <p style="margin: 30px 0;">
          <a href="${resetUrl}" class="button">パスワードをリセット</a>
        </p>
        <div class="warning">
          <strong>⚠️ セキュリティに関する注意</strong>
          <p style="margin: 5px 0 0 0;">このリンクは1時間のみ有効です。リクエストしていない場合は無視してください。</p>
        </div>
        <p>ボタンが機能しない場合は、以下のURLをブラウザに貼り付けてください:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <div class="footer">
          <p>このメールに心当たりがない場合は、無視してください。</p>
        </div>
      </div>
    </body>
    </html>
  `
  const text = `
パスワードリセット

パスワードリセットのリクエストを受け付けました。
以下のURLをクリックして、新しいパスワードを設定してください。

${resetUrl}

⚠️ セキュリティに関する注意:
このリンクは1時間のみ有効です。リクエストしていない場合は無視してください。

このメールに心当たりがない場合は、無視してください。
  `.trim()

  await sendEmail({ to, subject, text, html })
}
