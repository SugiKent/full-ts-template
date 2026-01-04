/**
 * お問い合わせ通知サービス
 *
 * お問い合わせに関するメール通知を送信する
 */
import type { ContactCategory, ContactStatus } from '@shared/types/contact'
import { CONTACT_CATEGORY_LABELS, CONTACT_STATUS_LABELS } from '@shared/types/contact'
import { createLayerLogger, serializeError } from '../utils/logger.js'
import { sendEmail } from './email.service.js'

const logger = createLayerLogger('service', 'contact-notification')

// 管理者メールアドレス（環境変数から取得）
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'

// アプリケーションURL
const APP_URL = process.env.APP_URL || 'http://localhost:3000'

/**
 * 新規お問い合わせ通知（管理者向け）
 */
export async function notifyNewContact(params: {
  threadId: string
  userName: string
  userEmail: string
  category: ContactCategory
  subject: string
  content: string
}): Promise<void> {
  const { threadId, userName, userEmail, category, subject, content } = params
  const categoryLabel = CONTACT_CATEGORY_LABELS[category]
  const adminUrl = `${APP_URL}/admin/contacts/${threadId}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 6px 6px 0 0; }
        .content { background-color: #F9FAFB; padding: 20px; border: 1px solid #E5E7EB; }
        .message-box { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #E5E7EB; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; }
        .meta { color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">新規お問い合わせ</h1>
        </div>
        <div class="content">
          <p class="meta">
            <strong>ユーザー:</strong> ${userName} (${userEmail})<br>
            <strong>カテゴリ:</strong> ${categoryLabel}<br>
            <strong>件名:</strong> ${subject}
          </p>
          <div class="message-box">
            <p style="white-space: pre-wrap; margin: 0;">${content}</p>
          </div>
          <p style="margin-top: 30px;">
            <a href="${adminUrl}" class="button">管理画面で確認する</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
新規お問い合わせ

ユーザー: ${userName} (${userEmail})
カテゴリ: ${categoryLabel}
件名: ${subject}

---
${content}
---

管理画面で確認: ${adminUrl}
  `.trim()

  try {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `【お問い合わせ】${subject} - ${userName}`,
      html,
      text,
    })
    logger.info({ threadId, userEmail }, 'New contact notification sent to admin')
  } catch (error) {
    logger.error(
      { error: serializeError(error), threadId },
      'Failed to send new contact notification',
    )
    // 通知失敗はエラーを投げずにログに記録
  }
}

/**
 * 管理者返信通知（ユーザー向け）
 */
export async function notifyAdminReply(params: {
  threadId: string
  userEmail: string
  userName: string
  subject: string
  replyContent: string
}): Promise<void> {
  const { threadId, userEmail, userName, subject, replyContent } = params
  const userUrl = `${APP_URL}/user/contact/${threadId}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 20px; border-radius: 6px 6px 0 0; }
        .content { background-color: #F9FAFB; padding: 20px; border: 1px solid #E5E7EB; }
        .message-box { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #E5E7EB; }
        .button { display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">お問い合わせへの返信</h1>
        </div>
        <div class="content">
          <p>${userName}様</p>
          <p>お問い合わせ「${subject}」に運営から返信がありました。</p>
          <div class="message-box">
            <p style="white-space: pre-wrap; margin: 0;">${replyContent}</p>
          </div>
          <p style="margin-top: 30px;">
            <a href="${userUrl}" class="button">お問い合わせを確認する</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
お問い合わせへの返信

${userName}様

お問い合わせ「${subject}」に運営から返信がありました。

---
${replyContent}
---

お問い合わせを確認: ${userUrl}
  `.trim()

  try {
    await sendEmail({
      to: userEmail,
      subject: `【返信】${subject}`,
      html,
      text,
    })
    logger.info({ threadId, userEmail }, 'Admin reply notification sent to user')
  } catch (error) {
    logger.error(
      { error: serializeError(error), threadId },
      'Failed to send admin reply notification',
    )
  }
}

/**
 * ユーザー追加メッセージ通知（管理者向け）
 */
export async function notifyUserMessage(params: {
  threadId: string
  userName: string
  userEmail: string
  subject: string
  messageContent: string
}): Promise<void> {
  const { threadId, userName, userEmail, subject, messageContent } = params
  const adminUrl = `${APP_URL}/admin/contacts/${threadId}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #F59E0B; color: white; padding: 20px; border-radius: 6px 6px 0 0; }
        .content { background-color: #F9FAFB; padding: 20px; border: 1px solid #E5E7EB; }
        .message-box { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #E5E7EB; }
        .button { display: inline-block; padding: 12px 24px; background-color: #F59E0B; color: white; text-decoration: none; border-radius: 6px; }
        .meta { color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">追加メッセージ</h1>
        </div>
        <div class="content">
          <p class="meta">
            <strong>ユーザー:</strong> ${userName} (${userEmail})<br>
            <strong>件名:</strong> ${subject}
          </p>
          <div class="message-box">
            <p style="white-space: pre-wrap; margin: 0;">${messageContent}</p>
          </div>
          <p style="margin-top: 30px;">
            <a href="${adminUrl}" class="button">管理画面で確認する</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
追加メッセージ

ユーザー: ${userName} (${userEmail})
件名: ${subject}

---
${messageContent}
---

管理画面で確認: ${adminUrl}
  `.trim()

  try {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `【追加メッセージ】${subject} - ${userName}`,
      html,
      text,
    })
    logger.info({ threadId, userEmail }, 'User message notification sent to admin')
  } catch (error) {
    logger.error(
      { error: serializeError(error), threadId },
      'Failed to send user message notification',
    )
  }
}

/**
 * ステータス変更通知（ユーザー向け）
 */
export async function notifyStatusChange(params: {
  threadId: string
  userEmail: string
  userName: string
  subject: string
  newStatus: ContactStatus
}): Promise<void> {
  const { threadId, userEmail, userName, subject, newStatus } = params
  const statusLabel = CONTACT_STATUS_LABELS[newStatus]
  const userUrl = `${APP_URL}/user/contact/${threadId}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #6366F1; color: white; padding: 20px; border-radius: 6px 6px 0 0; }
        .content { background-color: #F9FAFB; padding: 20px; border: 1px solid #E5E7EB; }
        .status-badge { display: inline-block; padding: 6px 12px; background-color: #E0E7FF; color: #4338CA; border-radius: 9999px; font-weight: bold; }
        .button { display: inline-block; padding: 12px 24px; background-color: #6366F1; color: white; text-decoration: none; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">お問い合わせステータス更新</h1>
        </div>
        <div class="content">
          <p>${userName}様</p>
          <p>お問い合わせ「${subject}」のステータスが更新されました。</p>
          <p style="margin: 20px 0;">
            <span class="status-badge">${statusLabel}</span>
          </p>
          <p style="margin-top: 30px;">
            <a href="${userUrl}" class="button">お問い合わせを確認する</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
お問い合わせステータス更新

${userName}様

お問い合わせ「${subject}」のステータスが「${statusLabel}」に更新されました。

お問い合わせを確認: ${userUrl}
  `.trim()

  try {
    await sendEmail({
      to: userEmail,
      subject: `【ステータス更新】${subject} - ${statusLabel}`,
      html,
      text,
    })
    logger.info({ threadId, userEmail, newStatus }, 'Status change notification sent to user')
  } catch (error) {
    logger.error(
      { error: serializeError(error), threadId },
      'Failed to send status change notification',
    )
  }
}
