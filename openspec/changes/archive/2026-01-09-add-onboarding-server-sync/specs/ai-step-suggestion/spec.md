## ADDED Requirements

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
