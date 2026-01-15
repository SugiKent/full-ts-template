# ai-step-suggestion Specification

## Purpose
TBD - created by archiving change add-onboarding-server-sync. Update Purpose after archive.
## Requirements
### Requirement: LLM Provider Abstraction

システムは LLM API へのアクセスを抽象化するサービスを提供しなければならない（SHALL）。

- OpenRouter SDK を使用して複数の LLM モデルにアクセス可能でなければならない（MUST）
- JSON Schema を使用した Structured Outputs をサポートしなければならない（SHALL）
- リクエストとレスポンスをログに出力しなければならない（SHALL）
- 環境変数 `OPENROUTER_API_KEY` で API キーを設定しなければならない（MUST）

#### Scenario: JSON 形式のレスポンスを要求

- **WHEN** `sendChatRequestWithJsonResponse` が呼び出される
- **AND** JSON Schema が指定される
- **THEN** OpenRouter API に Structured Outputs リクエストが送信される
- **AND** JSON 形式のレスポンスが返却される

#### Scenario: API エラー時のハンドリング

- **WHEN** OpenRouter API がエラーを返す
- **THEN** エラーがログに出力される
- **AND** 適切なエラーメッセージで例外がスローされる

### Requirement: Step Suggestion Service

システムはウィッシュリストアイテムに対するステップを AI が提案するサービスを提供しなければならない（SHALL）。

- アイテムのタイトルとカテゴリーを入力として受け取らなければならない（MUST）
- 5〜10 個の具体的で実行可能なステップを提案しなければならない（SHALL）
- 既存のステップがある場合は重複を避けなければならない（SHALL）
- 完了済みステップがある場合は進捗を踏まえた次のアクションを提案しなければならない（SHALL）
- 既存の未採用候補（StepSuggestion）がある場合はそれらとも重複を避けなければならない（SHALL）
- 日本語で提案を生成しなければならない（MUST）

#### Scenario: オンボーディング時のステップ提案（初期提案）

- **WHEN** `suggestStepsForItem` が呼び出される
- **AND** アイテムタイトル「ヨーロッパ旅行に行く」とカテゴリー「travel」が指定される
- **AND** `completedSteps` が空または未指定である
- **THEN** 旅行の初期段階に適した具体的なステップが 5〜10 個返却される
- **AND** 各ステップには title が含まれる

#### Scenario: 進捗後の次のアクション提案

- **WHEN** `suggestStepsForItem` が呼び出される
- **AND** `completedSteps` に「パスポートの有効期限を確認」「航空券の相場を調べる」が含まれる
- **THEN** 完了済みステップを踏まえた次の段階のステップが提案される
- **AND** 例えば「宿泊先を予約する」「現地ツアーを検討する」など進んだ内容が含まれる
- **AND** 完了済みステップと同じ内容は提案されない

#### Scenario: 既存ステップとの重複回避

- **WHEN** `suggestStepsForItem` が呼び出される
- **AND** 既存ステップ「パスポートを確認する」が指定される
- **THEN** 提案されるステップに「パスポートを確認する」は含まれない

#### Scenario: 既存候補との重複回避

- **WHEN** `suggestStepsForItem` が呼び出される
- **AND** 既存候補（StepSuggestion）「航空券を予約する」がある
- **THEN** 提案されるステップに「航空券を予約する」は含まれない

### Requirement: Step Suggestion Procedure

システムはステップ提案を oRPC Procedure として公開しなければならない（SHALL）。

- エンドポイントは `/api/user/v1/rpc` 配下で提供しなければならない（MUST）
- `requireDevice` と `requireTermsAgreement` ミドルウェアで保護しなければならない（MUST）
- 入力として itemTitle, categoryIds, existingSteps（任意）, completedSteps（任意）を受け取らなければならない（SHALL）
- 出力として steps 配列を返却しなければならない（SHALL）

#### Scenario: 認証済みリクエストでステップ提案を取得

- **WHEN** 認証済みデバイスが `suggestSteps` API を呼び出す
- **AND** itemTitle と categoryIds が提供される
- **THEN** AI が生成したステップ提案が返却される

#### Scenario: 完了済みステップを含むリクエスト

- **WHEN** 認証済みデバイスが `suggestSteps` API を呼び出す
- **AND** completedSteps が提供される
- **THEN** 完了済みステップを踏まえた次のアクションが提案される

#### Scenario: 未認証リクエストの拒否

- **WHEN** 未認証のリクエストが `suggestSteps` API を呼び出す
- **THEN** 401 UNAUTHORIZED エラーが返却される

### Requirement: Mobile App AI Step Integration

モバイルアプリはオンボーディングのステップ画面で AI 提案 API を使用しなければならない（SHALL）。

- steps.tsx 画面で AI 提案 API を呼び出さなければならない（SHALL）
- ローディング中はスケルトン UI を表示しなければならない（SHALL）
- API エラー時はフォールバックとしてモック提案を使用しなければならない（SHALL）
- 提案取得後はユーザーがステップを選択可能でなければならない（SHALL）

#### Scenario: ステップ画面での AI 提案取得

- **WHEN** ユーザーがステップ選択画面に遷移する
- **THEN** 現在のアイテムに対する AI ステップ提案 API が呼び出される
- **AND** ローディング中はスケルトン UI が表示される
- **AND** 提案が取得されたらステップ一覧が表示される

#### Scenario: API エラー時のフォールバック

- **WHEN** AI ステップ提案 API がエラーを返す
- **THEN** モック提案（MOCK_STEP_PROPOSALS）がフォールバックとして使用される
- **AND** ユーザーは引き続きステップを選択可能

### Requirement: Proactive Suggestion Generation

システムはステップ候補を事前生成し、ユーザーが即座に選択できるようにしなければならない（SHALL）。

- ステップ候補は `StepSuggestion` テーブルに保存しなければならない（MUST）
- 各アイテムに対して5個程度の候補を事前に生成しなければならない（SHALL）
- 候補生成はすべて Worker による非同期処理で行わなければならない（SHALL）
- 候補生成ジョブは以下のタイミングでエンキューしなければならない（SHALL）：
  - アイテム作成時（type: 'generate'）
  - アイテムタイトル更新時（type: 'regenerate'）
  - ステップ完了時（type: 'update'）
  - ステップ候補採用/却下時（候補が2個以下になった場合、type: 'replenish'）

#### Scenario: アイテム作成時の候補生成ジョブ

- **WHEN** 新しいウィッシュリストアイテムが作成される
- **THEN** 候補生成ジョブ（type: 'generate'）がキューに追加される
- **AND** Worker が非同期で5個のステップ候補を生成する
- **AND** 候補は `StepSuggestion` テーブルに保存される

#### Scenario: タイトル更新時の候補再生成ジョブ

- **WHEN** アイテムのタイトルが更新される
- **THEN** 候補再生成ジョブ（type: 'regenerate'）がキューに追加される
- **AND** Worker が非同期で既存候補を削除し、新規に5個生成する

#### Scenario: ステップ完了時の候補更新ジョブ

- **WHEN** ステップが完了としてマークされる
- **THEN** 候補更新ジョブ（type: 'update'）がキューに追加される
- **AND** Worker が非同期で候補を更新する
- **AND** UIはブロックされない

#### Scenario: 候補採用時の補充ジョブ

- **WHEN** ステップ候補が採用される
- **AND** 残り候補数が2個以下になる
- **THEN** 候補補充ジョブ（type: 'replenish'）がキューに追加される
- **AND** Worker が非同期で候補を補充する
- **AND** UIはブロックされない

### Requirement: Suggestion Generation with Context

システムはステップ候補生成時にアイテムの進捗状況を考慮しなければならない（SHALL）。

- 完了済みステップの情報をプロンプトに含めなければならない（SHALL）
- 既存の未採用候補との重複を避けなければならない（SHALL）
- 採用済みのステップ（Step テーブル）との重複を避けなければならない（SHALL）

#### Scenario: 進捗を踏まえた候補生成

- **WHEN** 候補補充が必要になる
- **AND** アイテムに完了済みステップ「パスポートを確認」がある
- **THEN** 次の段階のステップ候補が生成される（例：「航空券を予約」「宿を探す」）
- **AND** 完了済みステップと同じ内容は候補に含まれない

#### Scenario: 既存候補との重複回避

- **WHEN** 候補補充が必要になる
- **AND** 既存候補に「旅行保険を検討する」がある
- **THEN** 新しく生成される候補に「旅行保険を検討する」は含まれない

