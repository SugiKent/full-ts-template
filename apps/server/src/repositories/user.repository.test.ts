/**
 * UserRepository の単体テスト
 */

import type { PrismaClient } from '@prisma/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Prisma のモック
const mockFindMany = vi.fn()
const mockFindUnique = vi.fn()

const mockPrismaClient = {
  user: {
    findMany: mockFindMany,
    findUnique: mockFindUnique,
  },
} as unknown as PrismaClient

// テスト対象のインポート
const { findById } = await import('./user.repository.js')

describe('UserRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findById', () => {
    it('IDでユーザーを取得できる', async () => {
      const mockUser = {
        id: 'user1',
        name: '佐藤花子',
        email: 'sato@example.com',
        role: 'counselor',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockFindUnique.mockResolvedValueOnce(mockUser)

      const result = await findById(mockPrismaClient, 'user1')

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'user1' },
      })
      expect(result?.id).toBe('user1')
      expect(result?.name).toBe('佐藤花子')
    })

    it('存在しないIDの場合nullを返す', async () => {
      mockFindUnique.mockResolvedValueOnce(null)

      const result = await findById(mockPrismaClient, 'nonexistent')

      expect(result).toBeNull()
    })
  })
})
