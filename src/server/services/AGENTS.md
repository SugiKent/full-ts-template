# services

このディレクトリにはビジネスロジックを含むサービス層を配置します。

## 設計方針

- **関数ベース**: Classではなく関数をexportする
- **Repository依存**: データアクセスはRepository層を通じて行う
- **単一責任**: 1つのドメインに対して1つのServiceファイル

## ファイル命名規則

```
{domain}.service.ts       # 実装
{domain}.service.test.ts  # テスト
```

## 使用例

```typescript
// notification.service.ts
import type { PrismaClient } from '@prisma/client'
import * as UserRepository from '../repositories/user.repository.js'

export async function sendNotification(
  prisma: PrismaClient,
  userId: string,
  message: string,
) {
  const user = await UserRepository.findById(prisma, userId)
  if (!user) {
    throw new Error('User not found')
  }

  // 通知送信ロジック
  // ...

  return { success: true }
}
```

## Repository層との違い

- **Repository**: データの永続化・取得のみを担当（CRUD操作）
- **Service**: ビジネスロジック、複数Repositoryの組み合わせ、外部API連携など
