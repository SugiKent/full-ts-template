## ADDED Requirements

### Requirement: Wishlist Category Management

システムはユーザーが選択したカテゴリーを Device に紐づけて管理しなければならない（SHALL）。

- カテゴリーは Device ID に紐づかなければならない（MUST）
- プリセットカテゴリー（travel, skill, hobby 等）は presetId フィールドで識別しなければならない（MUST）
- カテゴリーには title, icon, description（任意）, sortOrder を持たなければならない（SHALL）
- カテゴリーの CRUD 操作は認証済み Procedure で提供しなければならない（SHALL）

#### Scenario: カテゴリー一覧取得

- **WHEN** 認証済みデバイスが listCategories API を呼び出す
- **THEN** そのデバイスに紐づくカテゴリー一覧が sortOrder 順で返却される

#### Scenario: カテゴリー作成

- **WHEN** 認証済みデバイスが createCategory API を呼び出す
- **AND** title と icon が提供される
- **THEN** 新しいカテゴリーが作成される
- **AND** 作成されたカテゴリーの ID が返却される

#### Scenario: カテゴリー削除時のカスケード

- **WHEN** カテゴリーが削除される
- **THEN** 関連する WishlistItemCategory も削除される

### Requirement: Wishlist Item Management

システムはウィッシュリストアイテムを Device に紐づけて管理しなければならない（SHALL）。

- アイテムは Device ID に紐づかなければならない（MUST）
- アイテムは複数のカテゴリーに属することができなければならない（SHALL）
- アイテムには title, isCompleted, completedAt, sortOrder を持たなければならない（SHALL）
- アイテムの CRUD 操作は認証済み Procedure で提供しなければならない（SHALL）

#### Scenario: アイテム一覧取得

- **WHEN** 認証済みデバイスが listItems API を呼び出す
- **THEN** そのデバイスに紐づくアイテム一覧が返却される
- **AND** 各アイテムのカテゴリー情報も含まれる

#### Scenario: アイテム作成

- **WHEN** 認証済みデバイスが createItem API を呼び出す
- **AND** title と categoryIds が提供される
- **THEN** 新しいアイテムが作成される
- **AND** WishlistItemCategory 中間テーブルにカテゴリー紐づけが作成される

#### Scenario: アイテム完了

- **WHEN** 認証済みデバイスが completeItem API を呼び出す
- **THEN** isCompleted が true に設定される
- **AND** completedAt が現在日時に設定される

#### Scenario: アイテム削除時のカスケード

- **WHEN** アイテムが削除される
- **THEN** 関連する WishlistItemCategory, Step, MonthlyGoal も削除される

### Requirement: Server-Side Step Management

システムはアイテムに紐づくステップをサーバーサイドで管理しなければならない（SHALL）。

- ステップは WishlistItem に紐づかなければならない（MUST）
- ステップには title, isCompleted, completedAt, isAiGenerated, sortOrder を持たなければならない（SHALL）
- ステップの CRUD 操作は認証済み Procedure で提供しなければならない（SHALL）

#### Scenario: ステップ一覧取得

- **WHEN** 認証済みデバイスが listSteps API を呼び出す
- **AND** itemId が提供される
- **THEN** そのアイテムに紐づくステップ一覧が sortOrder 順で返却される

#### Scenario: ステップ完了

- **WHEN** 認証済みデバイスが completeStep API を呼び出す
- **THEN** isCompleted が true に設定される
- **AND** completedAt が現在日時に設定される

#### Scenario: AI 生成ステップの識別

- **WHEN** ステップが AI によって提案されたものである場合
- **THEN** isAiGenerated が true に設定される

### Requirement: Monthly Goal Management

システムは今月やること（月間目標）を管理しなければならない（SHALL）。

- 月間目標は Device と WishlistItem に紐づかなければならない（MUST）
- 月間目標は yearMonth（'YYYY-MM' 形式）で月を識別しなければならない（SHALL）
- 同じ Device、Item、yearMonth の組み合わせは一意でなければならない（MUST）
- 月間目標の設定・取得は認証済み Procedure で提供しなければならない（SHALL）

#### Scenario: 月間目標設定

- **WHEN** 認証済みデバイスが setMonthlyGoals API を呼び出す
- **AND** itemIds と yearMonth が提供される
- **THEN** 指定された月の月間目標が設定される
- **AND** 既存の月間目標は削除されて新しいものに置き換えられる

#### Scenario: 月間目標取得

- **WHEN** 認証済みデバイスが getMonthlyGoals API を呼び出す
- **AND** yearMonth が提供される（省略時は現在月）
- **THEN** 指定された月の月間目標一覧が返却される
- **AND** 各目標に紐づくアイテム情報も含まれる
