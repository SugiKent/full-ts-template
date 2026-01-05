---
name: プロジェクト初期化: PROJECT.md作成
description: 対話形式でPROJECT.mdを埋めていき、プロジェクト仕様書を完成させます
category: プロジェクトセットアップ
tags: [setup, project, init]
---

**ガードレール**
- ユーザーの回答を尊重し、過度な提案や複雑化を避ける
- 不明確な点は必ず確認してから進める
- すべて日本語で対話する
- 1セクションずつ順番に進め、ユーザーが内容を確認できるようにする

**概要**
このコマンドは、プロジェクトの仕様書である `PROJECT.md` を対話形式で作成・更新します。
テンプレートの `{TODO: ...}` プレースホルダーを、実際のプロジェクト情報で置き換えていきます。

**ステップ**

1. **現状確認**
   - `PROJECT.md` を読み込み、現在の記入状況を確認する
   - 未記入（`{TODO:`が残っている）セクションをリストアップする
   - ユーザーにどのセクションから始めるか確認する

2. **パッケージ名の設定**
   - ユーザーに以下を質問する：

   | 質問項目 | 説明 | 例 |
   |---------|------|-----|
   | プロジェクト名 | ルート `package.json` の `name` | "my-awesome-app" |
   | プロジェクト説明 | ルート `package.json` の `description` | "次世代のタスク管理アプリ" |
   | NPMスコープ名 | 各パッケージの名前空間（`@xxx/`の部分） | "myapp" → `@myapp/client` |

   - 以下のファイルを更新する：

   **ルート package.json:**
   - `name`: プロジェクト名に変更
   - `description`: プロジェクト説明に変更

   **各パッケージの package.json:**
   `@repo/*` を `@<スコープ名>/*` に一括置換：
   - `apps/client/package.json`: `@repo/client` → `@<スコープ名>/client`
   - `apps/server/package.json`: `@repo/server` → `@<スコープ名>/server`
   - `apps/worker/package.json`: `@repo/worker` → `@<スコープ名>/worker`
   - `apps/mobile/package.json`: `@repo/mobile` → `@<スコープ名>/mobile`（存在する場合）
   - `packages/shared/package.json`: `@repo/shared` → `@<スコープ名>/shared`
   - `packages/typescript-config/package.json`: `@repo/typescript-config` → `@<スコープ名>/typescript-config`

   **依存関係の参照も更新:**
   各 package.json 内の `dependencies` / `devDependencies` で `@repo/*` を参照している箇所を `@<スコープ名>/*` に置換

   **その他の参照箇所:**
   - `.claude/settings.local.json` 内の `@repo/mobile` 参照
   - `turbo.json` 内のフィルター設定（存在する場合）

   - 更新後、`pnpm install` を実行してlockfileを更新

3. **セクション1: サービス全体の流れ（1.1-1.2）**
   - ユーザーに以下を質問する：
     - サービスの開始トリガーは何か（例：ユーザー登録、サイト訪問）
     - 主要なユーザーアクションの流れ
     - 重要な分岐点や判断ポイント
     - ゴール（完了状態）は何か
   - 回答をもとにMermaidフローチャートとシーケンス図を生成する

4. **モバイルアプリの要否確認**
   - ユーザーに AskQuestion で以下を確認する：
     - 「このプロジェクトでモバイルアプリ（Expo + React Native）を開発しますか？」
     - 選択肢: 「はい（モバイルアプリを開発する）」「いいえ（Webアプリのみ）」

   **「いいえ」を選択した場合:**
   以下を実行してモバイル関連ファイルを削除：
   1. `apps/mobile/` ディレクトリを削除 (`rm -rf apps/mobile`)
   2. `docs/MOBILE_APP.md` を削除 (`rm docs/MOBILE_APP.md`)
   3. `package.json` からmobile関連スクリプトを削除（Edit ツールで実行）：
      - `dev:mobile`
      - `dev:api+mobile`
   4. `turbo.json` から `dev:go` タスク定義を削除（Edit ツールで実行）
   5. `.claude/settings.local.json` からmobile関連設定を削除（Edit ツールで実行）：
      - `Bash(pnpm --filter @<スコープ名>/mobile typecheck:*)`
   6. `pnpm install` を実行してlockfileを更新
   7. 検証として `pnpm run typecheck && pnpm run lint && pnpm run build` を実行

   **「はい」を選択した場合:**
   以下の設定をユーザーに質問し、`apps/mobile/app.json` を更新：

   | 質問項目 | app.json のキー | 例 |
   |---------|----------------|-----|
   | アプリ名（表示名） | `expo.name` | "My App" |
   | アプリslug（識別子） | `expo.slug` | "my-app" |
   | URLスキーム | `expo.scheme` | "myapp" |
   | iOS バンドルID | `expo.ios.bundleIdentifier` | "com.company.myapp" |
   | Android パッケージ名 | `expo.android.package` | "com.company.myapp" |

   ※ バンドルID/パッケージ名はデフォルトで同じ値を使用（ユーザーが望めば別々に設定可能）

5. **セクション2: プロジェクト概要（2.1-2.4）**
   - ユーザーに以下を質問する：
     - プロジェクトの目的（2-3文で）
     - サービスを構成する主要な要素（3-5個）
     - ターゲットユーザー（ペルソナ）
     - 主要なマイルストーン（任意）
   - 回答を整形してセクションを埋める

6. **セクション3: 機能要件定義（3.1-3.3）**
   - ユーザーに主要な機能カテゴリを質問する
   - 各カテゴリについて：
     - 機能の概要
     - ユーザーストーリー（〇〇として、△△したい。なぜなら□□だから）
     - 受け入れ条件（3-5個）
   - 必要に応じてカテゴリを追加する

7. **セクション4: 画面一覧**
   - 機能要件から必要な画面を洗い出す
   - 各画面の説明と優先度をユーザーと確認する

8. **セクション5-7: ビジネス制約・用語集・拡張性**
   - 運用制約、法規制を確認する
   - プロジェクト固有の用語を収集する
   - 将来の拡張予定を確認する

9. **最終確認**
   - 完成した `PROJECT.md` を表示する
   - ユーザーに最終確認を求める
   - 必要な修正があれば対応する

10. **設定型ファイルの修正**
    - `.env.example`, `docker-compose.yml`, `index.html` など実装内でサービス名がプレイスホルダーになっている箇所や `app_*` のように汎用的な名称になっている箇所を、プロジェクト名に置き換える

**リファレンス**
- テンプレート内のコメント（`<!-- サンプル: ... -->`）を参考例として活用する
- `docs/ARCHITECTURE.md` と整合性が取れているか意識する
- 機能要件は後で OpenSpec を使って詳細化できることを伝える
