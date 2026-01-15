## ADDED Requirements

### Requirement: Onboarding Data Synchronization

システムはオンボーディング完了時にすべてのデータをサーバーに同期しなければならない（SHALL）。

- オンボーディングデータは一括でトランザクション保存しなければならない（MUST）
- 保存データには categories, items, monthlyGoals, stepsByItem, notificationFrequency を含まなければならない（SHALL）
- クライアント ID からサーバー ID へのマッピングを返却しなければならない（SHALL）
- 認証済み（requireDevice + requireTermsAgreement）Procedure として実装しなければならない（SHALL）

#### Scenario: オンボーディング完了成功

- **WHEN** 認証済みデバイスが completeOnboarding API を呼び出す
- **AND** 有効なオンボーディングデータが提供される
- **THEN** トランザクション内で以下が実行される
  - Category がプリセット ID に基づいて作成される
  - WishlistItem が作成される
  - WishlistItemCategory が作成される
  - MonthlyGoal が現在月で作成される
  - Step がアイテムごとに作成される
  - UserSettings が作成される
- **AND** クライアント ID とサーバー ID のマッピングが返却される

#### Scenario: オンボーディング完了失敗時のロールバック

- **WHEN** オンボーディング保存中にエラーが発生する
- **THEN** トランザクションがロールバックされる
- **AND** エラーメッセージが返却される
- **AND** クライアント側でリトライ可能な状態が維持される

### Requirement: Onboarding Flow Integration

モバイルアプリのオンボーディングフローはサーバーと連携しなければならない（SHALL）。

- terms 画面で利用規約同意時に agreeToTerms API を呼び出さなければならない（SHALL）
- notifications 画面完了時に completeOnboarding API を呼び出さなければならない（SHALL）
- エラー発生時はリトライ UI を表示しなければならない（SHALL）
- サーバーを Single Source of Truth として扱わなければならない（MUST）
- オンボーディング中のデータは React state で一時保持しなければならない（SHALL）

#### Scenario: 利用規約同意のサーバー記録

- **WHEN** ユーザーが terms 画面で同意ボタンを押す
- **THEN** agreeToTerms API が呼び出される
- **AND** Device.hasAgreedToTerms が true に設定される
- **AND** Device.termsAgreedAt が現在日時に設定される
- **AND** 次のステップに進む

#### Scenario: オンボーディング完了時のサーバー保存

- **WHEN** ユーザーが notifications 画面で設定を完了する
- **THEN** completeOnboarding API が呼び出される
- **AND** サーバーにすべてのオンボーディングデータが保存される
- **AND** UserSettings.onboardingCompletedAt が設定される
- **AND** ホーム画面に遷移する

#### Scenario: ネットワークエラー時のリトライ

- **WHEN** completeOnboarding API 呼び出し時にネットワークエラーが発生する
- **THEN** エラーダイアログが表示される
- **AND** リトライボタンが提供される
- **AND** React state にはデータが保持されている

### Requirement: Onboarding Display Condition

アプリ起動時にオンボーディング画面を表示するかどうかを判定しなければならない（SHALL）。

- 認証後にサーバーから WishlistItem の件数を取得しなければならない（MUST）
- WishlistItem が 0 件の場合はオンボーディング画面を表示しなければならない（SHALL）
- WishlistItem が 1 件以上の場合はホーム画面を表示しなければならない（SHALL）
- UserSettings.onboardingCompletedAt は記録用であり、判定には使用しない（SHALL NOT）

#### Scenario: ウィッシュリストアイテムがないユーザーのアプリ起動

- **WHEN** アプリが起動される
- **AND** 認証が完了する
- **AND** サーバーの WishlistItem が 0 件
- **THEN** オンボーディング画面に遷移する

#### Scenario: ウィッシュリストアイテムがあるユーザーのアプリ起動

- **WHEN** アプリが起動される
- **AND** 認証が完了する
- **AND** サーバーの WishlistItem が 1 件以上
- **THEN** ホーム画面に遷移する
