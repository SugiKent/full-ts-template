---
name: プロジェクト初期化: 外部サービスドキュメント追加
description: 利用する外部サービスの仕様ドキュメントをdocs/external_tools_fixed_docs/に配置します
category: プロジェクトセットアップ
tags: [setup, docs, external-services]
---

**ガードレール**
- 外部サービスの公式ドキュメントを参照し、正確な情報を記載する
- ドキュメントは開発者が実装時に参照しやすい形式で整理する
- APIキーや認証情報などの機密情報は絶対に含めない
- すべて日本語で対話する

**概要**
このコマンドは、プロジェクトで使用する外部サービス（API、SDK、SaaS等）の
仕様ドキュメントを `docs/external_tools_fixed_docs/` ディレクトリに整理します。
AI が実装時に参照できる形式で、必要な情報を構造化して配置します。

**ステップ**

1. **PROJECT.md からの外部サービス特定**
   - `PROJECT.md` を読み込む
   - 機能要件から必要な外部サービスを洗い出す
   - ユーザーに追加で使用予定のサービスを確認する

2. **既存ドキュメントの確認**
   - `docs/external_tools_fixed_docs/` の現在の内容を確認する
   - `docs/external_tools_fixed_docs/AGENTS.md` を読み込み、ドキュメント作成規約を確認する

3. **外部サービス情報の収集**
   各サービスについて以下を質問する：
   - サービス名と用途
   - 公式ドキュメントURL
   - 使用するAPI/SDKのバージョン
   - 主に使用するエンドポイント/機能
   - 認証方式（APIキー、OAuth等）
   - レート制限や利用制約

4. **ドキュメントの作成**
   各外部サービスについて以下の構成でドキュメントを作成する：

   ```markdown
   # {サービス名} API仕様

   ## 概要
   - **用途**: このプロジェクトでの使用目的
   - **公式ドキュメント**: URL
   - **使用バージョン**: X.X.X

   ## 認証
   - 認証方式の説明
   - 環境変数名（例：`{SERVICE}_API_KEY`）

   ## 主要エンドポイント/機能

   ### {機能1}
   - エンドポイント: `POST /api/v1/xxx`
   - 用途: 説明
   - リクエスト例:
   ```json
   {
     "field": "value"
   }
   ```
   - レスポンス例:
   ```json
   {
     "result": "value"
   }
   ```

   ## 制約事項
   - レート制限
   - 利用上の注意点

   ## エラーハンドリング
   - 主要なエラーコードと対処法

   ## 実装時の注意点
   - このプロジェクト固有の実装ガイダンス
   ```

5. **AGENTS.md の更新**
   - `docs/external_tools_fixed_docs/AGENTS.md` を更新する
   - 追加したドキュメントの一覧と概要を記載する

6. **.env.example の更新確認**
   - 新しい環境変数が必要な場合は `.env.example` への追加を提案する
   - ユーザーの承認を得て更新する

7. **最終確認**
   - 作成したドキュメント一覧を表示する
   - 各ドキュメントの内容をユーザーに確認する

**よく使われる外部サービスの例**
- 決済: Stripe, PayPay, GMO Payment
- 認証: Auth0, Firebase Auth, LINE Login
- メール: SendGrid, Amazon SES, Resend
- SMS: Twilio, Amazon SNS
- ストレージ: AWS S3, Cloudflare R2, Google Cloud Storage
- 検索: Algolia, Elasticsearch
- 分析: Google Analytics, Mixpanel, Amplitude
- 通知: Firebase Cloud Messaging, OneSignal
- AI/ML: OpenAI API, Claude API, Google AI

**リファレンス**
- 公式ドキュメントから最新の仕様を取得する際は WebFetch を使用する
- `docs/tools_fixed/` には開発ツールのドキュメントを配置する（外部サービスとは別）
- ドキュメントは実装開始前に完成させることを推奨する
