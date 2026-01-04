/**
 * bee-queue 型定義
 *
 * @see https://github.com/bee-queue/bee-queue
 */

declare module 'bee-queue' {
  import type { EventEmitter } from 'node:events'
  import type { Redis as IORedis, RedisOptions } from 'ioredis'

  export interface QueueSettings {
    /** Redis接続設定 */
    redis?: RedisOptions | IORedis
    /** プロデューサー（ジョブ作成）を有効化 */
    isWorker?: boolean
    /** ジョブを受け取る準備ができているかを報告 */
    getEvents?: boolean
    /** PubSubイベントを送信するか */
    sendEvents?: boolean
    /** ジョブが期限切れかチェックするか */
    storeJobs?: boolean
    /** ジョブ有効期限（秒） */
    ensureScripts?: boolean
    /** ジョブをアクティブ化する際にチェックする間隔（ミリ秒） */
    activateDelayedJobs?: boolean
    /** 削除対象ジョブをチェックする間隔（ミリ秒） */
    removeOnSuccess?: boolean
    /** 失敗時にジョブを削除するか */
    removeOnFailure?: boolean
    /** ストール検出間隔（ミリ秒） */
    stallInterval?: number
    /** ストール後、ジョブを失敗とみなすまでの時間（ミリ秒） */
    nearTermWindow?: number
    /** 遅延ジョブの有効化間隔（ミリ秒） */
    delayedDebounce?: number
    /** Redis キープレフィックス */
    prefix?: string
  }

  export interface JobSettings<T = unknown> {
    data: T
  }

  export interface Job<T = unknown> extends EventEmitter {
    id: string
    data: T
    options: {
      timeout?: number
      retries?: number
      backoff?: {
        strategy: 'immediate' | 'fixed' | 'exponential'
        delay?: number
      }
    }
    status: 'created' | 'succeeded' | 'failed' | 'retrying'
    progress: number

    /** ジョブをキューに保存 */
    save(): Promise<Job<T>>
    /** 保存済みジョブをキューに再保存 */
    save(cb: (err: Error | null, job: Job<T>) => void): void

    /** タイムアウトを設定（ミリ秒） */
    timeout(ms: number): Job<T>
    /** リトライ回数を設定 */
    retries(n: number): Job<T>
    /** リトライバックオフ戦略を設定 */
    backoff(strategy: 'immediate' | 'fixed' | 'exponential', delay?: number): Job<T>
    /** ジョブ遅延を設定 */
    delayUntil(date: Date | number): Job<T>
    /** 進捗を報告 */
    reportProgress(progress: number): Promise<void>

    /** 成功イベント */
    on(event: 'succeeded', listener: (result: unknown) => void): this
    /** 失敗イベント */
    on(event: 'failed', listener: (error: Error) => void): this
    /** リトライイベント */
    on(event: 'retrying', listener: (error: Error) => void): this
    /** 進捗イベント */
    on(event: 'progress', listener: (progress: number) => void): this
  }

  export type JobHandler<T = unknown, R = unknown> = (job: Job<T>) => R | Promise<R>

  export default class Queue<T = unknown> extends EventEmitter {
    name: string
    settings: QueueSettings

    constructor(name: string, settings?: QueueSettings)

    /** ジョブを作成 */
    createJob(data: T): Job<T>

    /** ジョブを処理 */
    process<R = unknown>(handler: JobHandler<T, R>): void
    process<R = unknown>(concurrency: number, handler: JobHandler<T, R>): void

    /** IDでジョブを取得 */
    getJob(id: string): Promise<Job<T> | null>

    /** キューを閉じる */
    close(timeout?: number): Promise<void>

    /** ヘルスチェック */
    checkHealth(): Promise<{
      waiting: number
      active: number
      succeeded: number
      failed: number
      delayed: number
      newestJob: string | null
    }>

    /** キューを破棄（全ジョブ削除） */
    destroy(): Promise<void>

    /** 準備完了イベント */
    on(event: 'ready', listener: () => void): this
    /** エラーイベント */
    on(event: 'error', listener: (error: Error) => void): this
    /** ジョブ成功イベント（PubSub） */
    on(event: 'succeeded', listener: (job: Job<T>, result: unknown) => void): this
    on(event: 'job succeeded', listener: (jobId: string, result: unknown) => void): this
    /** ジョブ失敗イベント（PubSub） */
    on(event: 'failed', listener: (job: Job<T>, error: Error) => void): this
    on(event: 'job failed', listener: (jobId: string, error: Error) => void): this
    /** ジョブ進捗イベント（PubSub） */
    on(event: 'job progress', listener: (jobId: string, progress: number) => void): this
    /** リトライイベント */
    on(event: 'retrying', listener: (job: Job<T>, error: Error) => void): this
    /** ストールイベント */
    on(event: 'stalled', listener: (jobId: string) => void): this
  }
}
