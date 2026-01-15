# Change: プリセットカテゴリー配信 API

## Why

オンボーディング時に表示するプリセットカテゴリー（約10個）がモバイルアプリにハードコードされている。
サーバーから配信することで、カテゴリーの追加・変更をアプリ更新なしに行えるようにする。

## What Changes

- 新規 API エンドポイント `preset.getCategories` を追加
- 共有スキーマ `PresetCategorySchema` を追加
- サーバーサイド定数でプリセットカテゴリーを定義

## Impact

- Affected specs: 新規（preset-category）
- Affected code:
  - `packages/shared/src/schemas/preset-category.ts`（新規）
  - `apps/server/src/constants/preset-categories.ts`（新規）
  - `apps/server/src/procedures/user/v1/preset.ts`（新規）
  - `apps/server/src/procedures/user/v1/index.ts`（変更）
