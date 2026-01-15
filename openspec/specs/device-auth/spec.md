# Device Auth Specification

## Purpose

モバイルアプリのデバイスID認証システム。アカウント登録なしで即座にアプリを利用開始できる匿名認証を提供する。
## Requirements
### Requirement: Device Registration

システムはモバイルアプリの初回起動時に、デバイスを自動的に登録してアクセストークンを発行しなければならない（SHALL）。

- Device ID はクライアント側で UUID v4 を生成しなければならない（MUST）
- Device ID はセキュアストレージ（iOS Keychain / Android EncryptedSharedPreferences）に保存しなければならない（MUST）
- サーバーに Device ID を送信し、アクセストークンを取得しなければならない（SHALL）
- アクセストークンは 90 日間有効でなければならない（SHALL）

#### Scenario: 新規デバイス登録成功

- **WHEN** アプリが初回起動され、Device ID が存在しない
- **THEN** 新しい UUID v4 が生成される
- **AND** Device ID がセキュアストレージに保存される
- **AND** サーバーに registerDevice API が呼び出される
- **AND** アクセストークンが返却され、セキュアストレージに保存される

#### Scenario: 既存デバイスの認証

- **WHEN** アプリが起動され、Device ID とアクセストークンが存在する
- **THEN** サーバーでトークンが検証される
- **AND** トークンが有効な場合、認証済み状態になる

### Requirement: Access Token Management

システムはアクセストークンの発行、検証、更新を管理しなければならない（SHALL）。

- トークンは crypto.randomBytes(32) で生成しなければならない（MUST）
- トークンは Device テーブルと 1:N のリレーションを持たなければならない（SHALL）
- 有効期限は 90 日でなければならない（SHALL）
- 期限切れトークンは自動更新可能でなければならない（SHALL）

#### Scenario: トークン検証成功

- **WHEN** Authorization ヘッダーに有効なトークンが含まれる
- **THEN** トークンが検証される
- **AND** context.device にデバイス情報が設定される
- **AND** Device の lastSeenAt が更新される

#### Scenario: トークン期限切れ

- **WHEN** アクセストークンの有効期限が切れている
- **THEN** 401 Unauthorized エラーが返される
- **AND** クライアントは refreshToken API を呼び出す
- **AND** 新しいアクセストークンが発行される

#### Scenario: トークン更新

- **WHEN** refreshToken API が有効な Device ID で呼び出される
- **THEN** 古いトークンは revoked としてマークされる
- **AND** 新しいアクセストークンが発行される

### Requirement: Device Context

システムは認証されたデバイス情報を oRPC コンテキストで利用可能にしなければならない（SHALL）。

- ORPCContext に device フィールドを追加しなければならない（MUST）
- requireDevice ミドルウェアで認証チェックを行わなければならない（SHALL）
- Procedures は context.device からデバイス情報を取得しなければならない（SHALL）

#### Scenario: 認証必須エンドポイントへのアクセス

- **WHEN** requireDevice ミドルウェアが適用されたエンドポイントにリクエストが来る
- **AND** 有効なアクセストークンが含まれない
- **THEN** 401 UNAUTHORIZED エラーが返される

#### Scenario: 認証済みリクエスト

- **WHEN** requireDevice ミドルウェアが適用されたエンドポイントにリクエストが来る
- **AND** 有効なアクセストークンが含まれる
- **THEN** context.device にデバイス情報が設定される
- **AND** Procedure が実行される

### Requirement: Mobile Auth State Management

モバイルアプリは認証状態を管理する AuthProvider を提供しなければならない（SHALL）。

- deviceId: 現在のデバイス ID を保持しなければならない（MUST）
- isAuthenticated: 認証済みかどうかを示さなければならない（MUST）
- isLoading: 認証処理中かどうかを示さなければならない（MUST）
- refreshAuth: 認証状態を更新する関数を提供しなければならない（SHALL）

#### Scenario: アプリ起動時の認証初期化

- **WHEN** アプリが起動される
- **THEN** isLoading が true になる
- **AND** セキュアストレージから deviceId と accessToken を取得
- **AND** トークンが存在する場合はサーバーで検証
- **AND** トークンがない/無効な場合は registerDevice を呼び出し
- **AND** 認証完了後、isLoading が false、isAuthenticated が true になる

#### Scenario: 認証エラー時のリトライ

- **WHEN** 認証処理中にネットワークエラーが発生
- **THEN** error 状態が設定される
- **AND** refreshAuth 関数で再試行可能

### Requirement: デバイスデータ削除 API

システムは認証済みデバイスのすべてのデータを削除する API を提供しなければならない（SHALL）。

#### Scenario: デバイスデータ削除成功

- **WHEN** 認証済みデバイスが `deleteDeviceData` API を呼び出す
- **THEN** Device レコードが削除される
- **AND** 関連するすべてのデータが Cascade 削除される
  - DeviceAccessToken
  - UserSettings
  - Category
  - WishlistItem（Step, WishlistItemCategory を含む）
  - MonthlyGoal
- **AND** `{ success: true }` が返される

#### Scenario: 未認証リクエストの拒否

- **WHEN** 未認証リクエストが `deleteDeviceData` API を呼び出す
- **THEN** 401 Unauthorized エラーが返される
- **AND** データは削除されない

#### Scenario: 削除失敗時のエラーハンドリング

- **WHEN** データベースエラーが発生する
- **THEN** 500 Internal Server Error が返される
- **AND** エラーがログに記録される

