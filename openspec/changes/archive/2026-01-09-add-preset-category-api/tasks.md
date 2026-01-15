# Tasks: プリセットカテゴリー配信 API

## 1. 共有スキーマ

- [x] 1.1 `packages/shared/src/schemas/preset-category.ts` を作成
  - PresetCategorySchema
  - GetPresetCategoriesResponseSchema

## 2. サーバー実装

- [x] 2.1 `apps/server/src/constants/preset-categories.ts` を作成
  - PRESET_CATEGORIES 定数（10個のカテゴリー）
- [x] 2.2 `apps/server/src/procedures/user/v1/preset.ts` を作成
  - getCategories Procedure（認証不要）
- [x] 2.3 `apps/server/src/procedures/user/v1/index.ts` に preset router を追加

## 3. 検証

- [x] 3.1 `pnpm run typecheck`
- [x] 3.2 `pnpm run lint`
- [x] 3.3 `pnpm run build`
- [ ] 3.4 API 動作確認
