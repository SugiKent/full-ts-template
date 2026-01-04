/**
 * ジョブキューサービス
 *
 * bee-queueを使用した非同期ジョブ処理の基盤
 */
import Queue, { type Job } from 'bee-queue'
import { redisConfig } from '../config/redis.js'
import { captureException } from '../lib/sentry.js'
import { createLayerLogger, serializeError } from '../utils/logger.js'

const logger = createLayerLogger('service', 'job-queue')

/** 最大リトライ回数（初回含めて5回） */
const MAX_RETRIES = 4
/** リトライ初期遅延（ミリ秒） */
const RETRY_INITIAL_DELAY = 5000

// ========================================
// 汎用ジョブペイロード定義
// ========================================

/** 汎用ジョブペイロード */
export interface JobPayload {
  type: string
  data: Record<string, unknown>
}

// ========================================
// キュー名定義
// ========================================

/** テストジョブのキュー名 */
export const TEST_JOB_QUEUE = 'test-job-queue'

// ========================================
// キュー管理
// ========================================

/** キューのマップ */
const queues = new Map<string, Queue<JobPayload>>()

/**
 * ワーカー用キューを作成または取得
 */
export function getWorkerQueue(queueName: string): Queue<JobPayload> {
  const existing = queues.get(queueName)
  if (existing) return existing

  const queue = new Queue<JobPayload>(queueName, {
    redis: redisConfig,
    isWorker: true,
    removeOnSuccess: true,
    removeOnFailure: false,
  })

  queue.on('error', (err) => {
    logger.error({ error: serializeError(err), queueName }, 'Queue error')
    captureException(err, { queue: queueName, type: 'queue-error' })
  })

  queue.on('failed', (job, err) => {
    logger.error(
      { error: serializeError(err), jobId: job.id, jobType: job.data?.type },
      'Job failed after all retries',
    )
    captureException(err, {
      queue: queueName,
      type: 'job-failed',
      queueJobId: job.id,
      jobType: job.data?.type,
    })
  })

  queue.on('ready', () => {
    logger.info({ queueName }, 'Queue ready')
  })

  queues.set(queueName, queue)
  return queue
}

/**
 * プロデューサー用キューを作成または取得
 */
export function getProducerQueue(queueName: string): Queue<JobPayload> {
  const key = `${queueName}:producer`
  const existing = queues.get(key)
  if (existing) return existing

  const queue = new Queue<JobPayload>(queueName, {
    redis: redisConfig,
    isWorker: false,
  })

  queue.on('error', (err) => {
    logger.error({ error: serializeError(err), queueName }, 'Producer queue error')
    captureException(err, { queue: queueName, type: 'producer-queue-error' })
  })

  queues.set(key, queue)
  return queue
}

// ========================================
// ジョブ操作
// ========================================

/**
 * ジョブをキューに追加
 */
export async function enqueueJob(
  queueName: string,
  payload: JobPayload,
  options?: {
    retries?: number
    delayMs?: number
  },
): Promise<Job<JobPayload>> {
  const queue = getProducerQueue(queueName)

  let job = queue.createJob(payload)

  if (options?.retries !== undefined) {
    job = job.retries(options.retries)
  } else {
    job = job.retries(MAX_RETRIES)
  }

  job = job.backoff('exponential', RETRY_INITIAL_DELAY)

  if (options?.delayMs) {
    job = job.delayUntil(Date.now() + options.delayMs)
  }

  const savedJob = await job.save()

  logger.info({ queueName, jobId: savedJob.id, jobType: payload.type }, 'Job enqueued')

  return savedJob
}

/**
 * ジョブプロセッサーを登録
 */
export function registerProcessor<T = unknown>(
  queueName: string,
  handler: (job: Job<JobPayload>) => Promise<T>,
  concurrency = 1,
): void {
  const queue = getWorkerQueue(queueName)
  queue.process(concurrency, handler)
  logger.info({ queueName, concurrency }, 'Job processor registered')
}

// ========================================
// クリーンアップ
// ========================================

/**
 * 全キューを閉じる
 */
export async function closeAllQueues(): Promise<void> {
  const closePromises = Array.from(queues.values()).map((queue) => queue.close())
  await Promise.all(closePromises)
  queues.clear()
  logger.info('All queues closed')
}
