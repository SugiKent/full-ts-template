# OGP画像生成ツール

HTML+CSSテンプレートからOGP画像（1200x630px）を自動生成するツールです。

## 使用方法

### 画像生成

プロジェクトルートから実行:

```bash
pnpm run generate:og
```

または `og-images` ディレクトリ内で:

```bash
pnpm install  # 初回のみ
pnpm run generate
```

### 出力先

生成された画像は以下に配置されます:

- `src/client/public/og/default.png` - デフォルトOGP画像

## テンプレートの編集

### ファイル構成

```
og-images/
├── generate.ts          # 画像生成スクリプト
├── package.json
├── README.md
├── AGENTS.md           # AIエージェント向けガイド
└── templates/
    └── default.html    # デフォルトテンプレート
```

### デザイン更新手順

1. `templates/` 内のHTMLファイルを編集
2. ブラウザで直接HTMLを開いてプレビュー確認
3. `pnpm run generate:og` で画像を再生成
4. `src/client/public/og/` の画像をコミット

### 新しいテンプレートの追加

1. `templates/` に新しいHTMLファイルを作成
2. `generate.ts` の `templates` 配列に設定を追加:

```typescript
{
  name: 'TemplateName',
  input: 'templates/your-template.html',
  output: '../src/client/public/og/your-template.png',
}
```

3. `pnpm run generate:og` で画像を生成

### 注意事項

- 画像サイズは 1200x630px（アスペクト比 1.91:1）
- Retina対応で2倍解像度（実際は2400x1260px）で生成
- Google Fontsは埋め込み済み
- ローカルフォントは使用不可（Playwrightが読み込めないため）

## 技術詳細

- Playwrightでヘッドレスブラウザを起動
- HTMLをsetContentで直接読み込み
- スクリーンショットをPNG形式で保存
