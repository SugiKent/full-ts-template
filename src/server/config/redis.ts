/**
 * Redis接続設定
 *
 * bee-queue用のRedis設定を提供
 */

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
