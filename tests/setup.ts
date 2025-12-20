import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeAll } from 'vitest'

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test_user:test_pass@localhost:5432/test_db'
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/1'

// Add project-specific environment variable mocks below
// Example:
// process.env.SOME_API_KEY = process.env.SOME_API_KEY || 'test_api_key'

let prisma: PrismaClient | null = null

// Database setup only if explicitly enabled (for integration tests that need it)
beforeAll(async () => {
  // Skip database connection for unit tests
  // Integration tests that need DB should handle connection themselves
  if (process.env.ENABLE_TEST_DB === 'true') {
    const { PrismaClient: Client } = await import('@prisma/client')
    prisma = new Client()
    await prisma.$connect()
  }
})

afterAll(async () => {
  // Cleanup database connection if it was initialized
  if (prisma) {
    await prisma.$disconnect()
  }
})
