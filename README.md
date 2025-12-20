# {TODO: サービス名}

{TODO: サービスを一言で}

## 概要

{TODO: サービス概要を2文くらいで}

### 主な機能

{TODO: 主な機能を箇条書きで}

## クイックスタート

### 必要要件
- Node.js 24.11.1 以上
- pnpm 10.0 以上
- Docker & Docker Compose

### セットアップ手順

```bash
# 1. リポジトリのクローン

# 2. 依存関係のインストール
pnpm install

# 3. 環境変数の設定
cp .env.example .env
# .env ファイルを編集して必要な値を設定

# 4. Docker環境の起動（PostgreSQL, Redis）
docker-compose up -d

# 5. データベースマイグレーション
pnpm run db:migrate

# 6. 開発サーバーの起動
pnpm run dev
```

サーバーは http://localhost:8080 で起動します。

### 基本的なコマンド

```bash
pnpm run dev         # 開発サーバー起動
pnpm run build       # 本番ビルド
pnpm run test        # テスト実行
pnpm run lint        # Linting
pnpm run format      # コード整形
pnpm run typecheck  # 型チェック
```

## プロジェクト構成

```
{project-name}/
├── src/
│   ├── server/      # Fastify バックエンド
│   ├── client/      # React フロントエンド（管理画面・エンドユーザー向け）
│   └── shared/      # 共通型定義
├── prisma/          # データベーススキーマ
├── docs/            # ドキュメント
├── tests/           # テストファイル
├── docker-compose.yml
└── package.json
```

## 開発

### ブランチ戦略
- `main`: 本流ブランチ（継続的デプロイ）
- `feature/*`: 機能開発（1-2日以内にマージ）
- `hotfix/*`: 緊急修正

### コミット規約
[Conventional Commits](https://www.conventionalcommits.org/) に従ってください:
- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメント
- `test:` テスト

### テスト実行
```bash
pnpm run test            # 全テスト実行
pnpm run test:coverage   # カバレッジ計測
pnpm run test:e2e        # E2Eテスト
```

詳細は [docs/TEST.md](docs/TEST.md) を参照してください。

## ドキュメント

- [PROJECT.md](PROJECT.md) - ビジネス要件・機能仕様
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - 技術アーキテクチャ詳細
- [docs/TEST.md](docs/TEST.md) - テスト戦略ガイド
- [AGENTS.md](AGENTS.md) - AI開発支援ガイド

