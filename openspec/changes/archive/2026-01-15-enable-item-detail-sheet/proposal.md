# Proposal: enable-item-detail-sheet

## 概要

ウィッシュリストアイテム詳細シートモーダル（ItemDetailSheet）をサーバーAPIと連携し、完全に動的に機能するようにする。現在モックデータとローカルstateで動作している箇所を、実際のAPIコールに置き換える。

## 背景

現在の`ItemDetailSheet`コンポーネントは以下の課題がある：

1. **モックデータ依存**: `mockWishlistItems`からローカルstateを生成し、変更がサーバーに永続化されない
2. **API未連携**: 編集・削除・ステップ操作のハンドラはあるが、サーバーAPIを呼び出していない
3. **AIステップ提案未実装**: 「もっとステップを提案」ボタンがあるが、AI APIを呼び出していない

## 対象機能

1. **アイテム編集** - タイトルの変更をサーバーに反映
2. **アイテム削除** - サーバーからアイテムを削除
3. **ステップの追加** - 新しいステップをサーバーに作成
4. **ステップの完了トグル** - ステップの完了状態をサーバーに反映
5. **ステップの削除** - サーバーからステップを削除
6. **AIによるステップ提案** - 既存のステップ/完了済みステップを踏まえて新しいステップを提案

## 技術的アプローチ

### モバイルアプリ側の変更

1. **oRPC Client を使用したAPI呼び出し**
   - `orpcClient.item.update()` - アイテム更新
   - `orpcClient.item.delete()` - アイテム削除
   - `orpcClient.step.create()` - ステップ作成
   - `orpcClient.step.toggleComplete()` - ステップ完了トグル
   - `orpcClient.step.delete()` - ステップ削除
   - `orpcClient.ai.suggest()` - AIステップ提案

2. **ItemDetailSheet の props 拡張**
   - `onItemUpdate` - アイテム更新後のコールバック
   - `onItemDelete` - アイテム削除後のコールバック

3. **楽観的更新（Optimistic Update）**
   - APIレスポンスを待たずにUIを即時更新
   - エラー時はロールバック

4. **ローディング/エラー状態の表示**
   - 操作中のフィードバック
   - エラー発生時のトースト表示

### 状態管理

- 現在の`HomePageContent`のローカルstateは維持しつつ、API呼び出し後に状態を同期
- 将来的にはサーバーからのデータ取得に完全移行予定（別change）

## スコープ外

- サーバーAPIの変更（既に必要なAPIは実装済み）
- データ取得のAPI化（別changeで対応予定）

## 依存関係

- **必須**: 既存のサーバーAPIエンドポイント
  - `item.update`, `item.delete`
  - `step.create`, `step.toggleComplete`, `step.delete`
  - `ai.suggest`

## リスク

- **オフライン時の挙動**: APIが失敗した場合のUX（エラートーストで対応）
- **競合状態**: 同時操作時のデータ整合性（楽観的更新とロールバックで対応）
