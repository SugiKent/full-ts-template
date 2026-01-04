/**
 * ジョブキュー oRPC Procedures
 *
 * テストジョブの追加など、ジョブキュー関連の操作
 */

import { z } from 'zod'
import { type ORPCContext, requireRole } from '../../middleware/orpc-auth.js'
import { enqueueJob } from '../../services/job-queue.service.js'
import { TEST_JOB_QUEUE } from '../../workers/test-worker.js'

/**
 * テストジョブを追加 Procedure
 *
 * キューにテストジョブを追加し、ワーカーで処理されるか確認用
 */
export const addTestJob = requireRole(['admin'])
  .output(
    z.object({
      success: z.boolean(),
      jobId: z.string(),
      message: z.string(),
    }),
  )
  .handler(async ({ context }) => {
    const ctx = context as unknown as ORPCContext
    void ctx

    const job = await enqueueJob(TEST_JOB_QUEUE, {
      type: 'test-job',
      data: {
        timestamp: new Date().toISOString(),
        message: 'テストジョブが追加されました',
      },
    })

    return {
      success: true,
      jobId: job.id,
      message: `テストジョブがキューに追加されました (Job ID: ${job.id})`,
    }
  })

/**
 * ジョブ関連ルーター
 */
export const adminJobsRouter = {
  addTestJob,
}
