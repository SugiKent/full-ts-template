# repositories

このディレクトリにはPrismaを使用したデータアクセス層（Repository層）を配置します。

## 設計方針

- **関数ベース**: Classではなく関数をexportする
- **PrismaClient注入**: 各関数の第一引数にPrismaClientを受け取る
- **単一責任**: 1つのモデルに対して1つのRepositoryファイル

## ファイル命名規則

```
{model-name}.repository.ts       # 実装
{model-name}.repository.test.ts  # テスト
```

## 使用例

```typescript
// user.repository.ts
import type { PrismaClient } from '@prisma/client'

export async function findById(prisma: PrismaClient, id: string) {
  return prisma.user.findUnique({ where: { id } })
}

export async function findAll(prisma: PrismaClient, options: { page: number; limit: number }) {
  const { page, limit } = options
  return prisma.user.findMany({
    skip: (page - 1) * limit,
    take: limit,
  })
}

// Procedure から使用
import * as UserRepository from '../../repositories/user.repository.js'

export const getUser = requireRole(['admin'])
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const { prisma } = context
    return UserRepository.findById(prisma, input.id)
  })
```
