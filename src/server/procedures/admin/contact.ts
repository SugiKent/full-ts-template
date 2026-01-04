/**
 * お問い合わせ oRPC Procedures（管理者向け）
 *
 * 管理者がお問い合わせを管理・返信する機能
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
import * as contactNotification from '../../services/contact-notification.service.js'
import { createLayerLogger, serializeError } from '../../utils/logger.js'

const logger = createLayerLogger('procedure', 'admin-contact')

// 型定義（Prisma client未生成時の対応）
interface ContactMessageData {
  id: string
  senderType: string
  senderId: string | null
  content: string
  isRead: boolean
  createdAt: Date
}

// ========================================
// 入力スキーマ定義
// ========================================

const GetThreadsInput = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  status: z
    .enum([
      CONTACT_STATUS.OPEN,
      CONTACT_STATUS.IN_PROGRESS,
      CONTACT_STATUS.RESOLVED,
      CONTACT_STATUS.CLOSED,
    ])
    .optional(),
  category: z
    .enum([
      CONTACT_CATEGORIES.TECHNICAL,
      CONTACT_CATEGORIES.BILLING,
      CONTACT_CATEGORIES.FEATURE_REQUEST,
      CONTACT_CATEGORIES.OTHER,
    ])
    .optional(),
})

const GetThreadInput = z.object({
  threadId: z.string(),
})

const SendMessageInput = z.object({
  threadId: z.string(),
  content: z.string().min(1).max(10000),
})

const UpdateStatusInput = z.object({
  threadId: z.string(),
  status: z.enum([
    CONTACT_STATUS.OPEN,
    CONTACT_STATUS.IN_PROGRESS,
    CONTACT_STATUS.RESOLVED,
    CONTACT_STATUS.CLOSED,
  ]),
})

const MarkAsReadInput = z.object({
  threadId: z.string(),
})

// ========================================
// Procedures
// ========================================

/**
 * 全お問い合わせ一覧を取得
 */
const getThreads = os.input(GetThreadsInput).handler(async ({ input }) => {
  logger.info(
    { page: input.page, status: input.status, category: input.category },
    'Getting all contact threads',
  )

  try {
    // exactOptionalPropertyTypes対応: undefinedを渡さない
    const filter: { status?: ContactStatus; category?: ContactCategory } = {}
    if (input.status) {
      filter.status = input.status as ContactStatus
    }
    if (input.category) {
      filter.category = input.category as ContactCategory
    }

    const { threads, total } = await contactRepo.findAllThreads(prisma, filter, {
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
 * お問い合わせスレッド詳細を取得（既読化を含む）
 */
const getThread = os.input(GetThreadInput).handler(async ({ input }) => {
  logger.info({ threadId: input.threadId }, 'Getting contact thread for admin')

  try {
    const thread = await contactRepo.findThreadById(prisma, input.threadId)
    if (!thread) {
      return { success: false, error: 'Thread not found', thread: null }
    }

    // ユーザーからのメッセージを既読化
    await contactRepo.markUserMessagesAsRead(prisma, input.threadId)

    return {
      success: true,
      error: null,
      thread: {
        id: thread.id,
        userId: thread.userId,
        category: thread.category as ContactCategory,
        subject: thread.subject,
        status: thread.status as ContactStatus,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        user: thread.user,
        messages: thread.messages.map((msg: ContactMessageData) => ({
          id: msg.id,
          senderType: msg.senderType,
          senderId: msg.senderId,
          content: msg.content,
          isRead: msg.isRead,
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
 * 管理者が返信メッセージを送信
 */
const sendMessage = os.input(SendMessageInput).handler(async ({ input }) => {
  logger.info({ threadId: input.threadId }, 'Admin sending contact message')

  try {
    const thread = await contactRepo.findThreadById(prisma, input.threadId)
    if (!thread) {
      return { success: false, error: 'Thread not found' }
    }

    // メッセージ追加
    const message = await contactRepo.addMessage(prisma, {
      threadId: input.threadId,
      senderType: 'admin',
      senderId: null,
      content: input.content,
    })

    // ステータスがopenの場合、in_progressに更新
    if (thread.status === CONTACT_STATUS.OPEN) {
      await contactRepo.updateThreadStatus(prisma, input.threadId, CONTACT_STATUS.IN_PROGRESS)
    }

    // ユーザーに通知
    await contactNotification.notifyAdminReply({
      threadId: input.threadId,
      userEmail: thread.user.email,
      userName: thread.user.name,
      subject: thread.subject,
      replyContent: input.content,
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
    logger.error({ error: serializeError(error), input }, 'Failed to send admin message')
    throw error
  }
})

/**
 * スレッドのステータスを更新
 */
const updateStatus = os.input(UpdateStatusInput).handler(async ({ input }) => {
  logger.info({ threadId: input.threadId, status: input.status }, 'Updating contact thread status')

  try {
    const thread = await contactRepo.findThreadById(prisma, input.threadId)
    if (!thread) {
      return { success: false, error: 'Thread not found' }
    }

    // ステータス更新
    await contactRepo.updateThreadStatus(prisma, input.threadId, input.status as ContactStatus)

    // ユーザーに通知
    await contactNotification.notifyStatusChange({
      threadId: input.threadId,
      userEmail: thread.user.email,
      userName: thread.user.name,
      subject: thread.subject,
      newStatus: input.status as ContactStatus,
    })

    return { success: true, error: null }
  } catch (error) {
    logger.error({ error: serializeError(error), input }, 'Failed to update thread status')
    throw error
  }
})

/**
 * スレッドのメッセージを既読化
 */
const markAsRead = os.input(MarkAsReadInput).handler(async ({ input }) => {
  logger.info({ threadId: input.threadId }, 'Marking messages as read')

  try {
    const count = await contactRepo.markUserMessagesAsRead(prisma, input.threadId)
    return { success: true, markedCount: count }
  } catch (error) {
    logger.error({ error: serializeError(error), input }, 'Failed to mark messages as read')
    throw error
  }
})

/**
 * 未読メッセージ数を取得
 */
const getUnreadCount = os.handler(async () => {
  logger.info('Getting unread count')

  try {
    const count = await contactRepo.getUnreadCount(prisma)
    return { count }
  } catch (error) {
    logger.error({ error: serializeError(error) }, 'Failed to get unread count')
    throw error
  }
})

// ========================================
// Router
// ========================================

export const adminContactRouter = {
  getThreads,
  getThread,
  sendMessage,
  updateStatus,
  markAsRead,
  getUnreadCount,
}
