/**
 * タイムライン oRPC Procedures
 *
 * タイムライン機能の API エンドポイント
 * - ジャーナルエントリーの CRUD
 * - タイムライン（ジャーナル + 完了ログ）の取得
 */
import { ORPCError } from '@orpc/server'
import { JOURNAL_MAX_CONTENT_LENGTH, type TimelineEntry } from '@wishlist/shared/types/timeline'
import { z } from 'zod'
import { prisma } from '../../../db/client.js'
import { getDeviceId, type ORPCContext, requireDevice } from '../../../middleware/orpc-auth.js'
import * as journalRepo from '../../../repositories/journal.repository.js'
import { createLayerLogger, serializeError } from '../../../utils/logger.js'

const logger = createLayerLogger('procedure', 'timeline')

// 認証済み + 利用規約同意必須ベース
const authenticated = requireDevice.use(({ context, next }) => {
  const ctx = context as unknown as ORPCContext
  if (!ctx.device?.hasAgreedToTerms) {
    throw new ORPCError('FORBIDDEN', { message: 'Terms agreement required' })
  }
  return next({ context })
})

/**
 * ジャーナルエントリーを整形
 */
function formatJournalEntry(entry: NonNullable<Awaited<ReturnType<typeof journalRepo.findById>>>) {
  return {
    id: entry.id,
    title: entry.title,
    content: entry.content,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }
}

/**
 * タイムラインを取得（ジャーナル + 完了ログを統合）
 */
const getTimeline = authenticated
  .input(
    z
      .object({
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .optional(),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)
    const limit = input?.limit ?? 50

    try {
      // 1. ジャーナルエントリーを取得
      const journalEntries = await journalRepo.findByDeviceId(prisma, deviceId, {
        ...(input?.cursor && { cursor: input.cursor }),
        limit,
      })

      // 2. 完了済みアイテムを取得
      const completedItems = await prisma.wishlistItem.findMany({
        where: {
          deviceId,
          isCompleted: true,
          completedAt: { not: null },
        },
        orderBy: { completedAt: 'desc' },
        take: limit,
      })

      // 3. 完了済みステップを取得（関連アイテム情報も含む）
      const completedSteps = await prisma.step.findMany({
        where: {
          item: { deviceId },
          isCompleted: true,
          completedAt: { not: null },
        },
        include: {
          item: {
            select: { id: true, title: true },
          },
        },
        orderBy: { completedAt: 'desc' },
        take: limit,
      })

      // 4. タイムラインエントリーに変換
      const entries: TimelineEntry[] = []

      // ジャーナルエントリー
      for (const entry of journalEntries.slice(0, limit)) {
        entries.push({
          type: 'journal',
          id: `journal-${entry.id}`,
          timestamp: entry.createdAt.toISOString(),
          data: formatJournalEntry(entry),
        })
      }

      // アイテム完了ログ
      for (const item of completedItems) {
        if (item.completedAt) {
          entries.push({
            type: 'item_completed',
            id: `item-${item.id}`,
            timestamp: item.completedAt.toISOString(),
            data: {
              id: `item-completed-${item.id}`,
              itemId: item.id,
              title: item.title,
              completedAt: item.completedAt.toISOString(),
            },
          })
        }
      }

      // ステップ完了ログ
      for (const step of completedSteps) {
        if (step.completedAt) {
          entries.push({
            type: 'step_completed',
            id: `step-${step.id}`,
            timestamp: step.completedAt.toISOString(),
            data: {
              id: `step-completed-${step.id}`,
              stepId: step.id,
              itemId: step.item.id,
              title: step.title,
              itemTitle: step.item.title,
              completedAt: step.completedAt.toISOString(),
            },
          })
        }
      }

      // 5. 時系列でソート（新しい順）
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      // 6. limit + 1 で取得したので、次ページの有無を判定
      const hasMore = journalEntries.length > limit
      const limitedEntries = entries.slice(0, limit)
      const nextCursor =
        hasMore && limitedEntries.length > 0
          ? limitedEntries[limitedEntries.length - 1]?.id.replace(/^journal-/, '')
          : null

      return {
        success: true as const,
        data: {
          entries: limitedEntries,
          nextCursor,
          hasMore,
        },
      }
    } catch (error) {
      logger.error({ error: serializeError(error), deviceId }, 'Failed to get timeline')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to get timeline' })
    }
  })

/**
 * ジャーナルエントリーを作成
 */
const createJournalEntry = authenticated
  .input(
    z.object({
      title: z.string().max(200).optional(),
      content: z.string().min(1).max(JOURNAL_MAX_CONTENT_LENGTH),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      const entry = await journalRepo.create(prisma, {
        deviceId,
        title: input.title ?? null,
        content: input.content,
      })

      return {
        success: true as const,
        data: formatJournalEntry(entry),
      }
    } catch (error) {
      logger.error({ error: serializeError(error), deviceId }, 'Failed to create journal entry')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to create journal entry' })
    }
  })

/**
 * ジャーナルエントリーを更新
 */
const updateJournalEntry = authenticated
  .input(
    z.object({
      id: z.string().min(1),
      title: z.string().max(200).nullable().optional(),
      content: z.string().min(1).max(JOURNAL_MAX_CONTENT_LENGTH).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      // 所有権確認
      const existing = await journalRepo.findById(prisma, input.id)
      if (!existing || existing.deviceId !== deviceId) {
        throw new ORPCError('NOT_FOUND', { message: 'Journal entry not found' })
      }

      const entry = await journalRepo.update(prisma, input.id, {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.content !== undefined && { content: input.content }),
      })

      return {
        success: true as const,
        data: formatJournalEntry(entry),
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to update journal entry')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to update journal entry' })
    }
  })

/**
 * ジャーナルエントリーを削除
 */
const deleteJournalEntry = authenticated
  .input(
    z.object({
      id: z.string().min(1),
    }),
  )
  .handler(async ({ input, context }) => {
    const deviceId = getDeviceId(context)

    try {
      // 所有権確認
      const existing = await journalRepo.findById(prisma, input.id)
      if (!existing || existing.deviceId !== deviceId) {
        throw new ORPCError('NOT_FOUND', { message: 'Journal entry not found' })
      }

      await journalRepo.deleteById(prisma, input.id)

      return {
        success: true as const,
      }
    } catch (error) {
      if (error instanceof ORPCError) throw error
      logger.error({ error: serializeError(error), deviceId }, 'Failed to delete journal entry')
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Failed to delete journal entry' })
    }
  })

export const timelineRouter = {
  getTimeline,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
}
