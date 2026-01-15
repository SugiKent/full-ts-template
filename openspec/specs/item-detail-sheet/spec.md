# item-detail-sheet Specification

## Purpose
TBD - created by archiving change enable-item-detail-sheet. Update Purpose after archive.
## Requirements
### Requirement: AIステップ提案機能

アイテム詳細シートからAIによるステップ提案を利用できなければならない（SHALL）。

- 「もっとステップを提案」ボタンでAI提案APIを呼び出さなければならない（SHALL）
- 既存のステップと完了済みステップを踏まえた提案を取得しなければならない（SHALL）
- 提案されたステップから選択して追加できなければならない（SHALL）
- ローディング中はスケルトンUIを表示しなければならない（SHALL）

#### Scenario: AI提案の取得

- **WHEN** ユーザーが「もっとステップを提案」ボタンを押す
- **THEN** ローディングUIが表示される
- **AND** AI提案APIが呼び出される
- **AND** 既存ステップと完了済みステップが提案APIに送信される

#### Scenario: AI提案からステップ追加

- **WHEN** AI提案が表示される
- **AND** ユーザーが提案されたステップを選択する
- **AND** 追加ボタンを押す
- **THEN** 選択されたステップがサーバーAPIで作成される
- **AND** ステップリストに追加される

#### Scenario: AI提案APIエラー

- **WHEN** AI提案APIがエラーを返す
- **THEN** エラーメッセージが表示される
- **OR** デフォルトのフォールバック提案が表示される

