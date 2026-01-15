# Tasks: ホーム画面の実データ連携とデバッグ機能

## Phase 1: サーバー側 API 追加

- [x] 1.1. `device.repository.ts` に `deleteDevice` 関数を追加
  - Device レコードを削除（Cascade で関連データも削除）
  - 検証: ユニットテストで削除確認
  - Note: 既に実装済み

- [x] 1.2. `device-auth.ts` に `deleteDeviceData` Procedure を追加
  - requireDevice ミドルウェアで認証
  - deleteDevice 関数を呼び出し
  - 検証: API テストで動作確認

## Phase 2: クライアント側 API フック追加

- [x] 2.1. `useApi.ts` に `useDeleteDeviceData` フックを追加
  - `auth.deleteDeviceData` を呼び出す mutation
  - 成功時にローカルストレージをクリア
  - 検証: TypeScript 型チェック通過

- [x] 2.2. `useApi.ts` に `useDeviceStatus` フックを追加
  - `auth.getDeviceStatus` を呼び出す query
  - デバッグモーダルでデバイス情報を表示するために使用
  - 検証: TypeScript 型チェック通過

## Phase 3: オンボーディング判定のサーバー連携

- [x] 3.1. `_layout.tsx` のオンボーディング判定をサーバー API ベースに変更
  - 認証完了後に `needsOnboarding` API を呼び出し
  - `needsOnboarding=false` の場合、AsyncStorage に `ONBOARDING_COMPLETED=true` を保存
  - AsyncStorage はキャッシュとして補助的に使用（API エラー時のフォールバック）
  - 検証: アプリ起動時の動作確認（新規/既存デバイス）

## Phase 4: ホーム画面の実データ連携

- [x] 4.1. `HomePageContent.tsx` を `useHomeData` フックで実データ取得に変更
  - モックデータインポートを削除
  - API レスポンスを UI 用の型に変換:
    - `item.categories` → `categoryIds: string[]`
    - `item.monthlyGoals` → `isMonthlyGoal: boolean`（現在月でフィルタ）
  - ローディング・エラー状態の UI 実装
  - 検証: ホーム画面でサーバーデータが表示される

- [x] 4.2. 月次目標の判定ロジックを実装
  - `monthlyGoals` 配列の存在で判定
  - 現在月のみをフィルタリング
  - 検証: 今月やることセクションの表示確認

- [x] 4.3. Pull To Refresh の実装
  - `RefreshControl` コンポーネントを `ScrollView` に追加
  - `useHomeData` の `refetch` を呼び出し
  - リフレッシュ中のインジケーター表示
  - 検証: 引っ張り操作でデータが更新される

## Phase 5: デバッグ機能の実装

- [x] 5.1. `DebugScreen.tsx` コンポーネントを新規作成（フルスクリーン）
  - フルスクリーンモーダルとして表示
  - 右上に閉じるボタンを配置
  - `auth.getDeviceStatus` API を呼び出してデバイス情報を取得
  - デバイス情報の表示（deviceId, platform, firstSeenAt）
  - 「すべてのデータを削除」ボタン
  - 削除確認ダイアログ（Alert.alert を使用）
  - 検証: モーダル表示・削除処理の動作確認

- [x] 5.2. `HomePageContent.tsx` に3連打検知ロジックを追加
  - 左上エリアのタップカウンター
  - 500ms 以内の3連打でデバッグ画面表示
  - 検証: 3連打でモーダルが表示される

- [x] 5.3. データ削除後のアプリリセット処理を実装
  - SecureStore から deviceId、accessToken、expiresAt をすべて削除
  - AsyncStorage から ONBOARDING_COMPLETED をクリア
  - アプリをオンボーディング画面へリダイレクト
  - 検証: 削除後にオンボーディングから再開できる

## Phase 6: 統合テストと仕上げ

- [x] 6.1. 統合テスト
  - 新規デバイス: オンボーディング → ホーム画面の流れ
  - 既存デバイス: 直接ホーム画面表示
  - Pull To Refresh: データが更新される
  - データ削除: オンボーディングからの再開
  - 検証: すべてのユーザーシナリオが動作する

- [x] 6.2. 型チェック・ビルド確認
  - `pnpm run typecheck`
  - `pnpm run build`
  - `pnpm run lint`
