# procedures

このディレクトリにはoRPC Procedure定義を配置します。

## ディレクトリ構成

```
procedures/
├── admin/          # 管理者向けAPI
│   ├── index.ts    # 管理者ルーター
│   └── dashboard.ts # ダッシュボード関連
└── user/           # エンドユーザー向けAPI
    └── index.ts    # ユーザールーター
```

## 設計方針

- **oRPCベース**: 型安全なRPC通信
- **Zodバリデーション**: input/outputにZodスキーマを使用
- **認証ミドルウェア**: `requireRole`等でロールベースアクセス制御

## 使用例

```typescript
import { os } from '@orpc/server'
import { z } from 'zod'

export const getUser = os
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const { prisma } = context
    return prisma.user.findUnique({ where: { id: input.id } })
  })
```

## 参照ドキュメント

- [docs/BACKEND.md](../../../docs/BACKEND.md) - oRPC統合パターン
