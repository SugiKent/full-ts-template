# device-auth Spec Delta

## ADDED Requirements

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
