# 開発フローガイド

このドキュメントでは、フルスタックTypeScriptアプリケーションの開発フローを説明します。

## 目次

- [アーキテクチャ概要](#アーキテクチャ概要)
- [開発環境のセットアップ](#開発環境のセットアップ)
- [管理画面の開発](#管理画面の開発)
- [エンドユーザー向けアプリの開発](#エンドユーザー向けアプリの開発)
- [本番環境](#本番環境)

## アーキテクチャ概要

### ハイブリッドアプローチ

このプロジェクトは **管理画面** と **エンドユーザー向けアプリ** で異なる開発フローを採用しています：

| | 管理画面 (`/admin/*`) | エンドユーザー向けアプリ (`/app/*`) |
|---|---|---|
| **アクセス元** | ブラウザ（管理者） | ブラウザ/アプリ（エンドユーザー） |
| **開発時のHMR** | ✅ 有効 | ✅ 有効（Vite経由） |
| **開発サーバー** | Vite (5173) | Vite (5173) + Fastify (8080) |
| **認証方法** | セッション | トークンベース |

### 開発環境の構成

```
管理画面開発:
  ブラウザ → Vite (5173) → Fastify (8080) へプロキシ [HMR有効]

エンドユーザー向けアプリ開発:
  ブラウザ → Vite (5173) → Fastify (8080) へプロキシ [HMR有効]
            ↓
       HTML/JS/CSS配信   API
```

### 本番環境の構成

```
管理画面:
  ブラウザ → Fastify (8080) [ビルド済み配信]

エンドユーザー向けアプリ:
  ブラウザ → Fastify (8080) [ビルド済み配信]
```

## 開発環境のセットアップ

### 必要なツール

- Node.js 24.x
- pnpm
- PostgreSQL
- Redis（オプション）

### 初回セットアップ

```bash
# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して必要な環境変数を設定

# データベースのセットアップ
pnpm prisma migrate dev
pnpm db:seed

# ビルド（初回のみ）
pnpm run build
```

## 管理画面の開発

### 開発サーバーの起動

```bash
# ターミナル1: Viteサーバー起動（HMR有効）
pnpm run dev:client

# ターミナル2: Fastifyサーバー起動
pnpm run dev:server

# または両方同時に起動
pnpm run dev
```

### アクセス方法

```
ブラウザで http://localhost:5173/admin にアクセス
```

### 開発フロー

1. `src/client/admin/` 配下のファイルを編集
2. ブラウザで即座に反映される（HMR）
3. APIエンドポイントは自動的に `localhost:8080` にプロキシされる

### ファイル構成

```
src/client/
├── admin/           # 管理画面のReactコンポーネント
│   ├── App.tsx
│   ├── pages/
│   └── components/
├── main.tsx         # 管理画面のエントリポイント
└── index.html       # 管理画面のHTML
```

## エンドユーザー向けアプリの開発

### 開発サーバーの起動

```bash
# ターミナル1: Fastify（APIサーバー）
pnpm run dev:server

# ターミナル2: Vite（フロントエンド + HMR）
pnpm run dev:client

# または両方同時に起動
pnpm run dev
```

### アクセス方法

```
ブラウザで http://localhost:5173/app にアクセス
```

### 開発フロー

1. `src/client/user/` 配下のファイルを編集
2. Vite の HMR が自動的に変更を反映
3. ブラウザで即座に確認可能

**HMR の恩恵**: ファイル保存時に自動でリロードされ、ブラウザを手動でリロードする必要はありません。

### ビルドが必要な場合

以下の場合はビルドが必要です：

- 本番環境にデプロイする前
- ビルド済みファイルでテストしたい場合

```bash
pnpm run build
```

### ファイル構成

```
src/client/
├── user/              # エンドユーザー向けReactコンポーネント
│   ├── App.tsx
│   ├── pages/
│   └── components/
├── user/main.tsx      # エンドユーザー向けエントリポイント
└── user.html          # エンドユーザー向けHTML
```

## 本番環境

### ビルド

```bash
# TypeCheckとビルド
pnpm run build
```

### デプロイ

```bash
# 本番環境でサーバー起動
NODE_ENV=production pnpm run dev:server
```

本番環境では、管理画面もエンドユーザー向けアプリも **ビルド済みファイル** が配信されます。

## トラブルシューティング

### 管理画面が真っ白

- Viteサーバー（5173）が起動しているか確認
- ブラウザのコンソールでエラーを確認

### エンドユーザー向けアプリが真っ白

- Viteサーバー（5173）が起動しているか確認
- Fastifyサーバー（8080）が起動しているか確認
- ブラウザのコンソールでエラーを確認

### APIが404エラー

- Fastifyサーバー（8080）が起動しているか確認
- vite.config.ts のプロキシ設定を確認

### HMRが動かない

- Viteサーバー（5173）が起動しているか確認
- ブラウザのコンソールでWebSocket接続エラーがないか確認

## 参考資料

- [Vite - Server Options](https://vitejs.dev/config/server-options.html)
- [Fastify - Routes](https://fastify.dev/docs/latest/Reference/Routes/)

---

## 変更履歴

### 2025年12月
- ボイラープレートテンプレートとして初期化
- エンドユーザー向けアプリ構成に変更

最終更新: 2025年12月
