# OGP画像・ストア画像生成 - AI エージェントガイド

このドキュメントは、`og-images/` ディレクトリで作業する AI エージェント向けのガイドです。

## 概要

HTML+CSS テンプレートから以下を自動生成するツールです：

1. **OGP 画像**（1200x630px）- SNS シェア用
2. **ストア用マーケティング画像** - App Store / Google Play 用

Playwright を使用してヘッドレスブラウザでスクリーンショットを撮影し、PNG 画像として出力します。

## ディレクトリ構成

```
og-images/
├── AGENTS.md                      # このファイル
├── README.md                      # 使用方法の詳細
├── generate.ts                    # OGP画像生成スクリプト
├── generate-store-images.ts       # ストア画像生成スクリプト
├── package.json
├── output/
│   └── store/
│       ├── ios/                   # iOS App Store用画像
│       └── android/               # Google Play用画像
└── templates/
    ├── default.html               # OGPデフォルトテンプレート
    └── store/
        ├── 01-home.html           # ホーム画面
        ├── 02-categories.html     # カテゴリ選択
        ├── 03-steps.html          # AIステップ提案
        ├── 04-progress.html       # 進捗管理
        └── 05-complete.html       # 達成・シェア
```

## コマンド

```bash
# OGP画像生成
pnpm run generate:og

# ストア用マーケティング画像生成
pnpm run generate:store
```

## 出力先

### OGP画像

`src/client/public/og/` に配置されます

### ストア画像

`og-images/output/store/` に配置されます：

| プラットフォーム | サイズ | 出力先 |
|----------------|-------|-------|
| iOS App Store (6.5") | 1284 x 2778 px | `output/store/ios/` |
| Google Play | 1080 x 1920 px | `output/store/android/` |

## ストア画像テンプレートの編集

### デザインパターン

各画面は以下の構成で統一されています：

1. **キャッチコピーエリア**（上部）
   - 大見出し（`h1`）: 6-7vw サイズ
   - サブテキスト: 3.5vw サイズ
   - 背景: グラデーション

2. **アプリ画面モック**（下部）
   - 角丸デバイスフレーム
   - ステータスバー
   - 実際のアプリUIを再現

### カラーテーマ

| 画面 | テーマカラー | 意図 |
|-----|------------|------|
| ホーム | アンバー (#FEF3C7) | 温かみ、居心地の良さ |
| カテゴリ | スカイブルー (#E0F2FE) | 爽やか、選択の自由 |
| ステップ | パープル (#F3E8FF) | AI、先進性 |
| 進捗 | グリーン (#ECFDF5) | 達成、成長 |
| シェア | ゴールド (#FEF3C7) | 祝福、達成感 |

### 編集フロー

1. `templates/store/` 内の HTML ファイルを編集
2. ブラウザで直接 HTML を開いてプレビュー確認
3. `pnpm run generate:store` で画像を再生成
4. `output/store/` の画像を確認

## 技術的制約

### 共通

- **Google Fonts のみ使用可能**（ローカルフォントは Playwright が読み込めない）
- インライン CSS を使用すること
- JavaScript による動的レンダリングは避ける

### ストア画像固有

- 単位は `vw`（ビューポート幅比）を使用して異なるサイズに対応
- デバイスフレームは不要（ストアが自動で追加する場合がある）
- アニメーションは CSS で定義可能（スクリーンショット時点の状態が撮影される）

## 新しいストア画面を追加する場合

1. `templates/store/` に新しい HTML ファイルを作成（命名: `XX-screen-name.html`）
2. `generate-store-images.ts` の `SCREEN_TEMPLATES` 配列に設定を追加:

```typescript
{
  id: 'screen-name',
  name: '画面名',
  htmlFile: 'templates/store/XX-screen-name.html',
  sortOrder: X,
}
```

3. `pnpm run generate:store` で画像を生成

## ストア要件メモ

### iOS App Store

- 6.5インチ iPhone用: 1284 x 2778 px（必須）
- 最大10枚、最小1枚
- PNG/JPEG、最大10MB
- デバイスフレームは使用禁止（Appleガイドライン）

### Google Play

- Phone: 1080 x 1920 px（9:16）
- 最大8枚、最小2枚
- PNG/JPEG（透過なし）、最大8MB
- 余白なし（フルブリード）

## 禁止事項

- ローカルフォントの使用
- 外部画像の参照（データURIで埋め込み推奨）
- JavaScript による動的レンダリング
- デバイスを持つ手の画像（Appleガイドライン違反）
