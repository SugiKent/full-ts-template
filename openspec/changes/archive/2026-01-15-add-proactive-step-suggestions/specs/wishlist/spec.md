## ADDED Requirements

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
