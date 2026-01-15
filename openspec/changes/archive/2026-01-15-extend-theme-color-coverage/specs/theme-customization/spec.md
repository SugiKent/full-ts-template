## ADDED Requirements

### Requirement: テーマカラートークンの拡張

テーマシステムは、UI要素全体をカバーするための追加カラートークンを提供しなければならない（SHALL）。

- `progressBar` - 進捗バーのフォアグラウンド色を定義しなければならない（MUST）
- `progressBarBg` - 進捗バーの背景色を定義しなければならない（MUST）
- `success` - 完了・成功状態の背景色を定義しなければならない（MUST）
- `successText` - 完了・成功状態のテキスト色を定義しなければならない（MUST）
- `cardActive` - カードの active 状態を定義しなければならない（MUST）
- `badgeBg` - バッジの背景色を定義しなければならない（MUST）
- `badgeText` - バッジのテキスト色を定義しなければならない（MUST）
- `divider` - ディバイダーの色を定義しなければならない（MUST）
- `iconBg` - アイコン背景色を定義しなければならない（MUST）
- `iconColor` - アイコンの Hex カラーを定義しなければならない（MUST）

#### Scenario: テーマ切り替え時のトークン一括適用

- **WHEN** ユーザーがテーマを変更する
- **THEN** すべての拡張トークンが新しいテーマの値に更新される
- **AND** 対応するすべてのUIコンポーネントに即座に反映される

### Requirement: WishlistItemCard のテーマ対応

WishlistItemCard コンポーネントはテーマカラーを使用しなければならない（SHALL）。

- テキスト色はテーマの `text` および `textMuted` を使用しなければならない（MUST）
- 完了状態のテキストスタイルはテーマに基づいて表示しなければならない（MUST）
- ボーダー色はテーマの `border` を使用しなければならない（MUST）
- 「今月やること」バッジはテーマの `badgeBg` および `badgeText` を使用しなければならない（MUST）
- 進捗インジケーターはテーマの `progressBar` および `progressBarBg` を使用しなければならない（MUST）
- 完了チェックマーク背景はテーマの `primary` を使用しなければならない（MUST）

#### Scenario: 通常アイテムの表示

- **WHEN** 未完了のウィッシュリストアイテムが表示される
- **THEN** タイトルはテーマの `text` 色で表示される
- **AND** 進捗インジケーターはテーマの `progressBar` / `progressBarBg` で表示される

#### Scenario: 完了アイテムの表示

- **WHEN** 完了したウィッシュリストアイテムが表示される
- **THEN** タイトルはテーマの `textMuted` 色で取り消し線付きで表示される
- **AND** チェックマーク背景はテーマの `primary` 色で表示される

#### Scenario: 今月やることバッジの表示

- **WHEN** 今月の目標に設定されたアイテムが表示される
- **THEN** バッジ背景はテーマの `badgeBg` で表示される
- **AND** バッジテキストはテーマの `badgeText` で表示される

### Requirement: ItemDetailSheet のテーマ対応

ItemDetailSheet コンポーネントはテーマカラーを使用しなければならない（SHALL）。

- タイトルテキストはテーマの `text` を使用しなければならない（MUST）
- カテゴリータグはテーマの `badgeBg` および `badgeText` を使用しなければならない（MUST）
- 進捗カードはテーマの `primary` を使用しなければならない（MUST）
- ステップリストはテーマカラーを使用しなければならない（MUST）
- 「ステップを追加」ボタンはテーマの `border` を使用しなければならない（MUST）
- AI提案セクションはテーマの `badgeBg` および `badgeText` を使用しなければならない（MUST）

#### Scenario: 進捗カードの表示

- **WHEN** アイテム詳細シートが表示される
- **THEN** 進捗カードの CircularProgress はテーマの `primaryHex` を使用する

#### Scenario: ステップリストのチェックボックス

- **WHEN** ステップのチェックボックスが完了状態になる
- **THEN** チェックボックス背景はテーマの `primary` で表示される

#### Scenario: AI提案セクションの表示

- **WHEN** AI提案セクションが表示される
- **THEN** 背景はテーマの `badgeBg` で表示される
- **AND** テキストはテーマの `badgeText` で表示される

### Requirement: MonthlyGoalCard のテーマ対応

MonthlyGoalCard コンポーネントはテーマカラーを使用しなければならない（SHALL）。

- カード背景はテーマの `background` を使用しなければならない（MUST）
- カードボーダーはテーマの `cardBorder` を使用しなければならない（MUST）
- テキストはテーマの `text` を使用しなければならない（MUST）
- 完了バッジはテーマの `primary` を使用しなければならない（MUST）
- 進捗インジケーターはテーマの `primaryHex` を使用しなければならない（MUST）

#### Scenario: カードの色がテーマに連動

- **WHEN** 「今月やること」カードが表示される
- **THEN** カード背景・ボーダー・テキストはテーマカラーで表示される
- **AND** 進捗インジケーターはテーマの `primaryHex` を使用する

### Requirement: TimelineEntryCard のテーマ対応

TimelineEntryCard コンポーネントはテーマカラーを部分的に使用しなければならない（SHALL）。

- ジャーナルカードのアイコン背景はテーマの `iconBg` を使用しなければならない（MUST）
- ジャーナルカードのテキスト色はテーマの `text` および `textMuted` を使用しなければならない（MUST）
- ジャーナルカードのボーダーはテーマの `border` を使用しなければならない（MUST）
- アイテム完了カードは緑系の固定色を維持してもよい（MAY）
- ステップ完了カードは青系の固定色を維持してもよい（MAY）

#### Scenario: ジャーナルカードのテーマ適用

- **WHEN** ジャーナルエントリーが表示される
- **THEN** アイコン背景はテーマの `iconBg` で表示される
- **AND** タイトルはテーマの `text` で表示される
- **AND** コンテンツはテーマの `textMuted` で表示される

### Requirement: 日付セパレーターとディバイダーのテーマ対応

日付セパレーターおよびディバイダーはテーマカラーを使用しなければならない（SHALL）。

- ライン色はテーマの `divider` を使用しなければならない（MUST）
- テキスト色はテーマの `textMuted` を使用しなければならない（MUST）

#### Scenario: 日付セパレーターの表示

- **WHEN** タイムラインの日付セパレーターが表示される
- **THEN** 左右のラインはテーマの `divider` で表示される
- **AND** 日付テキストはテーマの `textMuted` で表示される

### Requirement: CategorySection のテーマ対応

CategorySection コンポーネントはテーマカラーを使用しなければならない（SHALL）。

- セクションタイトルはテーマの `text` を使用しなければならない（MUST）
- アイテム間のディバイダーはテーマの `divider` を使用しなければならない（MUST）

#### Scenario: カテゴリーセクションの表示

- **WHEN** カテゴリーセクションが表示される
- **THEN** セクションタイトルはテーマの `text` で表示される
- **AND** アイテム間のディバイダーはテーマの `divider` で表示される
