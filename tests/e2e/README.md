# E2E テストディレクトリ構成

このディレクトリには、Playwright を使用した E2E テストが格納されています。

## ディレクトリ構造

```
tests/e2e/
├── *.spec.ts         # E2Eテストファイル
├── specs/            # テスト仕様書（Planner Agent が生成）
│   └── *.md         # Markdown形式のテスト計画
└── README.md        # このファイル
```

## Playwright Agents の使い方

### 1. テスト計画の作成（Planner Agent）

```bash
# Planner Agent でテスト計画を作成
npx playwright agent:planner "ログイン認証フローのテスト計画を作成"
```

生成されたテスト計画は `tests/e2e/specs/` に保存されます。

### 2. テストコードの生成（Generator Agent）

```bash
# Generator Agent でテストコードを生成
npx playwright agent:generator --plan=tests/e2e/specs/login-auth-plan.md
```

生成されたテストは `tests/e2e/` に保存されます。

### 3. テストの修復（Healer Agent）

```bash
# Healer Agent で失敗したテストを自動修復
npx playwright agent:healer --watch
```

## テストの実行

```bash
# すべてのテストを実行
pnpm test:e2e

# 特定のブラウザでテストを実行
pnpm test:e2e --project=chromium

# デバッグモードで実行
pnpm test:e2e --debug

# UI モードで実行
pnpm test:e2e --ui
```

## テストカテゴリ

### 管理画面テスト
- ログイン認証
- ユーザー管理
- ダッシュボード機能

### ユーザー向けアプリケーションテスト
- ユーザー認証フロー
- プロフィール管理
- 各種機能テスト

## ベストプラクティス

1. **データテストID の使用**
   - すべてのテスト対象要素に `data-testid` 属性を付与
   - セレクタは `[data-testid="xxx"]` 形式で統一

2. **Page Object Pattern**
   - 再利用可能なページオブジェクトを作成
   - テストコードの保守性を向上

3. **独立性の確保**
   - 各テストは独立して実行可能
   - テスト間の依存関係を排除

4. **適切な待機処理**
   - Playwright の自動待機機能を活用
   - 固定の sleep は使用しない

## トラブルシューティング

### テストが失敗する場合

1. Healer Agent で自動修復を試す
2. トレースファイルを確認: `npx playwright show-trace`
3. デバッグモードで実行: `pnpm test:e2e --debug`

### セレクタが見つからない場合

1. Playwright Inspector で要素を確認
2. `data-testid` の追加を検討
3. より堅牢なセレクタに更新

## 参考リンク

- [Playwright ドキュメント](https://playwright.dev/docs/intro)
- [Playwright Agents ガイド](../docs/tools_fixed/PLAYWRIGHT.md)
