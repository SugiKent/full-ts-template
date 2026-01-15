# Tasks: extend-theme-color-coverage

## 1. テーマカラートークンの拡張

- [x] 1.1 `apps/mobile/src/constants/theme.ts` に新しいカラートークンを追加
  - `cardActive` - カードの active 状態
  - `badgeBg` / `badgeText` - バッジ用
  - `divider` / `dividerHex` / `dividerBorder` - ディバイダー用
  - `iconBg` / `iconColor` - アイコン用
- [x] 1.2 全16テーマに新しいトークンの値を定義
- [x] 1.3 TypeScript 型は自動的に更新（`ThemeColors` は `Theme['colors']` の推論型）

## 2. WishlistItemCard のテーマ対応

- [x] 2.1 `useTheme()` フックをインポート
- [x] 2.2 テキスト色をテーマ対応に変更
  - 未完了アイテム: `colors.text`
  - 完了アイテム: `colors.textMuted`
- [x] 2.3 ボーダー色を `colors.dividerBorder` に変更
- [x] 2.4 「今月やること」バッジを `colors.badgeText` に変更
- [x] 2.5 進捗インジケーターの色を `colors.primaryHex` / `colors.dividerHex` に変更
- [x] 2.6 完了チェックマーク背景を `colors.primary` に変更

## 3. ItemDetailSheet のテーマ対応

- [x] 3.1 タイトルテキスト色を `colors.text` に変更
- [x] 3.2 カテゴリータグを `colors.badgeBg` / `colors.badgeText` に変更
- [x] 3.3 進捗カード内の CircularProgress を `colors.primaryHex` に変更
- [x] 3.4 ステップリストのチェックボックス背景を `colors.primary` に変更
- [x] 3.5 「ステップを追加」ボタンのボーダーを `colors.border` に変更
- [x] 3.6 AI提案セクションを `colors.badgeBg` / `colors.badgeText` に変更
- [x] 3.7 AI提案チェックボックスのスタイルをテーマ対応に変更
- [x] 3.8 SwipeableSuggestionItem のスタイルをテーマ対応に変更

## 4. MonthlyGoalCard のテーマ対応

- [x] 4.1 `useTheme()` フックをインポート
- [x] 4.2 固定カラーパレット（`CARD_COLORS`）を削除し、テーマ対応に変更
- [x] 4.3 カード背景を `colors.badgeBg` に変更
- [x] 4.4 カードボーダーを `colors.cardBorder` に変更
- [x] 4.5 テキスト色を `colors.text` に変更
- [x] 4.6 完了バッジを `colors.primary` に変更
- [x] 4.7 進捗インジケーターを `colors.primaryHex` に変更

## 5. TimelineEntryCard のテーマ対応

- [x] 5.1 `useTheme()` フックをインポート
- [x] 5.2 JournalCard のアイコン背景を `colors.iconBg` に変更
- [x] 5.3 JournalCard のテキスト色を `colors.text` / `colors.textMuted` に変更
- [x] 5.4 JournalCard のボーダーを `colors.dividerBorder` に変更
- [x] 5.5 ItemCompletedCard はグリーン系固定色を維持（テーマ非対応）
- [x] 5.6 StepCompletedCard はブルー系固定色を維持（テーマ非対応）

## 6. 日付セパレーターのテーマ対応

- [x] 6.1 `TimelinePage.tsx` の DateSeparator コンポーネントにテーマ適用
- [x] 6.2 ライン色を `colors.divider` に変更
- [x] 6.3 テキスト色を `colors.textMuted` に変更

## 7. CategorySection のテーマ対応

- [x] 7.1 セクションタイトル色を `colors.text` に変更
- [x] 7.2 アイコン背景を `colors.badgeBg` に変更

## 8. 動作確認

- [ ] 8.1 各テーマでHome画面の表示を確認（実機テスト）
- [ ] 8.2 各テーマでアイテム詳細シートの表示を確認（実機テスト）
- [ ] 8.3 各テーマでタイムライン画面の表示を確認（実機テスト）
- [ ] 8.4 テーマ切り替え時の即時反映を確認（実機テスト）
- [x] 8.5 TypeScript のビルドエラーがないことを確認
- [x] 8.6 Biome の lint / format エラーがないことを確認
