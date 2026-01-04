/**
 * お問い合わせRepository
 *
 * お問い合わせスレッドとメッセージのデータアクセス層
 */
import type { ContactMessage, ContactThread, PrismaClient } from '@prisma/client'
import type {
  ContactCategory,
  ContactStatus,
  ContactThreadInfo,
  PaginationParams,
  SenderType,
  ThreadListFilter,
} from '@shared/types/contact'
import { createLayerLogger, serializeError } from '../utils/logger.js'

const logger = createLayerLogger('repository', 'contact')

// ========================================
// スレッド関連入力型
// ========================================

/** スレッド作成入力 */
export interface CreateThreadInput {
  userId: string
  category: ContactCategory
  subject: string
  initialMessage: string
}

// ========================================
// メッセージ関連入力型
// ========================================

/** メッセージ作成入力 */
export interface CreateMessageInput {
  threadId: string
  senderType: SenderType
  senderId: string | null
  content: string
}

// ========================================
// スレッド関連操作
// ========================================

/**
 * スレッドを作成（初回メッセージ含む）
 */
export async function createThread(
  prisma: PrismaClient,
  input: CreateThreadInput,
): Promise<ContactThread & { messages: ContactMessage[] }> {
  try {
    const thread = await prisma.contactThread.create({
      data: {
        userId: input.userId,
        category: input.category,
        subject: input.subject,
        status: 'open',
        messages: {
          create: {
            senderType: 'user',
            senderId: input.userId,
            content: input.initialMessage,
            isRead: false,
          },
        },
      },
      include: {
        messages: true,
      },
    })

    logger.info({ threadId: thread.id, userId: input.userId }, 'Contact thread created')
    return thread
  } catch (error) {
    logger.error({ error: serializeError(error), input }, 'Failed to create contact thread')
    throw error
  }
}

/**
 * IDでスレッドを取得
 */
export async function findThreadById(
  prisma: PrismaClient,
  id: string,
): Promise<
  (ContactThread & { messages: ContactMessage[]; user: { name: string; email: string } }) | null
> {
  try {
    return await prisma.contactThread.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })
  } catch (error) {
    logger.error({ error: serializeError(error), id }, 'Failed to find contact thread by ID')
    throw error
  }
}

/**
 * ユーザーIDでスレッド一覧を取得
 */
export async function findThreadsByUserId(
  prisma: PrismaClient,
  userId: string,
  pagination: PaginationParams = { page: 1, limit: 20 },
): Promise<{ threads: ContactThreadInfo[]; total: number }> {
  const { page, limit } = pagination
  const skip = (page - 1) * limit

  try {
    const [threads, total] = await Promise.all([
      prisma.contactThread.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.contactThread.count({ where: { userId } }),
    ])

    const result: ContactThreadInfo[] = threads.map((thread) => ({
      id: thread.id,
      userId: thread.userId,
      category: thread.category as ContactCategory,
      subject: thread.subject,
      status: thread.status as ContactStatus,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      lastMessage: thread.messages[0]
        ? {
            id: thread.messages[0].id,
            threadId: thread.messages[0].threadId,
            senderType: thread.messages[0].senderType as SenderType,
            senderId: thread.messages[0].senderId,
            content: thread.messages[0].content,
            isRead: thread.messages[0].isRead,
            createdAt: thread.messages[0].createdAt,
          }
        : undefined,
    }))

    return { threads: result, total }
  } catch (error) {
    logger.error(
      { error: serializeError(error), userId, pagination },
      'Failed to find contact threads by user ID',
    )
    throw error
  }
}

/**
 * 全スレッド一覧を取得（管理者用）
 */
export async function findAllThreads(
  prisma: PrismaClient,
  filter: ThreadListFilter = {},
  pagination: PaginationParams = { page: 1, limit: 20 },
): Promise<{ threads: ContactThreadInfo[]; total: number }> {
  const { page, limit } = pagination
  const skip = (page - 1) * limit

  const where: {
    status?: string
    category?: string
  } = {}

  if (filter.status) {
    where.status = filter.status
  }
  if (filter.category) {
    where.category = filter.category
  }

  try {
    const [threads, total] = await Promise.all([
      prisma.contactThread.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              messages: {
                where: {
                  senderType: 'user',
                  isRead: false,
                },
              },
            },
          },
        },
      }),
      prisma.contactThread.count({ where }),
    ])

    const result: ContactThreadInfo[] = threads.map((thread) => ({
      id: thread.id,
      userId: thread.userId,
      category: thread.category as ContactCategory,
      subject: thread.subject,
      status: thread.status as ContactStatus,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      user: thread.user,
      unreadCount: thread._count.messages,
      lastMessage: thread.messages[0]
        ? {
            id: thread.messages[0].id,
            threadId: thread.messages[0].threadId,
            senderType: thread.messages[0].senderType as SenderType,
            senderId: thread.messages[0].senderId,
            content: thread.messages[0].content,
            isRead: thread.messages[0].isRead,
            createdAt: thread.messages[0].createdAt,
          }
        : undefined,
    }))

    return { threads: result, total }
  } catch (error) {
    logger.error(
      { error: serializeError(error), filter, pagination },
      'Failed to find all contact threads',
    )
    throw error
  }
}

/**
 * スレッドのステータスを更新
 */
export async function updateThreadStatus(
  prisma: PrismaClient,
  id: string,
  status: ContactStatus,
): Promise<ContactThread> {
  try {
    const thread = await prisma.contactThread.update({
      where: { id },
      data: { status },
    })

    logger.info({ threadId: id, status }, 'Contact thread status updated')
    return thread
  } catch (error) {
    logger.error(
      { error: serializeError(error), id, status },
      'Failed to update contact thread status',
    )
    throw error
  }
}

/**
 * ユーザーがスレッドを所有しているか確認
 */
export async function isThreadOwner(
  prisma: PrismaClient,
  threadId: string,
  userId: string,
): Promise<boolean> {
  try {
    const thread = await prisma.contactThread.findFirst({
      where: { id: threadId, userId },
      select: { id: true },
    })
    return thread !== null
  } catch (error) {
    logger.error(
      { error: serializeError(error), threadId, userId },
      'Failed to check thread ownership',
    )
    throw error
  }
}

// ========================================
// メッセージ関連操作
// ========================================

/**
 * メッセージを追加
 */
export async function addMessage(
  prisma: PrismaClient,
  input: CreateMessageInput,
): Promise<ContactMessage> {
  try {
    const [message] = await prisma.$transaction([
      prisma.contactMessage.create({
        data: {
          threadId: input.threadId,
          senderType: input.senderType,
          senderId: input.senderId,
          content: input.content,
          isRead: false,
        },
      }),
      prisma.contactThread.update({
        where: { id: input.threadId },
        data: { updatedAt: new Date() },
      }),
    ])

    logger.info({ messageId: message.id, threadId: input.threadId }, 'Contact message added')
    return message
  } catch (error) {
    logger.error({ error: serializeError(error), input }, 'Failed to add contact message')
    throw error
  }
}

/**
 * スレッドのユーザーメッセージを既読にする（管理者がスレッドを開いた時）
 */
export async function markUserMessagesAsRead(
  prisma: PrismaClient,
  threadId: string,
): Promise<number> {
  try {
    const result = await prisma.contactMessage.updateMany({
      where: {
        threadId,
        senderType: 'user',
        isRead: false,
      },
      data: { isRead: true },
    })

    logger.info({ threadId, count: result.count }, 'User messages marked as read')
    return result.count
  } catch (error) {
    logger.error({ error: serializeError(error), threadId }, 'Failed to mark messages as read')
    throw error
  }
}

/**
 * 未読メッセージ数を取得（管理者向け）
 */
export async function getUnreadCount(prisma: PrismaClient): Promise<number> {
  try {
    return await prisma.contactMessage.count({
      where: {
        senderType: 'user',
        isRead: false,
      },
    })
  } catch (error) {
    logger.error({ error: serializeError(error) }, 'Failed to get unread count')
    throw error
  }
}
