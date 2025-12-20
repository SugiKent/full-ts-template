# 技術スタック更新スキル

## 概要

このスキルは、プロジェクトの技術スタックとライブラリ依存関係を安全かつ体系的に分析・更新するためのものです。

## 機能

このスキルで可能なこと：
- `package.json` の依存関係分析
- 古いパッケージのチェック
- 破壊的変更と互換性の評価
- 適切な順序でのアップグレード計画作成
- 変更後のドキュメント更新

## ワークフロー

### フェーズ 1: 分析

1. **現状の把握**
   - `package.json` から dependencies と devDependencies を解析
   - `pnpm-lock.yaml` で正確なバージョンを確認
   - 関連ドキュメント (`docs/ARCHITECTURE.md`, `docs/*.md`) を確認

2. **更新の確認**
   ```bash
   pnpm outdated
   ```

3. **リスクの特定**
   - メジャーバージョン変更（破壊的変更）
   - ピア依存関係の競合
   - TypeScript 型の互換性
   - フレームワーク固有のマイグレーション要件

### フェーズ 2: 計画

1. **更新の分類**
   - **安全**: パッチ更新 (x.x.PATCH)
   - **マイナー**: マイナー更新 (x.MINOR.x) - 新機能、後方互換性あり
   - **メジャー**: メジャー更新 (MAJOR.x.x) - 破壊的変更の可能性あり

2. **順序付け**
   - コア依存関係を最初に（TypeScript, React, Node）
   - フレームワーク依存関係を次に（Fastify, Vite）
   - ユーティリティライブラリは最後

3. **マイグレーション計画の作成**
   - 各更新の理由を文書化
   - 必要なコード変更をリスト化
   - テスト要件をメモ

### フェーズ 3: 実行

1. **依存関係の更新**
   ```bash
   # 安全な更新
   pnpm update

   # 特定のパッケージを更新
   pnpm add <package>@latest

   # 正確なバージョンで更新
   pnpm add <package>@<version>
   ```

2. **変更の検証**
   ```bash
   pnpm run typecheck
   pnpm run lint
   pnpm run build
   pnpm run test
   ```

3. **ドキュメントの更新**
   - 技術が変更された場合は `docs/ARCHITECTURE.md` を更新
   - セットアップ手順が変更された場合は `README.md` を更新
   - バージョン固有のドキュメントを更新

## ベストプラクティス

1. **メジャー更新前は必ずチェンジログを確認**
2. **メジャー依存関係は一度に一つずつ更新**して問題を切り分ける
3. **各重要な変更後にフルテストスイートを実行**
4. **明確なメッセージで段階的にコミット**
5. **ドキュメントを実際のバージョンと同期させる**

## 一般的なパターン

### React の更新
```bash
pnpm add react@latest react-dom@latest
pnpm add -D @types/react@latest @types/react-dom@latest
```

### TypeScript の更新
```bash
pnpm add -D typescript@latest
pnpm run typecheck  # 新しいエラーがないか確認
```

### Prisma の更新
```bash
pnpm add @prisma/client@latest
pnpm add -D prisma@latest
pnpm prisma generate
```

### テストツールの更新
```bash
pnpm add -D vitest@latest @vitest/coverage-v8@latest
pnpm add -D @playwright/test@latest
pnpm exec playwright install
```

## 引数

`$ARGUMENTS` で指定可能：
- `--check` - 分析のみ、変更なし
- `--safe` - パッチ更新のみ適用
- `--minor` - パッチとマイナー更新を適用
- `--major <package>` - 特定のパッケージを最新メジャーに更新
- `--docs` - 現在のバージョンを反映してドキュメントのみ更新

## 出力形式

このスキルが生成するもの：
1. 現状のサマリー
2. リスク評価付きの利用可能な更新
3. 推奨される更新順序
4. 実行コマンド
5. 検証チェックリスト
