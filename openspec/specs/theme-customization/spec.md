# theme-customization Specification

## Purpose
TBD - created by archiving change add-settings-screen. Update Purpose after archive.
## Requirements
### Requirement: プリセットテーマ

システムは4つのプリセットテーマを提供しなければならない（SHALL）。

| テーマID | 名称 | 主要カラー |
|---------|------|-----------|
| `warm` | Default (Warm) | amber系 |
| `cool` | Cool | blue/slate系 |
| `nature` | Nature | emerald系 |
| `minimal` | Minimal | gray系 |

- デフォルトテーマは `warm` でなければならない（MUST）
- 各テーマは背景色、プライマリカラー、セカンダリカラー、テキストカラー等を定義しなければならない（SHALL）

#### Scenario: プリセットテーマの選択肢

- **WHEN** ユーザーが設定画面のテーマセクションを開く
- **THEN** 4つのプリセットテーマが選択肢として表示される
- **AND** 現在選択中のテーマがハイライトされる

### Requirement: テーマ選択UI

設定画面でテーマを選択するUIを提供しなければならない（SHALL）。

- 各テーマはカラーサンプルとテーマ名で表示しなければならない（SHALL）
- 選択中のテーマは視覚的に区別できなければならない（MUST）
- タップで即座にテーマが切り替わらなければならない（SHALL）

#### Scenario: テーマの切り替え

- **WHEN** ユーザーがテーマをタップして選択する
- **THEN** 選択したテーマがハイライトされる
- **AND** 設定画面のカラーが即座に切り替わる
- **AND** アプリ全体のカラーが切り替わる

### Requirement: テーマの永続化

選択したテーマは永続化され、アプリ再起動後も維持されなければならない（SHALL）。

- テーマ設定は AsyncStorage にローカル保存しなければならない（SHALL）
- テーマ設定はサーバーの UserSettings に同期しなければならない（SHALL）
- オフライン時はローカル保存のみ行い、オンライン復帰時に同期しなければならない（SHALL）

#### Scenario: テーマ設定の保存

- **WHEN** ユーザーがテーマを変更する
- **THEN** 新しいテーマIDが AsyncStorage に保存される
- **AND** バックグラウンドで UserSettings API が呼び出される

#### Scenario: アプリ再起動後のテーマ復元

- **WHEN** アプリが起動される
- **THEN** AsyncStorage から保存済みテーマIDが読み込まれる
- **AND** 保存されたテーマが適用される
- **AND** サーバーの設定と同期される

#### Scenario: オフライン時のテーマ変更

- **WHEN** オフライン状態でテーマを変更する
- **THEN** ローカルに変更が保存される
- **AND** UIは即座に更新される
- **AND** オンライン復帰時にサーバーと同期される

### Requirement: テーマプロバイダー

アプリ全体でテーマを共有するためのコンテキストプロバイダーを提供しなければならない（SHALL）。

- `ThemeProvider` コンポーネントを提供しなければならない（MUST）
- `useTheme` フックでテーマ情報にアクセス可能でなければならない（MUST）
- テーマ変更は全画面に即座に反映されなければならない（SHALL）

#### Scenario: テーマコンテキストの使用

- **WHEN** コンポーネントが `useTheme()` フックを使用する
- **THEN** 現在のテーマIDが取得できる
- **AND** テーマカラークラス群が取得できる
- **AND** `setTheme` 関数でテーマを変更できる

### Requirement: 全画面へのテーマ適用

選択したテーマはアプリの全画面に適用されなければならない（SHALL）。

適用対象：
- Home画面（SwipeNavigator）
- カテゴリーページ
- タイムラインページ
- 設定画面
- ボトムシート類（アイテム詳細、作成フォーム等）
- ページインジケーター

#### Scenario: Home画面へのテーマ適用

- **WHEN** テーマが変更される
- **THEN** Home画面の背景色が変更される
- **AND** 「今月やること」セクションのアクセントカラーが変更される
- **AND** ボタンやリンクのカラーが変更される

#### Scenario: ボトムシートへのテーマ適用

- **WHEN** テーマが変更される
- **AND** ボトムシート（アイテム詳細等）が開かれる
- **THEN** シートのアクセントカラーがテーマに準拠する
- **AND** ボタンカラーがテーマに準拠する

### Requirement: 起動時のちらつき防止

アプリ起動時にテーマ読み込みによる画面のちらつきを防止しなければならない（SHALL）。

- スプラッシュスクリーン表示中にテーマを読み込まなければならない（SHALL）
- テーマ読み込み完了後にメイン画面を表示しなければならない（SHALL）

#### Scenario: テーマ読み込み中の表示

- **WHEN** アプリが起動する
- **THEN** スプラッシュスクリーンが表示される
- **AND** バックグラウンドでテーマ設定が読み込まれる
- **AND** 読み込み完了後にメイン画面が正しいテーマで表示される

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

