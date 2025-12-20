# shared/schemas

このディレクトリには、サーバーとクライアント間で共有する Zod スキーマを配置します。

## 構成

- `admin.ts` - 管理者向け API のスキーマ
- `user.ts` - 一般ユーザー向け API のスキーマ

## なぜ oRPC プロジェクトでもこのディレクトリが必要か

oRPC では `.input()` と `.output()` に Zod スキーマを渡すことで:
1. リクエスト/レスポンスのバリデーション
2. TypeScript の型推論

を自動的に行います。

このスキーマを `shared` ディレクトリに配置することで:
- サーバー側: oRPC プロシージャの入出力定義に使用
- クライアント側: API レスポンスの型として import 可能

## 使用例

```typescript
// サーバー側 (procedures/admin/users.ts)
import { ListUsersInputSchema, ListUsersOutputSchema } from '@shared/schemas/admin'

export const listUsers = requireRole(['admin'])
  .input(ListUsersInputSchema)
  .output(ListUsersOutputSchema)
  .handler(async ({ input }) => {
    // ...
  })

// クライアント側
import type { ListUsersOutput } from '@shared/schemas/admin'
```
