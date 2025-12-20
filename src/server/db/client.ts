/**
 * Prisma Client インスタンス
 * データベースへのアクセスを提供します
 */
import { type Prisma, PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger.js'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
      { emit: 'event', level: 'info' },
    ],
  })

// Prismaのログイベントをpinoロガーに統合
prisma.$on('query' as never, (e: Prisma.QueryEvent) => {
  logger.debug(
    {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
      target: e.target,
    },
    'Prisma Query',
  )
})

prisma.$on('error' as never, (e: Prisma.LogEvent) => {
  logger.error(
    {
      message: e.message,
      target: e.target,
    },
    'Prisma Error',
  )
})

prisma.$on('warn' as never, (e: Prisma.LogEvent) => {
  logger.warn(
    {
      message: e.message,
      target: e.target,
    },
    'Prisma Warning',
  )
})

prisma.$on('info' as never, (e: Prisma.LogEvent) => {
  logger.info(
    {
      message: e.message,
      target: e.target,
    },
    'Prisma Info',
  )
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export type ExtendedPrismaClient = typeof prisma
