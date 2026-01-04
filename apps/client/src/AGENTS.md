# @repo/client

Turborepoモノレポ内のReact 19ベースのフロントエンドアプリケーションです。

## パッケージ情報

- **パッケージ名**: `@repo/client`
- **タイプ**: アプリケーション（private）
- **ビルドツール**: Vite 7.x

## ディレクトリ構成

```
apps/client/src/
├── components/     # 共通コンポーネント
│   ├── admin/      # 管理画面用コンポーネント
│   ├── common/     # 共通UIコンポーネント
│   └── user/       # エンドユーザー用コンポーネント
├── hooks/          # カスタムフック
├── pages/          # ページコンポーネント
│   ├── admin/      # 管理画面ページ
│   └── user/       # エンドユーザー向けページ
├── services/       # API クライアント（oRPC）
├── i18n/           # i18n設定
├── locales/        # 翻訳ファイル
├── styles/         # Tailwind CSS設定
├── App.tsx         # ルートコンポーネント
└── main.tsx        # エントリポイント
```

## 主なスクリプト

```bash
pnpm run dev          # 開発サーバー起動
pnpm run build        # 本番ビルド
pnpm run typecheck    # 型チェック
pnpm run lint         # Biomeによるリント
pnpm run format       # Biomeによるフォーマット
```

## 設計方針

- **React 19**: Actions, useActionState, useOptimistic等の新機能を使用
- **Tailwind CSS**: ユーティリティファーストCSS（CSS-in-JS禁止）
- **関数コンポーネント**: クラスコンポーネント禁止
- **状態管理**: React標準のuseState/useContext/useReducerを使用
- **i18n**: react-i18nextによる多言語対応

## 依存パッケージ

- `@repo/shared`: 共有型・スキーマ
- `@repo/server`: 型のみ（APIクライアント生成用）

## 参照ドキュメント

- [docs/FRONTEND.md](../../../docs/FRONTEND.md) - フロントエンド開発規約
- [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md) - アーキテクチャ概要
