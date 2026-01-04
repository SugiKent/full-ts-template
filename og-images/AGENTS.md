# OGP画像生成 - AI エージェントガイド

このドキュメントは、`og-images/` ディレクトリで作業する AI エージェント向けのガイドです。

## 概要

HTML+CSS テンプレートから OGP 画像（1200x630px）を自動生成するツールです。Playwright を使用してヘッドレスブラウザでスクリーンショットを撮影し、PNG 画像として出力します。

## ディレクトリ構成

```
og-images/
├── AGENTS.md          # このファイル
├── README.md          # 使用方法の詳細
├── generate.ts        # 画像生成スクリプト
├── package.json
└── templates/
    └── default.html   # デフォルトテンプレート
```

## コマンド

```bash
# プロジェクトルートから実行（推奨）
pnpm run generate:og

# og-images ディレクトリ内で実行
pnpm run generate
```

## 出力先

生成された画像は `src/client/public/og/` に配置されます：

- `src/client/public/og/default.png` - デフォルトOGP画像

## テンプレート編集時の注意事項

### 技術的制約

- 画像サイズ: 1200x630px（アスペクト比 1.91:1）
- Retina 対応で 2 倍解像度（2400x1260px）で生成
- **Google Fonts のみ使用可能**（ローカルフォントは Playwright が読み込めない）
- インライン CSS を使用すること

### 編集フロー

1. `templates/` 内の HTML ファイルを編集
2. ブラウザで直接 HTML を開いてプレビュー確認
3. `pnpm run generate:og` で画像を再生成
4. `src/client/public/og/` の画像をコミット

## 新しいテンプレート追加時

1. `templates/` に新しい HTML ファイルを作成
2. `generate.ts` の `templates` 配列に設定を追加:

```typescript
{
  name: 'TemplateName',
  input: 'templates/new-template.html',
  output: '../src/client/public/og/new-template.png',
}
```

3. 画像を生成して動作確認

## 禁止事項

- ローカルフォントの使用
- 外部画像の参照（埋め込み推奨）
- JavaScript による動的レンダリング
