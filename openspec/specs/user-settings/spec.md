# user-settings Specification

## Purpose
TBD - created by archiving change add-onboarding-server-sync. Update Purpose after archive.
## Requirements
### Requirement: User Settings Management

システムはユーザー設定を Device に紐づけて管理しなければならない（SHALL）。

- 設定は Device と 1:1 の関係でなければならない（MUST）
- 通知頻度（notificationFrequency）を保存しなければならない（SHALL）
- オンボーディング完了日時（onboardingCompletedAt）を記録しなければならない（SHALL）
- 設定の取得・更新は認証済み Procedure で提供しなければならない（SHALL）

#### Scenario: 設定取得

- **WHEN** 認証済みデバイスが getSettings API を呼び出す
- **THEN** そのデバイスの設定が返却される
- **AND** 設定が存在しない場合は null が返却される

#### Scenario: 設定更新

- **WHEN** 認証済みデバイスが updateSettings API を呼び出す
- **AND** 更新内容が提供される
- **THEN** 設定が更新される
- **AND** 設定が存在しない場合は新規作成される

#### Scenario: 通知頻度の設定値

- **WHEN** notificationFrequency が設定される
- **THEN** 値は 'daily', 'every3days', 'weekly', 'monthly' のいずれかでなければならない（MUST）

