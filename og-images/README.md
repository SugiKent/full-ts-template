# OGP画像・ストアマーケティング画像生成ツール

HTML+CSSテンプレートからOGP画像およびApp Store/Google Playストア用マーケティング画像を自動生成するツールです。

## 使用方法

### OGP画像生成

プロジェクトルートから実行:

```bash
pnpm run generate:og
```

### ストア用マーケティング画像生成

```bash
pnpm run generate:store
```

#### 出力先

- **iOS App Store (6.5")**: `og-images/output/store/ios/`
  - サイズ: 1284 x 2778 px
- **Google Play**: `og-images/output/store/android/`
  - サイズ: 1080 x 1920 px

#### 生成される画像

| ファイル名 | 説明 | キャッチコピー |
|-----------|------|--------------|
| `01-home.png` | ホーム画面 | 夢を、今月のアクションに。 |
| `02-categories.png` | カテゴリ選択 | あなたの興味を選んでください |
| `03-steps.png` | AIステップ提案 | AIが最初の一歩を提案 |
| `04-progress.png` | 進捗管理 | 進捗を見える化して続けられる |
| `05-complete.png` | 達成・シェア | 達成をみんなにシェアしよう |

## ファイル構成

```
og-images/
├── generate.ts                    # OGP画像生成スクリプト
├── generate-store-images.ts       # ストア画像生成スクリプト
├── package.json
├── README.md
├── AGENTS.md                      # AIエージェント向けガイド
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

## ストア画像のカスタマイズ

### デザイン更新手順

1. `templates/store/` 内のHTMLファイルを編集
2. ブラウザで直接HTMLを開いてプレビュー確認
3. `pnpm run generate:store` で画像を再生成
4. `output/store/` の画像をストアにアップロード

### デザインガイドライン

各テンプレートは以下の構成になっています：

- **キャッチコピーエリア**: 画面上部に日本語のキャッチコピー
- **アプリ画面モック**: アプリUIを再現したモック画面
- **カラーテーマ**: 各画面で異なるアクセントカラー
  - ホーム: アンバー（温かみ）
  - カテゴリ: スカイブルー（爽やか）
  - ステップ: パープル（AI・先進性）
  - 進捗: グリーン（達成・成長）
  - シェア: ゴールド（祝福）

### スタイル特徴

- **フォント**: Noto Sans JP（Google Fonts）
- **単位**: `vw`（ビューポート幅比）で異なるサイズに対応
- **レイアウト**: Flexboxベースのレスポンシブ
- **アイコン**: 絵文字とSVGアイコンの組み合わせ

### 新しい画面を追加する場合

1. `templates/store/` に新しいHTMLファイルを作成
2. `generate-store-images.ts` の `SCREEN_TEMPLATES` 配列に設定を追加:

```typescript
{
  id: 'new-screen',
  name: '新しい画面',
  htmlFile: 'templates/store/06-new-screen.html',
  sortOrder: 6,
}
```

3. `pnpm run generate:store` で画像を生成

## ストア要件

### iOS App Store

- **サイズ**: 6.5インチ iPhone用 (1284 x 2778 px)
- **最大枚数**: 10枚
- **フォーマット**: PNG/JPEG
- **最大ファイルサイズ**: 10MB

### Google Play

- **サイズ**: Phone (1080 x 1920 px)
- **最大枚数**: 8枚
- **フォーマット**: PNG/JPEG（透過なし）
- **最大ファイルサイズ**: 8MB

## 技術詳細

- Playwrightでヘッドレスブラウザを起動
- HTMLを`setContent`で直接読み込み
- 各サイズのビューポートでスクリーンショットを撮影
- PNG形式で保存（非圧縮、高品質）
