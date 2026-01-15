# Change: モバイルアプリのHome画面実装（モックデータ版）

## Why
現在のモバイルアプリのHome画面は空の状態である。PROJECT.md で定義されているウィッシュリスト管理アプリのHome画面UIを、バックエンド連携前にモックデータを使用して実装し、UIの検証と開発の並行を可能にする。

## What Changes
- モバイルアプリのHome画面UIを実装
- 「今月やること」セクションの表示
- カテゴリー別ウィッシュリストアイテム一覧の表示
- ステップ進捗表示
- 残り日数表示
- アイテム詳細表示用シートモーダル
- Notion風ミニマルデザインの適用
- モックデータによる動作確認

## Impact
- Affected specs: mobile-home（新規）
- Affected code:
  - `apps/mobile/app/(tabs)/index.tsx` - Home画面
  - `apps/mobile/src/components/` - 新規UIコンポーネント
  - `apps/mobile/src/mocks/` - モックデータ
  - `apps/mobile/src/i18n/locales/ja/common.json` - 翻訳追加
  - `apps/mobile/src/types/` - 型定義
