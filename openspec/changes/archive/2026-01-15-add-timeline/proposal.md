# Change: タイムライン機能の追加

## Why

ユーザーの活動を時系列で振り返れる「タイムライン」を提供することで、日々の気づきの記録と目標達成の軌跡を一箇所で確認できるようにする。現在のアプリは目標管理に特化しているが、過去の振り返りや達成感を味わう場所がなく、モチベーション維持の機会を逃している。

## What Changes

### 新規追加

- **タイムラインタブ**: HOME画面の左側に新しいタブとしてタイムライン画面を追加
- **ジャーナルエントリー作成**: 日々の気づきや振り返りを自由に記録
- **完了ログ表示**: ウィッシュリストアイテムやステップの完了履歴を自動表示
- **統合タイムライン表示**: ジャーナルと完了ログを時系列で混在表示
- **HOMEからの導線**: HOME画面からタイムラインタブへの導線を追加

### データベース変更

- `JournalEntry` テーブルを新規追加（Device に紐づく）
- 既存の `WishlistItem.completedAt`、`Step.completedAt` を活用

### ナビゲーション変更

- タブナビゲーションの構成変更（タイムライン | HOME | Settings）
- スワイプでタブ間を移動可能に

## Impact

- **影響するspecs**:
  - `mobile-home`: HOMEからタイムラインへの導線追加
  - `timeline`: 新規capability（本変更で追加）

- **影響するコード**:
  - `apps/mobile/app/(tabs)/_layout.tsx`: タブ構成の変更
  - `apps/mobile/app/(tabs)/timeline.tsx`: 新規画面
  - `prisma/schema.prisma`: JournalEntry テーブル追加
  - `apps/server/src/procedures/user/v1/`: タイムラインAPI追加
  - `apps/server/src/repositories/`: JournalRepository追加

## 非機能要件

- ジャーナルエントリーは1エントリーあたり最大5000文字まで
- タイムラインは最新50件をデフォルト表示、スクロールで追加読み込み
- オフライン時はローカルに保存し、オンライン復帰時に同期
