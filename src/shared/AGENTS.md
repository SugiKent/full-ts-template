# shared

このディレクトリにはサーバーとクライアント間で共有する型定義・スキーマを配置します。

## ディレクトリ構成

```
shared/
├── schemas/        # Zodスキーマ定義
│   ├── admin.ts    # 管理者向けAPIスキーマ
│   └── user.ts     # エンドユーザー向けAPIスキーマ
└── types/          # TypeScript型定義
    └── admin.ts    # 共通型定義
```

## 設計方針

- **型安全性**: サーバー・クライアント間で型を共有し、不整合を防ぐ
- **Zodスキーマ**: oRPCのinput/output定義に使用
- **Interface優先**: 可能な限りinterfaceを使用（I/Tプレフィックス禁止）

## 使用例

```typescript
// サーバー側
import { UserSchema } from '@shared/schemas/user'

// クライアント側
import type { User } from '@shared/types/user'
```
