/**
 * テストワーカー
 *
 * bee-queue を使用したジョブ処理のボイラープレート
 * 開発環境での動作確認用
 */
import 'dotenv/config'
import { captureException } from '@repo/server/lib/sentry'
import {
  closeAllQueues,
  type JobPayload,
  registerProcessor,
  TEST_JOB_QUEUE,
} from '@repo/server/services/job-queue'
import { createLayerLogger, serializeError } from '@repo/server/utils/logger'
import type { Job } from 'bee-queue'

const logger = createLayerLogger('worker', 'test-worker')

/**
 * テストジョブを処理
 */
async function processTestJob(job: Job<JobPayload>): Promise<void> {
  const { type, data } = job.data

  logger.info({ jobId: job.id, type, data }, '=== テストジョブを受信しました ===')

  // シミュレーション: 2秒の処理
  await new Promise((resolve) => setTimeout(resolve, 2000))

  logger.info({ jobId: job.id, type, data }, '=== テストジョブが完了しました ===')
}

/**
 * グレースフルシャットダウン
 */
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down worker...')

  try {
    await closeAllQueues()
    logger.info('Worker shutdown complete')
    process.exit(0)
  } catch (error) {
    logger.error({ error: serializeError(error as Error) }, 'Error during shutdown')
    captureException(error as Error, { context: 'worker-shutdown' })
    process.exit(1)
  }
}

/**
 * ワーカーのメイン処理
 */
async function main(): Promise<void> {
  logger.info('Starting test worker...')

  // ジョブプロセッサーを登録
  registerProcessor(TEST_JOB_QUEUE, processTestJob)

  logger.info({ queue: TEST_JOB_QUEUE }, 'Test worker is ready and waiting for jobs')

  // グレースフルシャットダウンのハンドラーを設定
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main().catch((error) => {
  logger.error({ error: serializeError(error as Error) }, 'Failed to start worker')
  captureException(error as Error, { context: 'worker-startup' })
  process.exit(1)
})
