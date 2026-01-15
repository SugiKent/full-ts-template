# mobile-home Spec Delta

## ADDED Requirements

### Requirement: Home画面データ取得

Home画面はサーバー API からリアルタイムデータを取得しなければならない（SHALL）。

#### Scenario: Home画面の初期データ取得

- **WHEN** ユーザーがHome画面を開く
- **THEN** `getHomeData` API が呼び出される
- **AND** ローディング表示が表示される
- **AND** データ取得後にアイテムとカテゴリーが表示される

#### Scenario: Home画面のエラー表示

- **WHEN** `getHomeData` API がエラーを返す
- **THEN** エラーメッセージが表示される
- **AND** リトライボタンが表示される

#### Scenario: 月次目標の表示

- **WHEN** Home画面が表示される
- **AND** アイテムに `monthlyGoals` が紐づいている
- **AND** `monthlyGoals.targetMonth` が現在月である
- **THEN** 「今月やること」セクションにそのアイテムが表示される

### Requirement: Pull To Refresh

Home画面で Pull To Refresh 操作によりデータを再取得できなければならない（SHALL）。

#### Scenario: Pull To Refresh によるデータ更新

- **WHEN** ユーザーがHome画面を下方向に引っ張る
- **THEN** リフレッシュインジケーターが表示される
- **AND** `getHomeData` API が呼び出される
- **AND** 最新データで画面が更新される

#### Scenario: Pull To Refresh 中のエラー

- **WHEN** Pull To Refresh 中に API がエラーを返す
- **THEN** エラートーストが表示される
- **AND** 既存のデータは保持される

### Requirement: デバッグ機能アクセス

Home画面左上を3回連打するとデバッグ画面が表示されなければならない（SHALL）。

#### Scenario: デバッグ画面の表示

- **WHEN** ユーザーがHome画面の左上エリアを500ms以内に3回タップする
- **THEN** フルスクリーンのデバッグ画面が表示される
- **AND** デバイス情報（deviceId, platform, 作成日時）が表示される
- **AND** 「すべてのデータを削除」ボタンが表示される
- **AND** 右上に閉じるボタンが表示される

#### Scenario: 通常タップではデバッグ画面が表示されない

- **WHEN** ユーザーがHome画面の左上エリアを1回または2回タップする
- **THEN** デバッグ画面は表示されない

### Requirement: デバッグ画面からのデータ削除

デバッグ画面からデバイスに紐づくすべてのデータを削除できなければならない（SHALL）。

#### Scenario: データ削除の実行

- **WHEN** ユーザーがデバッグ画面で「すべてのデータを削除」ボタンをタップする
- **THEN** 確認ダイアログが表示される（「本当に削除しますか？」）
- **AND** 「削除」を選択すると `deleteDeviceData` API が呼び出される
- **AND** SecureStore から deviceId、accessToken、expiresAt が削除される
- **AND** AsyncStorage から ONBOARDING_COMPLETED が削除される
- **AND** オンボーディング画面にリダイレクトされる

#### Scenario: データ削除のキャンセル

- **WHEN** ユーザーが確認ダイアログで「キャンセル」を選択する
- **THEN** データは削除されない
- **AND** デバッグ画面に留まる
