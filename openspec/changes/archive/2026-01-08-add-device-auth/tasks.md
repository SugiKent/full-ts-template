# Tasks: Device ID 認証の追加

## 1. データベース

- [ ] 1.1 Prisma スキーマに Device モデル追加
- [ ] 1.2 Prisma スキーマに DeviceAccessToken モデル追加
- [ ] 1.3 マイグレーション実行

## 2. サーバー側 - Repository 層

- [ ] 2.1 device.repository.ts 作成
- [ ] 2.2 findByDeviceId 関数実装
- [ ] 2.3 createDevice 関数実装
- [ ] 2.4 updateLastSeen 関数実装
- [ ] 2.5 createAccessToken 関数実装
- [ ] 2.6 validateAccessToken 関数実装
- [ ] 2.7 refreshAccessToken 関数実装

## 3. サーバー側 - ミドルウェア

- [ ] 3.1 ORPCContext に device 型追加
- [ ] 3.2 requireDevice ミドルウェア実装

## 4. サーバー側 - Procedures

- [ ] 4.1 device-auth.ts 作成
- [ ] 4.2 registerDevice Procedure 実装
- [ ] 4.3 refreshToken Procedure 実装
- [ ] 4.4 getDeviceStatus Procedure 実装
- [ ] 4.5 User Router に auth router 追加

## 5. サーバー側 - RPC ルート

- [ ] 5.1 user/rpc.ts でトークン抽出・検証ロジック追加
- [ ] 5.2 context.device を設定

## 6. モバイル側 - サービス

- [ ] 6.1 device.service.ts 作成
- [ ] 6.2 getOrCreateDeviceId 関数実装
- [ ] 6.3 getAccessToken 関数実装
- [ ] 6.4 saveAccessToken 関数実装
- [ ] 6.5 clearAuthData 関数実装

## 7. モバイル側 - AuthProvider

- [ ] 7.1 AuthContextType インターフェース更新
- [ ] 7.2 初期化フロー実装（deviceId 取得/生成）
- [ ] 7.3 トークン検証・登録ロジック実装
- [ ] 7.4 refreshAuth 関数実装

## 8. モバイル側 - oRPC クライアント

- [ ] 8.1 orpc-client.ts のトークンキーを access_token に変更
- [ ] 8.2 useOrpc.ts の enabled 条件を isAuthenticated に変更
- [ ] 8.3 userId パラメータ削除（サーバー側で context から取得）

## 9. 検証

- [ ] 9.1 lint チェック
- [ ] 9.2 typecheck 実行
- [ ] 9.3 build 確認
- [ ] 9.4 サーバー起動確認
- [ ] 9.5 モバイルアプリ動作確認
