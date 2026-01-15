# Design: ホーム画面の実データ連携とデバッグ機能

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Mobile App                                  │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   │
│  │  _layout.tsx    │───│  AuthProvider   │───│ OnboardingCheck │   │
│  │  (認証・判定)    │   │  (デバイス認証)   │   │ (API: needs....) │   │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘   │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │               HomePageContent.tsx                             │   │
│  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐     │   │
│  │  │ useHomeData  │   │ 3連打検知    │───│ DebugModal   │     │   │
│  │  │ (API取得)     │   │              │   │ (データ削除)  │     │   │
│  │  └──────────────┘   └──────────────┘   └──────────────┘     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Server API                                  │
│  ┌──────────────────┐   ┌────────────────────────────────────────┐ │
│  │ onboarding       │   │ auth                                    │ │
│  │  - needsOnboard. │   │  - deleteDeviceData (新規)             │ │
│  │  - getHomeData   │   │  - registerDevice                      │ │
│  └──────────────────┘   └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## 設計判断

### 1. オンボーディング判定のタイミング

**選択肢:**
- A) 認証完了後に毎回 `needsOnboarding` を呼び出す
- B) AsyncStorage の値を優先し、バックグラウンドで同期

**選択: A**

**理由:**
- サーバーを SSOT として扱う（仕様の要求）
- 他デバイスでオンボーディング完了した場合の整合性
- AsyncStorage は補助的なキャッシュとして使用

### 2. デバッグ画面のアクセス方法

**選択肢:**
- A) 設定画面に隠しボタン
- B) ホーム画面の特定エリアを連打
- C) シェイクジェスチャー

**選択: B（ホーム左上を3回連打）**

**理由:**
- ユーザーの指示通り
- 誤操作のリスクが低い
- 実装がシンプル

### 3. デバイスデータ削除の範囲

**削除対象（Prisma Cascade により自動削除）:**
- Device レコード本体
- DeviceAccessToken（すべてのトークン）
- UserSettings
- Category
- WishlistItem
- WishlistItemCategory（WishlistItem の Cascade）
- Step（WishlistItem の Cascade）
- MonthlyGoal

**クライアント側の対応:**
- SecureStore から deviceId、accessToken、expiresAt をすべて削除
- AsyncStorage から onboardingCompleted を削除
- アプリを初期状態にリセット（オンボーディングから再開）

### 4. ホーム画面のデータ取得タイミング

**既存の `getHomeData` API を使用:**
- カテゴリー、アイテム、ステップ、月次目標をまとめて取得
- React Query でキャッシュ管理
- Pull To Refresh で手動更新可能

### 5. デバッグモーダルの表示形式

**フルスクリーンモーダル:**
- React Native Modal を使用（presentationStyle: 'fullScreen'）
- 閉じるボタンを右上に配置
- デバイス情報取得のため `auth.getDeviceStatus` API を呼び出し

### 6. 型の整合性

**WishlistItem 型の変換:**

現在のモック型:
```typescript
interface WishlistItem {
  id: string
  title: string
  categoryIds: string[]  // カテゴリーID配列
  isCompleted: boolean
  isMonthlyGoal: boolean  // 月次目標かどうか
  steps: Step[]
}
```

API レスポンス型:
```typescript
interface WishlistItem {
  id: string
  title: string
  categories: Category[]  // カテゴリーオブジェクト配列
  isCompleted: boolean
  monthlyGoals: MonthlyGoal[]  // 月次目標配列
  steps: Step[]
}
```

→ `HomePageContent` 内でレスポンスを適切な形式に変換

## シーケンス図

### アプリ起動時のフロー

```
User         App            AuthProvider     API Server
 │            │                  │                │
 │  起動      │                  │                │
 │───────────>│                  │                │
 │            │  initAuth()      │                │
 │            │─────────────────>│                │
 │            │                  │ registerDevice │
 │            │                  │───────────────>│
 │            │                  │ <token>        │
 │            │                  │<───────────────│
 │            │  isAuthenticated │                │
 │            │<─────────────────│                │
 │            │                  │                │
 │            │  needsOnboarding()                │
 │            │───────────────────────────────────>│
 │            │  { needsOnboarding: true/false }  │
 │            │<───────────────────────────────────│
 │            │                  │                │
 │            │  [needsOnboarding=true]           │
 │            │  Navigate to Onboarding           │
 │            │                  │                │
 │            │  [needsOnboarding=false]          │
 │            │  Navigate to Home                 │
 │            │                  │                │
```

### デバッグ画面からのデータ削除フロー

```
User         DebugModal       API Server      AuthProvider
 │            │                  │                │
 │  Delete    │                  │                │
 │───────────>│                  │                │
 │            │ deleteDeviceData │                │
 │            │─────────────────>│                │
 │            │                  │ delete Device  │
 │            │                  │ (cascade all)  │
 │            │  { success }     │                │
 │            │<─────────────────│                │
 │            │                  │                │
 │            │ clearLocalData() │                │
 │            │──────────────────────────────────>│
 │            │                  │  clear storage │
 │            │                  │                │
 │            │ restartApp()     │                │
 │  Onboarding│                  │                │
 │<───────────│                  │                │
 │            │                  │                │
```

## API 設計

### DELETE /api/user/v1/rpc/auth.deleteDeviceData

**認証:** requireDevice（デバイストークン必須）

**入力:** なし（context から deviceId を取得）

**処理:**
1. context から deviceId を取得
2. Device レコードを削除（Cascade で関連データも削除）
3. 成功レスポンスを返す

**出力:**
```typescript
{
  success: true
  data: null
}
```

**エラーケース:**
- 401: 認証エラー
- 500: 削除処理失敗
