/**
 * Redis接続設定
 *
 * bee-queue用のRedis設定とioredisクライアントを提供
 */
import Redis from 'ioredis'

/** Redis接続設定 */
export interface RedisConfig {
  host: string
  port: number
  password?: string | undefined
  db?: number
}

/**
 * 環境変数からRedis設定を取得
 */
export function getRedisConfig(): RedisConfig {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

  try {
    const url = new URL(redisUrl)
    return {
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
      db: url.pathname ? parseInt(url.pathname.slice(1), 10) || 0 : 0,
    }
  } catch {
    // URLパース失敗時のフォールバック
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    }
  }
}

/** デフォルトのRedis設定 */
export const redisConfig = getRedisConfig()

// ========================================
// Redis クライアント（ioredis）
// ========================================

/** シングルトン Redis クライアント */
let redisClient: Redis | null = null

/**
 * Redis クライアントを取得（シングルトン）
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      ...(redisConfig.password && { password: redisConfig.password }),
      ...(redisConfig.db !== undefined && { db: redisConfig.db }),
      lazyConnect: true,
    })
  }
  return redisClient
}

/**
 * Redis クライアントを閉じる
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
}
