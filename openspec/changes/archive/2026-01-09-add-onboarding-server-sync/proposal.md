# Change: オンボーディングデータのサーバー同期

## Why

現在、オンボーディングで収集したデータ（カテゴリー、ウィッシュリストアイテム、ステップ、今月やること、通知設定）はすべてローカルストレージ（AsyncStorage）にのみ保存されている。Device ID に紐づけてサーバーに保存することで、データの永続化とバックアップを実現する必要がある。

## What Changes

- **API バージョニング**: パスベースのバージョニング（`/api/user/v1/rpc/*`）を導入
- **アプリバージョン追跡**: X-App-Version, X-OS-Version ヘッダーでクライアント情報を収集
- **DB スキーマ追加**: Category, WishlistItem, Step, MonthlyGoal, UserSettings テーブルを追加
- **Repository 層**: 新規テーブルに対応する repository を作成
- **認証済み Procedure**: `requireDevice` + `requireTermsAgreement` を使用した CRUD Procedures を作成
- **オンボーディング完了 API**: 一括でデータをサーバーに保存する `completeOnboarding` procedure を作成
- **AI ステップ提案**: OpenRouter SDK を使用した LLM 連携でアイテムに対するステップを AI が提案
- **モバイルアプリ連携**: `OnboardingProvider` を更新してサーバーにデータを送信、モック提案を AI 提案に置き換え

## Impact

- **新規 Spec**:
  - `api-versioning` - パスベースの API バージョニング
  - `wishlist` - ウィッシュリストアイテム・カテゴリー・ステップ管理
  - `onboarding` - オンボーディングデータ同期
  - `user-settings` - ユーザー設定管理
  - `ai-step-suggestion` - AI によるステップ提案
- **影響するコード**:
  - `prisma/schema.prisma` - テーブル追加
  - `apps/server/src/routes/user/rpc.ts` - バージョニング対応
  - `apps/server/src/procedures/user/v1/` - v1 router（既存 procedure 移動）
  - `apps/server/src/repositories/` - 5ファイル新規
  - `apps/server/src/services/llm-provider.service.ts` - LLM 抽象化層（新規）
  - `apps/server/src/services/step-suggestion.service.ts` - ステップ提案サービス（新規）
  - `apps/mobile/src/services/orpc-client.ts` - API URL 更新（v1）
  - `apps/mobile/src/providers/OnboardingProvider.tsx` - サーバー連携追加
  - `apps/mobile/app/(onboarding)/terms.tsx` - agreeToTerms 呼び出し追加
  - `apps/mobile/app/(onboarding)/steps.tsx` - AI 提案 API 呼び出しに変更
