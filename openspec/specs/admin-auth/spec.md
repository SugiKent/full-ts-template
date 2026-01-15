# Admin Auth Specification

## Purpose

管理画面の認証システム仕様。Better-Auth を使用した Email/パスワード認証とマジックリンク認証を提供する。

## Requirements

### Requirement: Email/Password Authentication

システムは管理画面へのアクセスに Email/パスワード認証を提供しなければならない（SHALL）。

- ユーザー登録時に Email、パスワード、名前を必須とする（MUST）
- 登録時にメール認証を必須とする（MUST）
- パスワードリセット機能を提供しなければならない（SHALL）
- 認証情報は Better-Auth でセキュアに管理しなければならない（SHALL）

#### Scenario: 新規管理者登録

- **WHEN** ユーザーが Email、パスワード、名前を入力して登録する
- **THEN** アカウントが作成される（role: 'admin'）
- **AND** 認証メールが送信される
- **AND** メール認証完了後にログイン可能になる

#### Scenario: Email/パスワードログイン成功

- **WHEN** 認証済みの管理者が正しい Email とパスワードを入力する
- **AND** ユーザーの role が 'admin' である
- **THEN** セッションが作成される
- **AND** ダッシュボードにリダイレクトされる

#### Scenario: 非管理者ロールでのログイン拒否

- **WHEN** ユーザーが正しい Email とパスワードを入力する
- **AND** ユーザーの role が 'admin' でない（例: 'user'）
- **THEN** セッションが作成されない
- **AND** エラーメッセージが表示される

#### Scenario: パスワードリセット

- **WHEN** ユーザーがパスワードリセットをリクエストする
- **THEN** パスワードリセットメールが送信される
- **AND** リンクからパスワードを再設定できる

### Requirement: Magic Link Authentication

システムはパスワード不要のマジックリンク認証を提供しなければならない（SHALL）。

- マジックリンクの有効期限は 15 分でなければならない（SHALL）
- マジックリンクは一度使用すると無効になる（MUST）
- メールで送信されるリンクからワンクリックでログインできる（SHALL）

#### Scenario: マジックリンクログイン

- **WHEN** ユーザーが Email を入力してマジックリンクを送信する
- **THEN** 有効期限 15 分のマジックリンクメールが送信される
- **AND** リンクをクリックするとセッションが作成される
- **AND** ダッシュボードにリダイレクトされる

#### Scenario: 期限切れマジックリンク

- **WHEN** 15 分以上経過したマジックリンクをクリックする
- **THEN** エラーメッセージが表示される
- **AND** 新しいマジックリンクの送信が促される

### Requirement: Session Management

システムはセッションを安全に管理しなければならない（SHALL）。

- セッション有効期限は 8 時間でなければならない（SHALL）
- セッションは 2 時間ごとに更新されなければならない（SHALL）
- Cookie は HttpOnly、SameSite=lax に設定されなければならない（MUST）
- 本番環境では Secure Cookie を使用しなければならない（MUST）

#### Scenario: セッション有効期限

- **WHEN** ユーザーがログインする
- **THEN** 8 時間有効なセッションが作成される
- **AND** アクティビティがあれば 2 時間ごとにセッションが更新される

#### Scenario: セッション期限切れ

- **WHEN** セッションが期限切れになる
- **THEN** 次のリクエストでログイン画面にリダイレクトされる

#### Scenario: ログアウト

- **WHEN** ユーザーがログアウトする
- **THEN** セッションが無効化される
- **AND** ログイン画面にリダイレクトされる

### Requirement: Role-Based Access Control

システムはロールベースのアクセス制御を提供しなければならない（SHALL）。

- ユーザーには role フィールドが設定されなければならない（MUST）
- role の値は 'admin', 'counselor', 'user' のいずれか（SHALL）
- 管理画面へのアクセスは 'admin' ロールのみ許可（MUST）
- oRPC Procedure は requireRole ミドルウェアで保護可能（SHALL）

#### Scenario: 管理者のみアクセス可能なエンドポイント

- **WHEN** 'admin' ロールのユーザーがアクセスする
- **THEN** リクエストが許可される

#### Scenario: 権限不足でのアクセス拒否

- **WHEN** 'admin' 以外のロールのユーザーが管理者専用エンドポイントにアクセスする
- **THEN** 403 Forbidden エラーが返される

### Requirement: Email Verification

システムはメール認証機能を提供しなければならない（SHALL）。

- 新規登録時に認証メールが送信されなければならない（MUST）
- 認証メールは再送信可能でなければならない（SHALL）
- メール認証が完了するまでログインを制限しなければならない（SHALL）

#### Scenario: メール認証フロー

- **WHEN** ユーザーが新規登録する
- **THEN** 認証メールが送信される
- **AND** メール内のリンクをクリックすると emailVerified が true になる

#### Scenario: 未認証ユーザーのログイン

- **WHEN** メール認証が完了していないユーザーがログインを試みる
- **THEN** エラーメッセージが表示される
- **AND** 認証メールの再送信オプションが提供される
