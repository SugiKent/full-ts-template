# Change: ホーム画面の実データ連携とデバッグ機能

## Why

現在のホーム画面（`HomePageContent.tsx`）はモックデータ（`mockWishlistItems`）を使用しており、実際の API からデータを取得していない。
また、オンボーディング完了判定もローカルストレージ（AsyncStorage）のみを参照しており、サーバーを Single Source of Truth として扱っていない。
さらに、開発・テスト時にデータをリセットできるデバッグ機能が必要。

## What Changes

1. **ホーム画面の実データ連携**
   - `HomePageContent.tsx` をモックデータから `useHomeData` フックによる実データ取得へ変更
   - ローディング状態、エラー状態のUI実装
   - データ更新時のキャッシュ無効化

2. **オンボーディング判定のサーバー連携**
   - アプリ起動時に `needsOnboarding` API を呼び出し
   - サーバーレスポンスに基づいてオンボーディング/ホーム画面を表示
   - 認証状態との連携（認証完了後にオンボーディング判定）

3. **デバッグ画面の実装**
   - ホーム画面左上を3回連打でデバッグ画面表示
   - デバイスデータ全削除ボタンの実装
   - デバイス情報の表示

4. **デバイスデータ削除 API の実装**
   - `auth.deleteDeviceData` エンドポイントの追加
   - Device に紐づくすべてのデータを削除（Cascade）
   - トークンの無効化とクライアント側のログアウト処理

## Impact

- Affected specs: mobile-home, device-auth
- Affected code:
  - `apps/mobile/src/components/home/HomePageContent.tsx`（変更）
  - `apps/mobile/app/_layout.tsx`（変更）
  - `apps/mobile/src/components/debug/DebugModal.tsx`（新規）
  - `apps/mobile/src/hooks/useApi.ts`（変更）
  - `apps/server/src/procedures/user/v1/device-auth.ts`（変更）
  - `apps/server/src/repositories/device.repository.ts`（変更）
