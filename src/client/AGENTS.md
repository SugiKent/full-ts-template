# client

このディレクトリにはReact 19ベースのフロントエンドを配置します。

## ディレクトリ構成

```
client/
├── components/     # 共通コンポーネント
│   ├── admin/      # 管理画面用コンポーネント
│   └── user/       # エンドユーザー用コンポーネント
├── hooks/          # カスタムフック
├── pages/          # ページコンポーネント
│   ├── admin/      # 管理画面ページ
│   └── user/       # エンドユーザー向けページ
├── services/       # API クライアント（oRPC）
├── styles/         # Tailwind CSS設定
├── App.tsx         # ルートコンポーネント
└── main.tsx        # エントリポイント
```

## 設計方針

- **React 19**: Actions, useActionState, useOptimistic等の新機能を使用
- **Tailwind CSS**: ユーティリティファーストCSS（CSS-in-JS禁止）
- **関数コンポーネント**: クラスコンポーネント禁止
- **状態管理**: React標準のuseState/useContext/useReducerを使用

## 参照ドキュメント

- [docs/FRONTEND.md](../../docs/FRONTEND.md) - フロントエンド開発規約
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - アーキテクチャ概要
