# Wishlist Specification

## Purpose

ウィッシュリスト管理機能の仕様。ユーザーが自分の目標や夢をカテゴリー別に整理し、アイテム、ステップ、月間目標として管理・追跡できるようにする。
## Requirements
### Requirement: Category Management

システムはウィッシュリストカテゴリーを管理しなければならない（SHALL）。

- カテゴリーはタイトル（必須）、アイコン（絵文字）、説明（任意）を持つ（SHALL）
- プリセットカテゴリー10種を提供（旅行、スキル習得、趣味、健康、キャリア、お金、人間関係、自己投資、体験、その他）
- ユーザーはカスタムカテゴリーを作成可能（SHALL）
- カテゴリーの編集・削除が可能（SHALL）
- 現在はローカルストレージで管理（将来的にサーバー同期予定）

#### Scenario: カテゴリー一覧表示

- **WHEN** ホーム画面を表示する
- **THEN** ユーザーが選択したカテゴリー一覧が表示される
- **AND** 各カテゴリーにはアイコンとタイトルが表示される

#### Scenario: カスタムカテゴリー作成

- **WHEN** ユーザーがカテゴリー作成フォームを開く
- **AND** タイトルとアイコンを入力する
- **THEN** 新しいカテゴリーが作成される

#### Scenario: カテゴリー編集

- **WHEN** ユーザーがカテゴリーをタップしてシートモーダルを開く
- **AND** 編集を選択する
- **THEN** タイトル、アイコン、説明を編集できる

### Requirement: Item Management

システムはウィッシュリストアイテムを管理しなければならない（SHALL）。

- アイテムはタイトル（必須）、カテゴリー（複数選択可、最低1つ必須）を持つ（MUST）
- アイテムは複数のカテゴリーに所属可能（SHALL）
- アイテムの作成、編集、削除が可能（SHALL）
- アイテムの完了マーク・取り消しが可能（SHALL）
- 現在はローカルストレージで管理（将来的にサーバー同期予定）

#### Scenario: アイテム作成

- **WHEN** ユーザーがアイテム作成フォームを開く
- **AND** タイトルとカテゴリーを入力する
- **THEN** 新しいアイテムが作成される
- **AND** カテゴリー別の一覧に表示される

#### Scenario: アイテム完了

- **WHEN** ユーザーがアイテムをタップして詳細シートを開く
- **AND** 完了ボタンを押す
- **THEN** アイテムが完了としてマークされる
- **AND** 中線（取り消し線）で表示される

#### Scenario: アイテム完了取り消し

- **WHEN** 完了済みアイテムをタップする
- **AND** 完了取り消しを選択する
- **THEN** アイテムが未完了に戻る

#### Scenario: アイテム削除

- **WHEN** ユーザーがアイテムを削除する
- **THEN** アイテムと紐づくステップが削除される
- **AND** 月間目標からも削除される

### Requirement: Step Management

システムはアイテムに紐づくステップを管理しなければならない（SHALL）。

- ステップはタイトル（必須）を持つ（MUST）
- ステップの追加、完了、削除が可能（SHALL）
- 完了したステップは中線で表示（SHALL）
- 完了の取り消しが可能（SHALL）

#### Scenario: ステップ追加

- **WHEN** ユーザーがアイテム詳細シートでステップを追加する
- **THEN** 新しいステップがアイテムに紐づけられる

#### Scenario: ステップ完了トグル

- **WHEN** ユーザーがステップをタップする
- **THEN** 完了状態がトグルされる
- **AND** 完了したステップは中線で表示される

#### Scenario: ステップ削除

- **WHEN** ユーザーがステップを削除する
- **THEN** ステップがアイテムから削除される

### Requirement: Monthly Goals

システムは「今月やること」として月間目標を管理しなければならない（SHALL）。

- ウィッシュリストアイテムから最大10個を選択可能（SHALL）
- ホーム画面に「今月やること」セクションとして表示（SHALL）
- 進捗状況（ステップの完了率）を表示（SHALL）
- 月初めにリセット/継続の選択が可能（将来機能）

#### Scenario: 月間目標表示

- **WHEN** ホーム画面を表示する
- **THEN** 「今月やること」セクションに選択されたアイテムが表示される
- **AND** 各アイテムのステップ進捗が表示される（例: 3/5）

#### Scenario: 月間目標の追加

- **WHEN** ユーザーがアイテムを月間目標として選択する
- **AND** 選択数が10個未満である
- **THEN** アイテムが「今月やること」に追加される

#### Scenario: 月間目標数上限

- **WHEN** 既に10個の月間目標が選択されている
- **AND** ユーザーが追加で選択しようとする
- **THEN** 警告メッセージが表示される

### Requirement: Category Page Navigation

システムはカテゴリーページ間のスワイプナビゲーションを提供しなければならない（SHALL）。

- ホームページとカテゴリーページ間を左右スワイプで移動（SHALL）
- 下部にページインジケーター（絵文字タブバー）を表示（SHALL）
- フローティングアクションボタンでアイテム作成可能（SHALL）

#### Scenario: カテゴリーページスワイプ

- **WHEN** ユーザーがホーム画面で左にスワイプする
- **THEN** 最初のカテゴリーページに遷移する
- **AND** 下部タブバーの選択状態が更新される

#### Scenario: タブバーナビゲーション

- **WHEN** ユーザーがタブバーのアイコンをタップする
- **THEN** 対応するページに遷移する

### Requirement: Item Detail Sheet

システムはアイテム詳細をシートモーダルで表示しなければならない（SHALL）。

- アイテムのタイトル、カテゴリー、ステップ一覧を表示（SHALL）
- ステップの完了トグル、追加、削除が可能（SHALL）
- 画面下部から表示されるボトムシート形式（SHALL）

#### Scenario: アイテム詳細シート表示

- **WHEN** ユーザーがアイテムをタップする
- **THEN** シートモーダルが画面下部から表示される
- **AND** アイテム詳細とステップ一覧が表示される

### Requirement: Local Data Storage

システムはウィッシュリストデータをローカルストレージに保存しなければならない（SHALL）。

- カテゴリー、アイテム、ステップ、月間目標をAsyncStorageに保存（SHALL）
- アプリ起動時にデータを復元（SHALL）
- 変更時に自動保存（SHALL）

#### Scenario: データ保存

- **WHEN** ウィッシュリストデータが変更される
- **THEN** AsyncStorageに保存される

#### Scenario: データ復元

- **WHEN** アプリが起動される
- **THEN** AsyncStorageからデータが復元される

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

### Requirement: Step Suggestion Pool

システムは各ウィッシュリストアイテムに対して未採用のステップ候補プールを管理しなければならない（SHALL）。

- ステップ候補は `StepSuggestion` テーブルで管理しなければならない（MUST）
- 各アイテムに対して常に5個程度のステップ候補を保持しなければならない（SHALL）
- ステップ候補には title, description（任意）, sortOrder を持たなければならない（SHALL）
- 候補の残数が2個以下になったら自動的に補充しなければならない（SHALL）
- アイテム削除時は関連するステップ候補も削除しなければならない（MUST）

#### Scenario: ステップ候補一覧取得

- **WHEN** 認証済みデバイスが `stepSuggestion.listByItemId` API を呼び出す
- **AND** itemId が提供される
- **THEN** そのアイテムに紐づくステップ候補一覧が sortOrder 順で返却される

#### Scenario: アイテム取得時の候補同時取得

- **WHEN** 認証済みデバイスが `item.getById` API を呼び出す
- **THEN** アイテム情報とともにステップ候補一覧も返却される

### Requirement: Step Suggestion Adoption

システムはステップ候補を正式なステップとして採用する機能を提供しなければならない（SHALL）。

- 候補採用時は `StepSuggestion` から `Step` テーブルへデータを移行しなければならない（MUST）
- 採用された候補は `StepSuggestion` テーブルから削除しなければならない（MUST）
- 採用後、候補の残数が2個以下になったら補充ジョブをエンキューしなければならない（SHALL）

#### Scenario: ステップ候補を採用

- **WHEN** 認証済みデバイスが `stepSuggestion.adopt` API を呼び出す
- **AND** suggestionId が提供される
- **THEN** 該当の候補が `Step` テーブルに新規作成される
- **AND** 候補が `StepSuggestion` テーブルから削除される
- **AND** 作成された Step が返却される

#### Scenario: 採用後の候補補充トリガー

- **WHEN** ステップ候補が採用された後
- **AND** 残りの候補数が2個以下になる
- **THEN** 候補補充ジョブ（type: 'replenish'）がキューに追加される

#### Scenario: 存在しない候補の採用試行

- **WHEN** 認証済みデバイスが `stepSuggestion.adopt` API を呼び出す
- **AND** 存在しない suggestionId が提供される
- **THEN** 404 NOT_FOUND エラーが返却される

### Requirement: Step Suggestion Dismissal

システムはステップ候補を却下（削除）する機能を提供しなければならない（SHALL）。

- 却下された候補は `StepSuggestion` テーブルから削除しなければならない（MUST）
- 却下後、候補の残数が2個以下になったら補充ジョブをエンキューしなければならない（SHALL）

#### Scenario: ステップ候補を却下

- **WHEN** 認証済みデバイスが `stepSuggestion.dismiss` API を呼び出す
- **AND** suggestionId が提供される
- **THEN** 該当の候補が `StepSuggestion` テーブルから削除される
- **AND** 成功レスポンスが返却される

#### Scenario: 却下後の候補補充トリガー

- **WHEN** ステップ候補が却下された後
- **AND** 残りの候補数が2個以下になる
- **THEN** 候補補充ジョブ（type: 'replenish'）がキューに追加される

### Requirement: Automatic Suggestion Generation on Item Creation

システムはウィッシュリストアイテム作成時に自動的にステップ候補生成をトリガーしなければならない（SHALL）。

- アイテム作成完了後にステップ候補生成ジョブをキューに追加しなければならない（SHALL）
- 候補生成は Worker で非同期に処理しなければならない（SHALL）
- AI API が利用不可の場合は汎用的な候補を生成しなければならない（SHALL）

#### Scenario: アイテム作成時の候補生成ジョブエンキュー

- **WHEN** 認証済みデバイスが `item.create` API を呼び出す
- **AND** title と categoryIds が提供される
- **THEN** 新しいアイテムが作成される
- **AND** ステップ候補生成ジョブ（type: 'generate'）がキューに追加される
- **AND** アイテムが返却される（候補は非同期で生成されるため含まれない）

#### Scenario: Worker による候補生成処理

- **WHEN** Worker が候補生成ジョブ（type: 'generate'）を処理する
- **AND** itemId が指定される
- **THEN** AI API を呼び出して5個のステップ候補が生成される
- **AND** 候補が `StepSuggestion` テーブルに保存される

### Requirement: Suggestion Regeneration on Item Title Update

システムはアイテムのタイトル更新時にステップ候補の再生成をトリガーしなければならない（SHALL）。

- タイトル変更があった場合のみ再生成ジョブをエンキューしなければならない（MUST）
- Worker による処理時に既存の未採用候補は削除し、新規に生成しなければならない（SHALL）

#### Scenario: タイトル更新時の候補再生成ジョブエンキュー

- **WHEN** 認証済みデバイスが `item.update` API を呼び出す
- **AND** title が変更される
- **THEN** アイテムが更新される
- **AND** ステップ候補再生成ジョブ（type: 'regenerate'）がキューに追加される

#### Scenario: Worker による候補再生成処理

- **WHEN** Worker が候補再生成ジョブ（type: 'regenerate'）を処理する
- **AND** itemId が指定される
- **THEN** 既存のステップ候補が削除される
- **AND** 新しいタイトルに基づいて5個のステップ候補が生成される
- **AND** 候補が `StepSuggestion` テーブルに保存される

#### Scenario: タイトル以外の更新時

- **WHEN** 認証済みデバイスが `item.update` API を呼び出す
- **AND** title が変更されない
- **THEN** ステップ候補再生成ジョブはエンキューされない

### Requirement: Step Suggestion Manual Regeneration

システムはユーザーが手動でステップ候補を再生成できる機能を提供しなければならない（SHALL）。

- 既存の候補を保持したまま、新しい候補を追加しなければならない（SHALL）
- 最大候補数（5個）を超える場合は古い候補を削除しなければならない（SHALL）

#### Scenario: 候補の手動再生成

- **WHEN** 認証済みデバイスが `stepSuggestion.regenerate` API を呼び出す
- **AND** itemId が提供される
- **THEN** 現在の完了済みステップを踏まえた新しい候補が生成される
- **AND** 生成された候補一覧が返却される

### Requirement: Worker-based Suggestion Processing

システムはステップ候補の生成・補充処理を Worker で非同期に実行しなければならない（SHALL）。

- bee-queue を使用したジョブキューで処理しなければならない（MUST）
- ジョブタイプは generate/regenerate/replenish/update の4種類をサポートしなければならない（SHALL）
- AI API 呼び出し失敗時はリトライしなければならない（SHALL）
- 全リトライ失敗時はエラー通知を行わなければならない（SHALL）

#### Scenario: Worker による候補補充処理

- **WHEN** Worker が候補補充ジョブ（type: 'replenish'）を処理する
- **AND** itemId が指定される
- **THEN** 現在の候補数を確認する
- **AND** 5個になるまで新しい候補を生成する
- **AND** 既存の候補・ステップと重複しない候補が追加される

#### Scenario: ステップ完了時の候補更新トリガー

- **WHEN** ステップが完了としてマークされる
- **THEN** 候補更新ジョブ（type: 'update'）がキューに追加される

#### Scenario: Worker による候補更新処理

- **WHEN** Worker が候補更新ジョブ（type: 'update'）を処理する
- **AND** itemId が指定される
- **THEN** 完了済みステップ情報を踏まえて候補が更新される
- **AND** 既存の候補・ステップと重複しない候補が保持される

#### Scenario: AI API 呼び出し失敗時のリトライ

- **WHEN** Worker が候補生成中に AI API 呼び出しに失敗する
- **THEN** exponential backoff でリトライが実行される
- **AND** 最大4回までリトライされる

#### Scenario: 全リトライ失敗時のフォールバック

- **WHEN** AI API 呼び出しが全リトライ後も失敗する
- **THEN** エラーが Sentry に通知される
- **AND** ジョブは失敗としてマークされる

