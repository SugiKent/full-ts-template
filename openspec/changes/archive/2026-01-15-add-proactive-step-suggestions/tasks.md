# Tasks: add-proactive-step-suggestions

## 1. データベース

- [ ] 1.1 `StepSuggestion` モデルを `prisma/schema.prisma` に追加
- [ ] 1.2 マイグレーションを実行 (`pnpm prisma migrate dev`)
- [ ] 1.3 Prisma Client を再生成

## 2. サーバー: Repository 層

- [ ] 2.1 `step-suggestion.repository.ts` を作成
  - `findById` - 候補を ID で取得（adopt 時に使用）
  - `findByItemId` - アイテムの候補一覧取得
  - `countByItemId` - アイテムの候補数取得
  - `create` - 候補を作成
  - `createMany` - 候補を一括作成
  - `deleteById` - 候補を削除
  - `deleteByItemId` - アイテムの候補を全削除

## 3. サーバー: Service 層

- [ ] 3.1 `step-suggestion.service.ts` を拡張
  - `generateSuggestionsForItem` - アイテムに対して候補を生成
  - `ensureSuggestions` - 候補が不足していれば補充
  - `shouldEnqueueReplenishJob` - 重複ジョブ排除（Redis デバウンス）

## 4. サーバー: Procedure 層

- [ ] 4.1 `step-suggestion.ts` に以下を追加
  - `listByItemId` - アイテムのステップ候補一覧取得
  - `adopt` - 候補を採用（Step に変換）+ 補充ジョブをエンキュー
  - `dismiss` - 候補を却下（削除）+ 補充ジョブをエンキュー
  - `regenerate` - 候補を再生成
- [ ] 4.2 `wishlist-item.ts` を修正
  - `create` 時にステップ候補生成ジョブをエンキュー
  - `update` 時にタイトル変更があれば候補再生成ジョブをエンキュー
  - `getById` で候補も含めて返却
- [ ] 4.3 `step.ts` を修正
  - ステップ完了時に候補更新ジョブをエンキュー

## 5. サーバー: Worker 層

- [ ] 5.1 `job-queue.service.ts` にキュー名を追加
  - `STEP_SUGGESTION_QUEUE` を定義
- [ ] 5.2 `apps/worker/src/step-suggestion-worker.ts` を作成
  - `processStepSuggestionJob` ハンドラを実装
  - ジョブタイプに応じた処理分岐（generate/regenerate/replenish/update）
  - AI API 呼び出しとフォールバック処理
  - エラーハンドリングとリトライ設定

## 6. サーバー: テスト

- [ ] 6.1 Repository のユニットテスト
- [ ] 6.2 Procedure の統合テスト
- [ ] 6.3 Worker のユニットテスト

## 7. モバイルアプリ: 型定義

- [ ] 7.1 `StepSuggestion` 型を `types/wishlist.ts` に追加
- [ ] 7.2 `WishlistItem` 型に `suggestions` プロパティを追加

## 8. モバイルアプリ: API クライアント

- [ ] 8.1 oRPC クライアントにステップ候補関連のメソッドを追加

## 9. モバイルアプリ: UI

- [ ] 9.1 `ItemDetailSheet.tsx` を修正
  - ステップ候補セクションを追加
  - 候補をタップで採用する機能
  - 候補をスワイプで却下する機能
  - 候補がない場合のローディング表示
- [ ] 9.2 ローディング/エラー状態のハンドリング

## 10. 統合テスト

- [ ] 10.1 E2E: アイテム作成後に候補が生成されることを確認（Worker 処理後）
- [ ] 10.2 E2E: 候補採用でステップに変換されることを確認

## 11. ドキュメント

- [ ] 11.1 API ドキュメントを更新
