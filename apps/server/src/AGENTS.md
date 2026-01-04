# @repo/server

Turborepoモノレポ内のFastify + oRPCベースのバックエンドアプリケーションです。

## パッケージ情報

- **パッケージ名**: `@repo/server`
- **タイプ**: アプリケーション（private）
- **フレームワーク**: Fastify 5.x + oRPC

## ディレクトリ構成

```
apps/server/src/
├── auth/           # Better Auth設定
├── config/         # 設定ファイル
├── db/             # PrismaClient初期化
├── lib/            # ライブラリ（Sentry等）
├── middleware/     # カスタムミドルウェア
├── plugins/        # Fastifyプラグイン
├── procedures/     # oRPC Procedure定義
│   ├── admin/      # 管理者向けProcedure
│   └── user/       # ユーザー向けProcedure
├── repositories/   # データアクセス層（Prisma使用）
├── routes/         # Fastifyルート定義
├── services/       # ビジネスロジック層
├── types/          # TypeScript型定義
├── utils/          # ユーティリティ関数
└── index.ts        # エントリポイント
```

## 主なスクリプト

```bash
pnpm run dev          # 開発サーバー起動
pnpm run build        # 本番ビルド
pnpm run start        # 本番サーバー起動
pnpm run typecheck    # 型チェック
pnpm run lint         # Biomeによるリント
pnpm run format       # Biomeによるフォーマット
```

## Prismaマイグレーション

```bash
# マイグレーション作成・実行
pnpm run db:migrate

# Prismaクライアント生成
pnpm run db:generate
```

## エクスポート

このパッケージは以下をエクスポートしています：
- `@repo/server/procedures/admin` - 管理者向けProcedure
- `@repo/server/procedures/user` - ユーザー向けProcedure
- `@repo/server/lib/sentry` - Sentry設定
- `@repo/server/services/job-queue` - ジョブキューサービス
- `@repo/server/utils/logger` - Pinoロガー

## 設計方針

- **関数ベース**: Classは使用せず、関数とオブジェクトで実装
- **レイヤード構造**: Route → Procedure → Service → Repository
- **Prisma使用制限**: Repository層でのみPrismaを使用

## 依存パッケージ

- `@repo/shared`: 共有型・スキーマ
- `@repo/typescript-config`: TypeScript設定

## 参照ドキュメント

- [docs/BACKEND.md](../../../docs/BACKEND.md) - バックエンド開発規約
- [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md) - アーキテクチャ概要
