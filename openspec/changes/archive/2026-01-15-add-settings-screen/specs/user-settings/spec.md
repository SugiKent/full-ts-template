# user-settings Specification (Delta)

## ADDED Requirements

### Requirement: テーマ設定の永続化

UserSettings にテーマ設定（themeId）を追加し、永続化しなければならない（SHALL）。

- `themeId` フィールドを UserSettings に追加しなければならない（MUST）
- 値は16種類のプリセットテーマIDのいずれかでなければならない（MUST）
  - ウォーム系: `honey`, `sunset`, `coffee`
  - クール系: `ocean`, `sky`, `mint`
  - ナチュラル系: `forest`, `lime`
  - ロマンティック系: `sakura`, `rose`, `lavender`, `grape`
  - モノトーン系: `stone`, `slate`, `midnight`
- デフォルト値は `'honey'` でなければならない（MUST）
- `getSettings` API でテーマ設定を取得可能でなければならない（SHALL）
- `updateSettings` API でテーマ設定を更新可能でなければならない（SHALL）

#### Scenario: テーマ設定の取得

- **WHEN** 認証済みデバイスが `getSettings` API を呼び出す
- **THEN** 現在のテーマIDが含まれた設定が返却される
- **AND** テーマIDが設定されていない場合は `'honey'` が返却される

#### Scenario: テーマ設定の更新

- **WHEN** 認証済みデバイスが `updateSettings` API を `{ themeId: 'sakura' }` で呼び出す
- **THEN** テーマ設定が `'sakura'` に更新される
- **AND** 更新された設定が返却される

#### Scenario: 無効なテーマIDの拒否

- **WHEN** 認証済みデバイスが `updateSettings` API を無効な `themeId` で呼び出す
- **THEN** バリデーションエラーが返却される
- **AND** 設定は更新されない
