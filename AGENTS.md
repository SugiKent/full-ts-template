<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->



# 現在このProjectはとあるProjectのコピーとなっていますが、これから元のプロジェクト固有の情報を削除していき、洗練させることで今後のプロジェクトのボイラーテンプレートにしていきます



# AI エージェント活用ガイド

このドキュメントでは、{TODO: サービス概要を書く} AI エージェントを効果的に活用する方法を説明します。

## ⚠️ 重要: 設計ドキュメントの参照

**実装前に必ず以下のドキュメントを参照してください：**

- `@PROJECT.md` - ビジネス要件と機能仕様を確認
- `@docs/ARCHITECTURE.md` - 技術アーキテクチャと開発規約を厳守

## 概要

AI エージェントを使用することで、開発タスクの効率化と品質向上を実現します。**ただし、必ず設計ドキュメントに従い、独自の判断で設計変更を行わないでください。**

## システムアーキテクチャ

**必須参照**: 以下のドキュメントを用途に応じて参照してください

- **全体構成**: `@docs/ARCHITECTURE.md` - システム全体のアーキテクチャと技術スタック
- **バックエンド開発**: `@docs/BACKEND.md` - Fastify、oRPC、Repository層の実装規約
- **フロントエンド開発**: `@docs/FRONTEND.md` - React 19、Tailwind CSS、コンポーネント設計
- **認証実装**: `@docs/AUTH.md` - 認証の設計
- **データベース設計**: `@docs/DATABASE.md` - Prismaスキーマ、拡張パターン、Repository層
- **テスト設計**: `@docs/TEST.md` - ユニットテスト、統合テスト、E2Eテストのベストプラクティス

## ビジネス要件/サービス設計

**必須参照**: `@PROJECT.md`

## 多言語対応（i18n）

このプロジェクトはi18n対応しています。

**対応言語設定**: `packages/shared/src/config/i18n.ts` で定義されています。新しい言語を追加する場合はこのファイルを更新してください。

**詳細は `@docs/FRONTEND.md` の「7. 多言語対応（i18n）」セクションを参照してください。**

### 必須ルール

- **すべての UI テキストは翻訳キーを使用**（ハードコード禁止）
- 新しいテキスト追加時は **対応言語すべて** に翻訳を追加
- `pnpm run lint` でハードコードテキストが検出される

```tsx
// ❌ 禁止: ハードコードテキスト
<button>送信</button>
<p>Welcome to our app</p>

// ✅ 正しい実装
const { t } = useTranslation('user')
<button>{t('common.submit')}</button>
<p>{t('home.welcome')}</p>
```

### 翻訳ファイルの場所

`apps/client/src/locales/{言語コード}/{namespace}.json`

対応言語は `packages/shared/src/config/i18n.ts` の `SUPPORTED_LANGUAGES` を参照。
namespace は同ファイルの `I18N_NAMESPACES` を参照。

## 実装検証ルール 🔍

### 必須: 定期的な品質チェック

**300行の実装ごとに以下を実行してください(ドキュメントの更新のみの場合は不要)：**

```bash
# 1. Biomeによるフォーマットチェック
pnpm run format

# 2. Biomeによるリント
pnpm run lint

# 3. TypeScript型チェック
pnpm run typecheck
```

**機能実装完了時に必ず実行：**

```bash
# 4. ビルド確認
pnpm run build

# 5. テスト実行
pnpm run test

# 6. E2Eテスト実行（フロントエンド実装時）
pnpm run test:e2e
```

### E2Eテストについて

**Playwright Agents** を使用したAI駆動E2Eテストを採用：
- **Planner**: テストシナリオを自動生成
- **Generator**: Playwrightテストコードを自動生成
- **Healer**: 失敗したテストを自動修復

**詳細は `@docs/FRONTEND.md` の「6. テスト」セクションを参照してください。**

### 設計遵守チェックリスト

実装前に確認:
- [ ] 該当する専門ドキュメント（BACKEND.md、FRONTEND.md等）を読んだか
- [ ] Classの代わりに関数・オブジェクトを使用しているか
- [ ] Enumの代わりにconst assertionを使用しているか
- [ ] InterfaceにI/Tプレフィックスを付けていないか
- [ ] Tailwind CSSを使用しているか（CSS-in-JSは禁止）

実装後に確認:
- [ ] `pnpm run lint` がエラーなく通るか
- [ ] `pnpm run typecheck` がエラーなく通るか
- [ ] `pnpm run build` が成功するか

## ベストプラクティス

1. **設計ドキュメントを常に参照** - `@PROJECT.md`と関連する専門ドキュメントを必ず確認
3. **小さく頻繁に検証** - 10-20行ごとにlint/formatを実行
4. **段階的に進める** - 設計確認→実装→検証→テストの順序で
5. **独自判断を避ける** - 設計にない実装は必ず確認を取る
6. **OpenSpec を用いた実装をすること** - OpenSpec を用いて設計と実装を行います. 詳細は `@/openspec/AGENTS.md` を参照してください
7. **PROJECT.mdからの記述削除** - OpenSpec は実装済み箇所の仕様書を更新するため, 実装が終えた部分については PROJECT.md の記載から削除して下さい.
8. **堅牢で保守性の高いコードを書く** - モジュール化、再利用性、テスト容易性を考慮. 例えばただの string ではなく, interface にまとめたほうが良い場合などを発見し実装すること。
9. **型に厳密であること** - TypeScriptの型システムを最大限に活用

## 注意事項

### 🚫 禁止事項
- 設計ドキュメントにない新しいライブラリの追加
- Classベースの実装（React Component以外）
- DIコンテナの使用
- Enumの使用
- Interface/TypeへのI/Tプレフィックス
- CSS-in-JS（styled-components、emotion等）の使用
- インラインスタイル（style属性）の使用
- Tailwind CSS以外のCSSフレームワークの使用
- テストを通すために TypeScript の型チェックを無効化したり緩和すること

### ⚠️ 要注意事項
- 本番環境の認証情報は共有しない
- 個人情報は必ず仮名化する
- 生成されたコードは必ずlint/format/buildを通す
- 医療情報の取り扱いに注意

## 参考リンク

### プロジェクト関連
- [PROJECT.md](PROJECT.md) - ビジネス仕様
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - 全体アーキテクチャ
- [docs/BACKEND.md](docs/BACKEND.md) - バックエンド開発規約
- [docs/FRONTEND.md](docs/FRONTEND.md) - フロントエンド開発規約
- [docs/AUTH.md](docs/AUTH.md) - 認証アーキテクチャ
- [docs/DATABASE.md](docs/DATABASE.md) - データベース設計

