# Change: Device ID 認証の追加

## Why

モバイルアプリでユーザーがアカウント登録なしで即座にアプリを利用開始できるようにする。Device ID ベースの匿名認証により、ユーザーデータをサーバーに安全に保存・同期する基盤を構築する。

## What Changes

- **新規テーブル**: Device（デバイス情報）、DeviceAccessToken（アクセストークン管理）
- **新規 Repository**: device.repository.ts - デバイス操作とトークン管理
- **新規 Procedures**: device-auth.ts - デバイス登録、トークン更新、状態取得
- **新規ミドルウェア**: requireDevice - デバイス認証必須チェック
- **モバイル側**: AuthProvider 更新、device.service.ts 新規作成

## Impact

- Affected specs: device-auth（新規）
- Affected code:
  - `prisma/schema.prisma` - Device, DeviceAccessToken 追加
  - `apps/server/src/repositories/device.repository.ts` - 新規
  - `apps/server/src/procedures/user/device-auth.ts` - 新規
  - `apps/server/src/procedures/user/index.ts` - auth router 追加
  - `apps/server/src/middleware/orpc-auth.ts` - requireDevice 追加
  - `apps/server/src/routes/user/rpc.ts` - トークン検証追加
  - `apps/mobile/src/services/device.service.ts` - 新規
  - `apps/mobile/src/providers/AuthProvider.tsx` - 認証フロー実装
  - `apps/mobile/src/services/orpc-client.ts` - トークンキー変更
  - `apps/mobile/src/hooks/useOrpc.ts` - enabled 条件変更
