# @repo/worker

Turborepoモノレポ内のジョブワーカーアプリケーションです。Bee-queueを使用したバックグラウンドジョブ処理を担当します。

## パッケージ情報

- **パッケージ名**: `@repo/worker`
- **タイプ**: アプリケーション（private）
- **ジョブキュー**: Bee-queue

## ディレクトリ構成

```
apps/worker/src/
├── workers/        # ワーカー定義
│   └── *.ts        # 各種ジョブワーカー
└── test-worker.ts  # テスト用ワーカー
```

## 主なスクリプト

```bash
pnpm run dev          # 開発モードでワーカー起動
pnpm run start        # 本番モードでワーカー起動
pnpm run typecheck    # 型チェック
pnpm run lint         # Biomeによるリント
pnpm run format       # Biomeによるフォーマット
```

## 設計方針

- **関数ベース**: Classは使用せず、関数とオブジェクトで実装
- **エラーハンドリング**: ジョブ失敗時の適切なリトライ・ロギング
- **べき等性**: 同じジョブが複数回実行されても安全

## 依存パッケージ

- `@repo/server`: サーバーサービス（ジョブキュー、ロガー等）
- `@repo/shared`: 共有型・スキーマ

## ワーカーの実装例

```typescript
import { createJobHandler } from '@repo/server/services/job-queue'
import { logger } from '@repo/server/utils/logger'

export const myWorker = createJobHandler('my-job', async (job) => {
  logger.info({ jobId: job.id }, 'Processing job')
  // ジョブ処理
})
```

## 参照ドキュメント

- [docs/BACKEND.md](../../../docs/BACKEND.md) - バックエンド開発規約
- [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md) - アーキテクチャ概要
