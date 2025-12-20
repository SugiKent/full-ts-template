# server

このディレクトリにはFastify + oRPCベースのバックエンドを配置します。

## ディレクトリ構成

```
server/
├── auth/           # Better Auth設定
├── db/             # PrismaClient初期化
├── handlers/       # リクエストハンドラー
├── middleware/     # カスタムミドルウェア
├── plugins/        # Fastifyプラグイン
├── procedures/     # oRPC Procedure定義
├── repositories/   # データアクセス層（Prisma使用）
├── routes/         # Fastifyルート定義
├── services/       # ビジネスロジック層
├── types/          # TypeScript型定義
├── utils/          # ユーティリティ関数
└── index.ts        # エントリポイント
```

## 設計方針

- **関数ベース**: Classは使用せず、関数とオブジェクトで実装
- **レイヤード構造**: Route → Procedure → Service → Repository
- **Prisma使用制限**: Repository層でのみPrismaを使用

## 参照ドキュメント

- [docs/BACKEND.md](../../docs/BACKEND.md) - バックエンド開発規約
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - アーキテクチャ概要
