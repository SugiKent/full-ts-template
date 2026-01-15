/**
 * Worker エントリーポイント
 *
 * すべてのジョブワーカーを統合して起動
 */
import 'dotenv/config'
import { prisma } from '@wishlist/server/db/client'
import { captureException } from '@wishlist/server/lib/sentry'
import {
  closeAllQueues,
  type JobPayload,
  registerProcessor,
  STEP_SUGGESTION_QUEUE,
  TEST_JOB_QUEUE,
} from '@wishlist/server/services/job-queue'
import {
  ensureSuggestions,
  generateSuggestionsForItem,
} from '@wishlist/server/services/step-suggestion'
import { createLayerLogger, serializeError } from '@wishlist/server/utils/logger'
import type { Job } from 'bee-queue'

const logger = createLayerLogger('worker', 'main')

// ========================================
// テストジョブプロセッサー（開発用）
// ========================================

async function processTestJob(job: Job<JobPayload>): Promise<void> {
  const testLogger = createLayerLogger('worker', 'test-job')
  const { type, data } = job.data

  testLogger.info({ jobId: job.id, type, data }, '=== テストジョブを受信しました ===')

  // シミュレーション: 2秒の処理
  await new Promise((resolve) => setTimeout(resolve, 2000))

  testLogger.info({ jobId: job.id, type, data }, '=== テストジョブが完了しました ===')
}

// ========================================
// ステップ候補生成プロセッサー
// ========================================

type StepSuggestionJobType = 'generate' | 'regenerate' | 'replenish' | 'update'

interface StepSuggestionJobData {
  itemId: string
  deleteExisting?: boolean
}

async function processStepSuggestionJob(job: Job<JobPayload>): Promise<void> {
  const suggestionLogger = createLayerLogger('worker', 'step-suggestion')
  const { type, data } = job.data
  const jobType = type as StepSuggestionJobType
  const jobData = data as unknown as StepSuggestionJobData

  suggestionLogger.info(
    { jobId: job.id, type: jobType, itemId: jobData.itemId },
    'Processing step suggestion job',
  )

  try {
    switch (jobType) {
      case 'generate':
        await generateSuggestionsForItem(prisma, jobData.itemId, false)
        break

      case 'regenerate':
        await generateSuggestionsForItem(prisma, jobData.itemId, jobData.deleteExisting ?? true)
        break

      case 'replenish':
        await ensureSuggestions(prisma, jobData.itemId)
        break

      case 'update':
        await generateSuggestionsForItem(prisma, jobData.itemId, true)
        break

      default:
        suggestionLogger.warn({ jobId: job.id, type }, 'Unknown job type, skipping')
    }

    suggestionLogger.info(
      { jobId: job.id, type: jobType, itemId: jobData.itemId },
      'Step suggestion job completed',
    )
  } catch (error) {
    suggestionLogger.error(
      {
        error: serializeError(error as Error),
        jobId: job.id,
        type: jobType,
        itemId: jobData.itemId,
      },
      'Step suggestion job failed',
    )
    throw error
  }
}

// ========================================
// グレースフルシャットダウン
// ========================================

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down workers...')

  try {
    await closeAllQueues()
    await prisma.$disconnect()
    logger.info('All workers shutdown complete')
    process.exit(0)
  } catch (error) {
    logger.error({ error: serializeError(error as Error) }, 'Error during shutdown')
    captureException(error as Error, { context: 'worker-shutdown' })
    process.exit(1)
  }
}

// ========================================
// メイン処理
// ========================================

async function main(): Promise<void> {
  logger.info('Starting all workers...')

  // Prisma の接続を確認
  await prisma.$connect()
  logger.info('Database connected')

  // テストジョブプロセッサーを登録（開発用）
  if (process.env.NODE_ENV !== 'production') {
    registerProcessor(TEST_JOB_QUEUE, processTestJob)
    logger.info({ queue: TEST_JOB_QUEUE }, 'Test job processor registered')
  }

  // ステップ候補生成プロセッサーを登録（同時実行数: 2）
  registerProcessor(STEP_SUGGESTION_QUEUE, processStepSuggestionJob, 2)
  logger.info({ queue: STEP_SUGGESTION_QUEUE }, 'Step suggestion processor registered')

  logger.info('All workers are ready and waiting for jobs')

  // グレースフルシャットダウンのハンドラーを設定
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main().catch((error) => {
  logger.error({ error: serializeError(error as Error) }, 'Failed to start workers')
  captureException(error as Error, { context: 'worker-startup' })
  process.exit(1)
})
