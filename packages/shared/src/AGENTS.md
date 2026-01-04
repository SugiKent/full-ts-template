# @repo/shared

Turborepoモノレポ内の共有パッケージです。サーバー・クライアント間で共有する型定義・スキーマ・設定を提供します。

## パッケージ情報

- **パッケージ名**: `@repo/shared`
- **タイプ**: ライブラリ（private）

## ディレクトリ構成

```
packages/shared/src/
├── config/         # 共通設定
│   └── i18n.ts     # i18n設定（対応言語、namespace）
├── schemas/        # Zodスキーマ定義
│   ├── admin.ts    # 管理者向けAPIスキーマ
│   └── user.ts     # エンドユーザー向けAPIスキーマ
└── types/          # TypeScript型定義
    ├── admin.ts    # 管理者向け型定義
    └── contact.ts  # コンタクト関連型定義
```

## 主なスクリプト

```bash
pnpm run typecheck    # 型チェック
pnpm run lint         # Biomeによるリント
pnpm run format       # Biomeによるフォーマット
```

## エクスポート

このパッケージは以下をエクスポートしています：
- `@repo/shared/config/*` - 設定ファイル群
- `@repo/shared/schemas/*` - Zodスキーマ群
- `@repo/shared/types/*` - 型定義群

## 設計方針

- **型安全性**: サーバー・クライアント間で型を共有し、不整合を防ぐ
- **Zodスキーマ**: oRPCのinput/output定義に使用
- **Interface優先**: 可能な限りinterfaceを使用（I/Tプレフィックス禁止）
- **i18n一元管理**: 対応言語とnamespaceの設定を一元管理

## 使用例

```typescript
// サーバー側
import { UserSchema } from '@repo/shared/schemas/user'

// クライアント側
import type { User } from '@repo/shared/types/user'

// 設定
import { SUPPORTED_LANGUAGES } from '@repo/shared/config/i18n'
```

## 依存パッケージ

- `zod` (peerDependency): スキーマバリデーション

## 参照ドキュメント

- [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md) - アーキテクチャ概要
