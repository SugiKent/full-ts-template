# docs

このディレクトリにはプロジェクトの技術ドキュメントを配置します。

## プロジェクト構成

このプロジェクトは**Turborepoによるmonorepo構成**を採用しています。

```
project/
├── apps/           # アプリケーション
│   ├── client/     # @repo/client - React フロントエンド
│   ├── server/     # @repo/server - Fastify バックエンド
│   └── worker/     # @repo/worker - ジョブワーカー
├── packages/       # 共有パッケージ
│   ├── shared/     # @repo/shared - 共有型・スキーマ
│   └── typescript-config/  # TypeScript設定
└── docs/           # 技術ドキュメント
```

## ドキュメント一覧

| ファイル | 内容 |
|---------|------|
| `ARCHITECTURE.md` | 全体アーキテクチャ・技術スタック・Turborepo構成 |
| `BACKEND.md` | バックエンド開発規約（Fastify, oRPC, Prisma） |
| `FRONTEND.md` | フロントエンド開発規約（React 19, Tailwind CSS） |
| `AUTH.md` | 認証アーキテクチャ（Better Auth） |
| `DATABASE.md` | データベース設計（Prismaスキーマ） |
| `TEST.md` | テスト戦略ガイド |
| `DEVELOPMENT.md` | 開発フローガイド |

## ドキュメント更新ルール

1. **実装と同期**: コード変更時は関連ドキュメントも更新
2. **変更履歴の記録**: 各ドキュメント末尾の変更履歴セクションを更新
3. **リンクの維持**: ドキュメント間の相互参照リンクを維持
