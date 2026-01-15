## ADDED Requirements

### Requirement: Path-Based API Versioning

システムはパスベースの API バージョニングを採用しなければならない（SHALL）。

- ユーザー向け API は `/api/user/v{version}/rpc/*` の形式でなければならない（MUST）
- 各バージョンは独立した Router を持たなければならない（SHALL）
- Procedures は `apps/server/src/procedures/user/v{version}/` 配下に配置しなければならない（SHALL）

#### Scenario: v1 エンドポイントへのアクセス

- **WHEN** クライアントが `/api/user/v1/rpc/*` にリクエストを送信する
- **THEN** v1 Router の対応する procedure が実行される

#### Scenario: バージョン未指定時の後方互換

- **WHEN** クライアントが `/api/user/rpc/*`（バージョンなし）にリクエストを送信する
- **THEN** 最新の安定バージョン（v1）にルーティングされる

### Requirement: Mobile Client Version Configuration

モバイルアプリは API バージョンを明示的に指定しなければならない（SHALL）。

- oRPC クライアントの URL は `/api/user/v1/rpc` を指定しなければならない（MUST）
- バージョン変更時はクライアント更新が必要であることを明確にしなければならない（SHALL）

#### Scenario: モバイルアプリからの API 呼び出し

- **WHEN** モバイルアプリが oRPC クライアントを使用して API を呼び出す
- **THEN** リクエストは `/api/user/v1/rpc` エンドポイントに送信される
- **AND** Authorization ヘッダーにデバイストークンが含まれる

### Requirement: App Version Tracking

システムはモバイルアプリのバージョン情報を追跡しなければならない（SHALL）。

- モバイルアプリはリクエストに X-App-Version ヘッダーを含めなければならない（MUST）
- モバイルアプリはリクエストに X-OS-Version ヘッダーを含めなければならない（MUST）
- サーバーはこれらのヘッダーをログに出力しなければならない（SHALL）
- X-App-Version は SemVer 形式（例: `1.2.0`）でなければならない（MUST）
- X-OS-Version は `{OS}/{Version}` 形式（例: `iOS/17.0`, `Android/14`）でなければならない（MUST）

#### Scenario: バージョン情報を含むリクエスト

- **WHEN** モバイルアプリが API リクエストを送信する
- **THEN** X-App-Version ヘッダーにアプリバージョンが含まれる
- **AND** X-OS-Version ヘッダーに OS バージョンが含まれる

#### Scenario: サーバーでのバージョン情報ログ出力

- **WHEN** サーバーがリクエストを受信する
- **AND** X-App-Version と X-OS-Version ヘッダーが含まれる
- **THEN** ログに `{ appVersion, osVersion, deviceId }` 形式で出力される
