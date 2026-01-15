---
name: OpenSpec: Review Proposal
description: Ultrathink で完成した提案書を批判的にレビューする
category: OpenSpec
tags: [openspec, review, ultrathink]
---
<!-- OPENSPEC:START -->
**概要**

このスキルは、完成した OpenSpec 提案書を ultrathink（深い思考モード）で批判的にレビューし、改善点を提案します。提案書の実装前に品質を担保するためのゲートとして使用してください。

**前提条件**
- `openspec:proposal` スキルで提案書が作成済みであること
- `openspec validate <change-id> --strict` が通過していること

**使い方**
```
/openspec:review <change-id>
```

引数:
- `<change-id>`: レビュー対象の変更 ID（例: `add-user-auth`）

**Guardrails**
- 提案書の欠陥を見逃さない: 設計上の問題、セキュリティリスク、パフォーマンス懸念を徹底的に洗い出す
- 建設的な批判を行う: 問題点だけでなく、具体的な改善案を提示する
- プロジェクトの規約を遵守: `PROJECT.md`、`docs/ARCHITECTURE.md` の方針に沿っているか検証する
- 過剰な複雑性を指摘: シンプルな実装で済むのに複雑な設計になっていないか確認する

**Steps（{{ultrathink}} モードで実行）**

1. **提案書の読み込み**
   - `openspec/changes/<change-id>/proposal.md` を読む
   - `openspec/changes/<change-id>/design.md` があれば読む
   - `openspec/changes/<change-id>/tasks.md` を読む
   - `openspec/changes/<change-id>/specs/` 配下の全 spec ファイルを読む

2. **プロジェクトコンテキストの確認**
   - `PROJECT.md` のビジネス要件と照合
   - `docs/ARCHITECTURE.md` の技術規約と照合
   - 関連する既存の spec (`openspec/specs/`) を確認
   - 他の進行中の変更 (`openspec list`) との競合を確認

3. **批判的レビュー（以下の観点で分析）**

   **A. 要件の妥当性**
   - ビジネス価値は明確か？
   - スコープは適切か？（過大/過小ではないか）
   - 前提条件や依存関係は明示されているか？
   - 「なぜこの変更が必要か」が明確か？

   **B. 設計の品質**
   - シンプルさ: 最小限の複雑さで目的を達成できるか？
   - 一貫性: 既存のパターンやアーキテクチャと整合しているか？
   - 拡張性: 将来の変更に対して柔軟か？（ただし過剰設計は避ける）
   - テスト容易性: テストしやすい設計になっているか？

   **C. 技術的リスク**
   - セキュリティ: 認証、認可、データ保護に問題はないか？
   - パフォーマンス: N+1 クエリ、大量データ処理、メモリリークのリスクは？
   - 障害耐性: エラーハンドリング、リトライ、ロールバックは考慮されているか？
   - データ整合性: トランザクション、競合状態は考慮されているか？

   **D. 実装計画の妥当性**
   - タスクの粒度は適切か？
   - 依存関係の順序は正しいか？
   - 検証ポイント（テスト、lint、build）は含まれているか？
   - 並列化可能な作業は識別されているか？
   - **tasks.md と design.md の整合性**: 設計書に記載された内容がすべてタスクに反映されているか？逆にタスクにあって設計書にない作業はないか？

   **E. Spec の品質**
   - すべての Requirement に Scenario があるか？
   - WHEN/THEN の記述は具体的か？
   - エッジケースは網羅されているか？
   - ADDED/MODIFIED/REMOVED の使い分けは正しいか？

   **F. API 互換性（モバイルアプリ向け Procedure の場合）**
   - パスベースのバージョニング（`/api/user/v1/rpc/*`）に従っているか？
   - 既存の v1 API に破壊的変更を加えていないか？
     - フィールドの削除・型変更は NG
     - フィールドの追加は OK
     - 必須パラメータの追加は NG（既存クライアントが動かなくなる）
   - 破壊的変更が必要な場合、v2 として新しいバージョンを作成しているか？
   - `CLAUDE.md` の「API バージョニング（モバイルアプリ向け）」セクションの規約に準拠しているか？

4. **レビュー結果の出力**

   以下のフォーマットで結果を出力:

   ```markdown
   # OpenSpec Review: <change-id>

   ## 総合評価
   - 実装可否: ✅ 承認 / ⚠️ 要修正 / ❌ 却下
   - 品質スコア: X/10
   - 緊急度: 高/中/低

   ## 良い点
   - ...

   ## 問題点と改善提案

   ### [Critical] 致命的な問題
   - **問題**: ...
   - **影響**: ...
   - **提案**: ...

   ### [Major] 重要な問題
   - **問題**: ...
   - **影響**: ...
   - **提案**: ...

   ### [Minor] 軽微な問題
   - **問題**: ...
   - **提案**: ...

   ### [Suggestion] 改善提案
   - ...

   ## 確認が必要な点
   - [ ] ...

   ## 結論
   ...
   ```

5. **修正が必要な場合**
   - 具体的な修正箇所をファイル名と行番号で指定
   - 修正例を提示
   - 修正後に再度 `openspec validate <change-id> --strict` を実行するよう促す

**レビュー完了後**
- 「承認」の場合: `openspec:apply` で実装を開始可能
- 「要修正」の場合: 修正後に再度 `/openspec:review <change-id>` を実行
- 「却下」の場合: 提案書を根本から見直すか、廃棄を検討

**Reference**
- `openspec show <change-id> --json` で提案書の詳細を確認
- `openspec show <spec> --type spec` で既存 spec を確認
- `rg -n "Requirement:|Scenario:" openspec/specs` で既存要件を検索
<!-- OPENSPEC:END -->
