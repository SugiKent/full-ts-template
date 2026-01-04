/**
 * お問い合わせ oRPC Procedures（ユーザー向け）
 *
 * ユーザーがお問い合わせを作成・閲覧・メッセージ送信する機能
 */
import { os } from '@orpc/server'
import { z } from 'zod'
import {
  CONTACT_CATEGORIES,
  CONTACT_STATUS,
  type ContactCategory,
  type ContactStatus,
} from '../../../shared/types/contact.js'
import { prisma } from '../../db/client.js'
import * as contactRepo from '../../repositories/contact.repository.js'
import * as userRepo from '../../repositories/user.repository.js'
import * as contactNotification from '../../services/contact-notification.service.js'
import { createLayerLogger, serializeError } from '../../utils/logger.js'

const logger = createLayerLogger('procedure', 'user-contact')

// ========================================
// 入力スキーマ定義
// ========================================

const CreateThreadInput = z.object({
  userId: z.string(),
  category: z.enum([
    CONTACT_CATEGORIES.TECHNICAL,
    CONTACT_CATEGORIES.BILLING,
    CONTACT_CATEGORIES.FEATURE_REQUEST,
    CONTACT_CATEGORIES.OTHER,
  ]),
  subject: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
})

const GetThreadsInput = z.object({
  userId: z.string(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
})

const GetThreadInput = z.object({
  userId: z.string(),
  threadId: z.string(),
})

const SendMessageInput = z.object({
  userId: z.string(),
  threadId: z.string(),
  content: z.string().min(1).max(10000),
})

// ========================================
// Procedures
// ========================================

/**
 * お問い合わせスレッドを作成
 */
const createThread = os.input(CreateThreadInput).handler(async ({ input }) => {
  logger.info({ userId: input.userId, category: input.category }, 'Creating contact thread')

  try {
    // ユーザー情報を取得
    const user = await userRepo.findNameEmailById(prisma, input.userId)

    if (!user) {
      return { success: false, error: 'User not found', thread: null }
    }

    // スレッド作成
    const thread = await contactRepo.createThread(prisma, {
      userId: input.userId,
      category: input.category as ContactCategory,
      subject: input.subject,
      initialMessage: input.content,
    })

    // 管理者に通知
    await contactNotification.notifyNewContact({
      threadId: thread.id,
      userName: user.name,
      userEmail: user.email,
      category: input.category as ContactCategory,
      subject: input.subject,
      content: input.content,
    })

    return {
      success: true,
      error: null,
      thread: {
        id: thread.id,
        category: thread.category as ContactCategory,
        subject: thread.subject,
        status: thread.status as ContactStatus,
        createdAt: thread.createdAt,
      },
    }
  } catch (error) {
    logger.error({ error: serializeError(error), input }, 'Failed to create contact thread')
    throw error
  }
})

/**
 * ユーザーのお問い合わせ一覧を取得
 */
const getThreads = os.input(GetThreadsInput).handler(async ({ input }) => {
  logger.info({ userId: input.userId, page: input.page }, 'Getting user contact threads')

  try {
    const { threads, total } = await contactRepo.findThreadsByUserId(prisma, input.userId, {
      page: input.page,
      limit: input.limit,
    })

    return {
      threads,
      total,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(total / input.limit),
    }
  } catch (error) {
    logger.error({ error: serializeError(error), input }, 'Failed to get contact threads')
    throw error
  }
})

/**
 * お問い合わせスレッド詳細を取得
 */
const getThread = os.input(GetThreadInput).handler(async ({ input }) => {
  logger.info({ userId: input.userId, threadId: input.threadId }, 'Getting contact thread')

  try {
    // 所有権確認
    const isOwner = await contactRepo.isThreadOwner(prisma, input.threadId, input.userId)
    if (!isOwner) {
      return { success: false, error: 'Thread not found', thread: null }
    }

    const thread = await contactRepo.findThreadById(prisma, input.threadId)
    if (!thread) {
      return { success: false, error: 'Thread not found', thread: null }
    }

    return {
      success: true,
      error: null,
      thread: {
        id: thread.id,
        category: thread.category as ContactCategory,
        subject: thread.subject,
        status: thread.status as ContactStatus,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        messages: thread.messages.map((msg) => ({
          id: msg.id,
          senderType: msg.senderType,
          content: msg.content,
          createdAt: msg.createdAt,
        })),
      },
    }
  } catch (error) {
    logger.error({ error: serializeError(error), input }, 'Failed to get contact thread')
    throw error
  }
})

/**
 * メッセージを送信
 */
const sendMessage = os.input(SendMessageInput).handler(async ({ input }) => {
  logger.info({ userId: input.userId, threadId: input.threadId }, 'Sending contact message')

  try {
    // 所有権確認
    const isOwner = await contactRepo.isThreadOwner(prisma, input.threadId, input.userId)
    if (!isOwner) {
      return { success: false, error: 'Thread not found' }
    }

    // スレッド情報を取得
    const thread = await contactRepo.findThreadById(prisma, input.threadId)
    if (!thread) {
      return { success: false, error: 'Thread not found' }
    }

    // 解決済み・クローズ済みスレッドへのメッセージ送信をブロック
    if (thread.status === CONTACT_STATUS.RESOLVED || thread.status === CONTACT_STATUS.CLOSED) {
      return {
        success: false,
        error:
          'このお問い合わせは解決済みまたはクローズされています。新しいお問い合わせを作成してください。',
      }
    }

    // メッセージ追加
    const message = await contactRepo.addMessage(prisma, {
      threadId: input.threadId,
      senderType: 'user',
      senderId: input.userId,
      content: input.content,
    })

    // 管理者に通知
    await contactNotification.notifyUserMessage({
      threadId: input.threadId,
      userName: thread.user.name,
      userEmail: thread.user.email,
      subject: thread.subject,
      messageContent: input.content,
    })

    return {
      success: true,
      error: null,
      message: {
        id: message.id,
        senderType: message.senderType,
        content: message.content,
        createdAt: message.createdAt,
      },
    }
  } catch (error) {
    logger.error({ error: serializeError(error), input }, 'Failed to send contact message')
    throw error
  }
})

// ========================================
// Router
// ========================================

export const contactRouter = {
  createThread,
  getThreads,
  getThread,
  sendMessage,
}
