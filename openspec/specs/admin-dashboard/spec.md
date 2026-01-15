# Admin Dashboard Specification

## Purpose

管理画面ダッシュボードの仕様。システム管理者向けに統計データの可視化とジョブ管理機能を提供し、サービスの運用状況を把握できるようにする。

## Requirements

### Requirement: Dashboard Statistics

システムは管理画面にダッシュボード統計を表示しなければならない（SHALL）。

- 統計データは oRPC Procedure で取得しなければならない（SHALL）
- 統計データへのアクセスは 'admin' または 'counselor' ロールに制限されなければならない（MUST）
- 現在は totalUsers のみを返す（将来的に拡張予定）

#### Scenario: 統計データ取得

- **WHEN** 認証済み管理者がダッシュボードを表示する
- **THEN** getDashboardStats API が呼び出される
- **AND** 統計データ（totalUsers）が表示される

#### Scenario: 権限不足でのアクセス拒否

- **WHEN** 'admin' または 'counselor' 以外のロールのユーザーが統計を取得しようとする
- **THEN** 403 Forbidden エラーが返される

### Requirement: Test Job Management

システムはテストジョブをキューに追加する機能を提供しなければならない（SHALL）。

- テストジョブの追加は 'admin' ロールのみ許可（MUST）
- ジョブは bee-queue を通じてワーカーに送信される（SHALL）
- ジョブ ID と成功メッセージを返却する（SHALL）

#### Scenario: テストジョブ追加成功

- **WHEN** 管理者がテストジョブ追加ボタンをクリックする
- **THEN** addTestJob API が呼び出される
- **AND** ジョブがキューに追加される
- **AND** ジョブ ID と成功メッセージが返却される

#### Scenario: テストジョブ処理

- **WHEN** テストジョブがキューに追加される
- **THEN** ワーカーがジョブを受信する
- **AND** 2秒のシミュレート処理後に完了する

#### Scenario: 非管理者によるジョブ追加拒否

- **WHEN** 'admin' 以外のロールのユーザーがジョブを追加しようとする
- **THEN** 403 Forbidden エラーが返される

### Requirement: Dashboard UI

管理画面ダッシュボードは統計カードとクイックアクションを表示しなければならない（SHALL）。

- 統計カードで主要な数値を視覚的に表示（SHALL）
- クイックアクションボタンで主要な操作を提供（SHALL）
- Notion風ミニマルデザインを適用（SHALL）

#### Scenario: ダッシュボード表示

- **WHEN** 認証済み管理者がダッシュボードにアクセスする
- **THEN** 統計カードが表示される
- **AND** クイックアクションボタンが表示される
- **AND** ユーザー名と「ログアウト」ボタンがヘッダーに表示される
