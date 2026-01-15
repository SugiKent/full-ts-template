# Onboarding Specification

## Purpose

モバイルアプリのオンボーディングフロー仕様。初回起動時にユーザーを段階的にセットアップへ誘導し、カテゴリー選択からウィッシュリスト作成までの初期設定を完了させる。
## Requirements
### Requirement: Onboarding Flow

システムは8ステップのオンボーディングフローを提供しなければならない（SHALL）。

- ステップ順序: Splash → Introduction → Terms → Categories → Items → Monthly Goals → Steps → Notifications
- 各ステップで次に進めるかどうかの条件を満たす必要がある（MUST）
- オンボーディング完了後はホーム画面に遷移する（SHALL）

#### Scenario: オンボーディングフロー完走

- **WHEN** ユーザーが初回起動でオンボーディングを開始する
- **THEN** Splash → Introduction → Terms → Categories → Items → Monthly Goals → Steps → Notifications の順に進む
- **AND** 最後のステップ完了後にホーム画面に遷移する
- **AND** オンボーディング完了フラグが保存される

#### Scenario: オンボーディング途中からの再開

- **WHEN** ユーザーがオンボーディング途中でアプリを閉じる
- **AND** 再度アプリを起動する
- **THEN** 前回の進捗から再開できる

### Requirement: Splash Screen

システムはアニメーション付きのスプラッシュ画面を表示しなければならない（SHALL）。

- ロゴとタグラインを表示（SHALL）
- 2秒後に自動で次の画面に遷移（SHALL）

#### Scenario: スプラッシュ表示

- **WHEN** アプリが初回起動される
- **THEN** アニメーション付きスプラッシュ画面が表示される
- **AND** 2秒後に Introduction 画面に遷移する

### Requirement: Introduction Screen

システムはサービス紹介のカルーセルを表示しなければならない（SHALL）。

- 4枚のスライドでサービスの特徴を紹介（SHALL）
- スキップボタンで次の画面に進める（SHALL）

#### Scenario: イントロダクション表示

- **WHEN** ユーザーが Introduction 画面を表示する
- **THEN** 4枚のスライドが表示される
- **AND** スワイプまたは「スキップ」ボタンで次に進める

### Requirement: Terms Acceptance

システムは利用規約とプライバシーポリシーへの同意を取得しなければならない（MUST）。

- 利用規約への同意チェックボックス（必須）
- プライバシーポリシーへの同意チェックボックス（必須）
- 両方にチェックがないと次に進めない（MUST）

#### Scenario: 利用規約同意

- **WHEN** ユーザーが Terms 画面を表示する
- **THEN** 利用規約とプライバシーポリシーのチェックボックスが表示される
- **AND** 両方にチェックを入れると次のボタンが有効になる

### Requirement: Category Selection

システムはプリセットカテゴリーからの選択を提供しなければならない（SHALL）。

- 10個のプリセットカテゴリーを表示（旅行、スキル習得、趣味、健康、キャリア、お金、人間関係、自己投資、体験、その他）
- 複数選択可能（SHALL）
- 最低1つ選択しないと次に進めない（MUST）
- 各カテゴリーにはアイコン（絵文字）とタイトルがある（SHALL）

#### Scenario: カテゴリー選択

- **WHEN** ユーザーが Categories 画面を表示する
- **THEN** 10個のプリセットカテゴリーがグリッド表示される
- **AND** タップで選択/解除ができる
- **AND** 1つ以上選択すると次に進める

### Requirement: Item Creation

システムはウィッシュリストアイテムの作成を提供しなければならない（SHALL）。

- タイトル入力（必須）
- カテゴリー選択（複数可、最低1つ必須）
- 連続作成しやすいUI（SHALL）
- 作成済みアイテムの削除が可能（SHALL）

#### Scenario: アイテム作成

- **WHEN** ユーザーが Items 画面を表示する
- **THEN** アイテム作成フォームとリストが表示される
- **AND** タイトルとカテゴリーを入力してアイテムを追加できる
- **AND** 作成済みアイテムは一覧表示され、削除も可能

#### Scenario: アイテム未作成での進行禁止

- **WHEN** アイテムが1つも作成されていない
- **THEN** 次のステップに進めない

### Requirement: Monthly Goals Selection

システムは今月やることの選択を提供しなければならない（SHALL）。

- 作成したアイテムから最大10個を選択（SHALL）
- 最低1つ選択しないと次に進めない（MUST）
- 選択数の制限（最大10個）を超える場合は警告（SHALL）

#### Scenario: 今月やること選択

- **WHEN** ユーザーが Monthly Goals 画面を表示する
- **THEN** 作成済みアイテム一覧が表示される
- **AND** タップで選択/解除ができる
- **AND** 選択数が表示される（例: 3/10）

### Requirement: Step Selection

システムは各月間目標に対するステップ選択を提供しなければならない（SHALL）。

- 各アイテムに対してAI提案の5ステップを表示（SHALL）
- 「もっとやれる！」ボタンで追加5ステップを表示（SHALL）
- 各アイテムで最低1つのステップを選択しないと次に進めない（MUST）
- 現在はモックデータを使用（将来的にAI連携予定）

#### Scenario: ステップ選択

- **WHEN** ユーザーが Steps 画面を表示する
- **THEN** 月間目標ごとにAI提案ステップが表示される
- **AND** チェックボックスでステップを選択できる
- **AND** 「もっとやれる！」で追加ステップが表示される

#### Scenario: ステップ未選択での進行禁止

- **WHEN** いずれかの月間目標にステップが選択されていない
- **THEN** 次のステップに進めない

### Requirement: Notification Frequency Selection

システムは通知頻度の選択を提供しなければならない（SHALL）。

- 4つの頻度オプション: 毎日、3日に1回、毎週末、月末
- 1つ選択しないと完了できない（MUST）

#### Scenario: 通知頻度選択

- **WHEN** ユーザーが Notifications 画面を表示する
- **THEN** 4つの通知頻度オプションが表示される
- **AND** 1つ選択して「完了」を押すとオンボーディングが完了する

### Requirement: State Persistence

システムはオンボーディング状態をローカルストレージに永続化しなければならない（SHALL）。

- AsyncStorage に状態を保存（SHALL）
- アプリ再起動時に状態を復元（SHALL）
- 完了フラグは別キーで管理（SHALL）

#### Scenario: 状態保存

- **WHEN** オンボーディング状態が変更される
- **THEN** AsyncStorage に状態が保存される

#### Scenario: 状態復元

- **WHEN** アプリが起動される
- **THEN** AsyncStorage から状態が復元される
- **AND** 完了済みの場合はホーム画面に遷移する

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

