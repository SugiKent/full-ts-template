# タスク一覧: オンボーディングデータのサーバー同期

## 1. API バージョニング

- [ ] 1.1 `apps/server/src/procedures/user/v1/` ディレクトリ作成
- [ ] 1.2 既存の `device-auth.ts` を v1/ に移動
- [ ] 1.3 `apps/server/src/procedures/user/v1/index.ts` で v1 Router 作成
- [ ] 1.4 `apps/server/src/procedures/user/index.ts` を後方互換用に更新（v1 を re-export）
- [ ] 1.5 `apps/server/src/routes/user/rpc.ts` にバージョニングルート追加（`/v1/rpc/*`）
- [ ] 1.6 X-App-Version, X-OS-Version ヘッダーの抽出とログ出力を追加

## 2. DB スキーマ追加

- [ ] 2.1 `prisma/schema.prisma` に Category, WishlistItem, WishlistItemCategory, Step, MonthlyGoal, UserSettings テーブルを追加
- [ ] 2.2 Device モデルに新しいリレーションを追加
- [ ] 2.3 `pnpm run db:generate` で Prisma クライアント生成
- [ ] 2.4 `pnpm exec prisma migrate dev --name add-wishlist-tables` でマイグレーション実行

## 3. 共有型定義

- [ ] 3.1 `packages/shared/src/schemas/wishlist.ts` に Zod スキーマ作成
- [ ] 3.2 `packages/shared/src/types/wishlist.ts` に型定義作成
- [ ] 3.3 `packages/shared/src/index.ts` でエクスポート

## 4. Repository 層

- [ ] 4.1 `apps/server/src/repositories/category.repository.ts` 作成
- [ ] 4.2 `apps/server/src/repositories/wishlist-item.repository.ts` 作成
- [ ] 4.3 `apps/server/src/repositories/step.repository.ts` 作成
- [ ] 4.4 `apps/server/src/repositories/monthly-goal.repository.ts` 作成
- [ ] 4.5 `apps/server/src/repositories/user-settings.repository.ts` 作成

## 5. oRPC Procedures（v1）

### 5.1 オンボーディング用 API
- [ ] 5.1.1 `apps/server/src/procedures/user/v1/onboarding.ts` 作成（completeOnboarding - 一括保存）
- [ ] 5.1.2 `apps/server/src/procedures/user/v1/step-suggestion.ts` 作成（AI ステップ提案）

### 5.2 オンボーディング後の CRUD API（ホーム画面以降で使用）
- [ ] 5.2.1 `apps/server/src/procedures/user/v1/category.ts` 作成（CRUD）
- [ ] 5.2.2 `apps/server/src/procedures/user/v1/wishlist-item.ts` 作成（CRUD）
- [ ] 5.2.3 `apps/server/src/procedures/user/v1/step.ts` 作成（CRUD）
- [ ] 5.2.4 `apps/server/src/procedures/user/v1/monthly-goal.ts` 作成

### 5.3 Router 統合
- [ ] 5.3.1 `apps/server/src/procedures/user/v1/index.ts` に全 Router 統合

## 6. AI ステップ提案サービス

- [ ] 6.1 `@openrouter/sdk` パッケージを server に追加
- [ ] 6.2 `apps/server/src/services/llm-provider.service.ts` 作成（LLM 抽象化層）
  - OpenRouter SDK ラッパー
  - JSON Schema を使用した Structured Outputs
  - リクエスト/レスポンスのロギング
- [ ] 6.3 `apps/server/src/services/step-suggestion.service.ts` 作成
  - システムプロンプト設計
  - JSON Schema 定義
  - レスポンスのバリデーションと正規化
- [ ] 6.4 `.env.example` に `OPENROUTER_API_KEY` を追加

## 7. モバイルアプリ連携

- [ ] 7.1 `apps/mobile/src/services/orpc-client.ts` の API URL を `/api/user/v1/rpc` に更新
- [ ] 7.2 `apps/mobile/src/services/orpc-client.ts` に X-App-Version, X-OS-Version ヘッダー追加
- [ ] 7.3 `apps/mobile/app/(onboarding)/terms.tsx` で `agreeToTerms` API 呼び出し追加
- [ ] 7.4 `apps/mobile/app/(onboarding)/steps.tsx` をモック提案から AI 提案 API 呼び出しに変更
- [ ] 7.5 `apps/mobile/src/providers/OnboardingProvider.tsx` の `completeOnboarding` 関数を更新
- [ ] 7.6 エラーハンドリング（ネットワークエラー時のリトライ UI）
- [ ] 7.7 AI 提案のローディング状態 UI

## 8. 検証

- [ ] 8.1 `pnpm run typecheck` 実行
- [ ] 8.2 `pnpm run lint` 実行
- [ ] 8.3 `pnpm run build` 実行
- [ ] 8.4 オンボーディングフローの動作確認
- [ ] 8.5 AI ステップ提案の動作確認
