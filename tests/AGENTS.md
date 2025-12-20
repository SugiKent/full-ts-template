# tests

このディレクトリにはE2Eテストと共通テストユーティリティを配置します。

## ディレクトリ構成

```
tests/
├── e2e/            # E2Eテスト（Playwright）
│   ├── specs/      # テストファイル (*.spec.ts)
│   └── fixtures/   # テストフィクスチャ
├── mocks/          # 共通モック
├── factories/      # テストデータファクトリー
└── setup.ts        # Vitestグローバルセットアップ
```

## テストファイルの配置ルール

| テストの種類 | 配置場所 | 拡張子 |
|------------|---------|-------|
| 単体テスト | `src/**/*.test.ts` | `.test.ts` |
| 統合テスト | `src/**/*.integration.test.ts` | `.integration.test.ts` |
| E2Eテスト | `tests/e2e/specs/*.spec.ts` | `.spec.ts` |

## コマンド

```bash
pnpm run test           # 単体・統合テスト
pnpm run test:coverage  # カバレッジ計測
pnpm run test:e2e       # E2Eテスト
```

## 参照ドキュメント

- [docs/TEST.md](../docs/TEST.md) - テスト戦略ガイド
