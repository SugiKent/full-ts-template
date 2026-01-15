# モバイルアプリ開発規約

このドキュメントは、Expo + React Native を使用したモバイルアプリ開発の規約とベストプラクティスを説明します。

**関連ドキュメント:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 全体アーキテクチャ
- [BACKEND.md](./BACKEND.md) - バックエンド開発規約
- [FRONTEND.md](./FRONTEND.md) - Web フロントエンド開発規約（管理画面）
- [AUTH.md](./AUTH.md) - 管理画面の認証実装（Better-Auth）

> **注意:** モバイルアプリは Better-Auth を使用せず、Device ID ベースの匿名認証を採用しています。詳細は「7. 認証フロー」を参照してください。

## 目次

1. [技術スタック](#1-技術スタック)
2. [プロジェクト構造](#2-プロジェクト構造)
3. [セットアップ手順](#3-セットアップ手順)
4. [データ管理原則](#4-データ管理原則)
5. [API バージョニング](#5-api-バージョニング)
6. [oRPC クライアント設計](#6-orpc-クライアント設計)
7. [認証フロー](#7-認証フロー)
8. [オンボーディングフロー](#8-オンボーディングフロー)
9. [NativeWind (Tailwind CSS)](#9-nativewind-tailwind-css)
10. [ナビゲーション設計](#10-ナビゲーション設計)
11. [状態管理](#11-状態管理)
12. [開発・ビルド・デプロイ](#12-開発ビルドデプロイ)
13. [制約事項と注意点](#13-制約事項と注意点)

---

## 1. 技術スタック

### 1.1 コア技術

| カテゴリ | 技術 | バージョン | 備考 |
|---------|------|-----------|------|
| フレームワーク | Expo SDK | 54+ | New Architecture デフォルト有効 |
| ランタイム | React Native | 0.83+ | React 19 対応 |
| ルーティング | Expo Router | 4+ | ファイルベースルーティング |
| スタイリング | NativeWind | v4 | Tailwind CSS for React Native |
| API通信 | oRPC | 1.13+ | 型安全なRPC |
| データフェッチ | TanStack Query | v5 | キャッシュ・再フェッチ自動化 |
| 認証 | Device ID 認証 | - | 匿名認証（Better-Auth 非依存） |
| ストレージ | expo-secure-store | - | セッショントークン保存 |
| ビルド | EAS Build | - | クラウドビルド（Mac 不要） |
| CI/CD | EAS Workflows | - | GitHub 連携 |
| OTA | EAS Update | - | 審査なしで即時配信 |
| ストア提出 | EAS Submit | - | App Store / Google Play |
| 開発ツール | Expo Orbit | - | シミュレーター管理 |

### 1.2 対応プラットフォーム

- **iOS**: 15.1+ (Expo SDK 52 の最小要件)
- **Android**: API 24+ (Android 7.0 Nougat 以降)

### 1.3 Web版との共通点・相違点

| 項目 | Web (client) | Mobile |
|------|-------------|--------|
| UIフレームワーク | React 19 | React Native + React 19 |
| スタイリング | Tailwind CSS v4 | NativeWind v4 |
| ルーティング | React Router | Expo Router |
| API通信 | oRPC + fetch | oRPC + expo/fetch |
| 認証 | Better-Auth (Cookie) | Device ID 認証 (SecureStore) |
| 型共有 | @wishlist/shared | @wishlist/shared |

---

## 2. プロジェクト構造

### 2.1 モノレポ内の配置

```
full-ts-template/
├── apps/
│   ├── client/          # Web フロントエンド
│   ├── server/          # API サーバー
│   ├── worker/          # ジョブワーカー
│   └── mobile/          # モバイルアプリ (Expo)
├── packages/
│   ├── shared/          # 型・スキーマ・i18n設定
│   └── typescript-config/
├── .npmrc               # pnpm 設定 (node-linker=hoisted)
└── pnpm-workspace.yaml
```

### 2.2 mobile アプリの構造

```
apps/mobile/
├── app/                          # Expo Router (ファイルベースルーティング)
│   ├── (tabs)/                   # タブナビゲーショングループ
│   │   ├── _layout.tsx           # タブレイアウト
│   │   ├── index.tsx             # ホーム画面
│   │   └── settings.tsx          # 設定画面
│   ├── (onboarding)/             # オンボーディングフローグループ
│   │   ├── _layout.tsx           # オンボーディングレイアウト
│   │   └── index.tsx             # オンボーディング画面
│   ├── _layout.tsx               # ルートレイアウト
│   └── +not-found.tsx            # 404 画面
├── src/
│   ├── components/               # 共通コンポーネント
│   │   ├── ui/                   # 基本UIコンポーネント
│   │   └── features/             # 機能別コンポーネント
│   ├── hooks/                    # カスタムフック
│   │   └── useOrpc.ts            # oRPC フック
│   ├── services/                 # 外部サービス連携
│   │   ├── orpc-client.ts        # oRPC クライアント
│   │   └── device.service.ts     # デバイス認証サービス
│   ├── providers/                # Context プロバイダー
│   │   ├── AuthProvider.tsx      # Device ID 認証プロバイダー
│   │   └── QueryProvider.tsx
│   ├── utils/                    # ユーティリティ
│   └── constants/                # 定数
├── assets/                       # 静的アセット
│   ├── images/
│   └── fonts/
├── app.json                      # Expo 設定
├── metro.config.js               # Metro バンドラー設定
├── tailwind.config.js            # NativeWind 設定
├── nativewind-env.d.ts           # NativeWind 型定義
├── babel.config.js               # Babel 設定
├── tsconfig.json                 # TypeScript 設定
├── eas.json                      # EAS Build 設定
└── package.json
```

---

## 3. セットアップ手順

### 3.1 前提条件

**必須:**
```bash
# Node.js 20+ が必要
node -v

# pnpm がインストールされていること
pnpm -v

# EAS CLI（クラウドビルド用）
npm install -g eas-cli
eas login
```

**オプション（ローカルビルド時のみ）:**
```bash
# iOS 開発の場合: Xcode + CocoaPods（EAS Build 使用時は不要）
xcode-select --install
sudo gem install cocoapods

# Android 開発の場合: Android Studio + SDK（EAS Build 使用時は不要）
# https://docs.expo.dev/get-started/set-up-your-environment/
```

> **推奨:** EAS Build を使用すれば、ローカルに Xcode や Android Studio をインストールする必要はありません。Mac がなくても iOS アプリをビルドできます。

### 3.2 プロジェクト作成

```bash
# モノレポのルートディレクトリで実行
cd apps

# Expo プロジェクト作成（Expo Router テンプレート）
npx create-expo-app@latest mobile --template tabs

# ディレクトリ移動
cd mobile
```

### 3.3 モノレポ統合設定

**1. package.json の更新:**

```json
{
  "name": "@wishlist/mobile",
  "version": "0.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "dev:ios": "expo start --ios",
    "dev:android": "expo start --android",
    "build:ios": "eas build --platform ios",
    "build:android": "eas build --platform android",
    "lint": "expo lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@wishlist/shared": "workspace:*",
    "expo": "~54.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-localization": "~16.0.0",
    "react": "19.0.0",
    "react-native": "0.83.0",
    "@orpc/client": "^1.13.0",
    "@tanstack/react-query": "^5.0.0",
    "expo-crypto": "~14.0.0",
    "nativewind": "^4.0.0"
  },
  "devDependencies": {
    "@wishlist/server": "workspace:*",
    "@wishlist/typescript-config": "workspace:*",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.6.0"
  }
}
```

**2. .npmrc（ルートレベル）の確認:**

```ini
# Expo + pnpm 互換性のため必須
node-linker=hoisted
```

**3. tsconfig.json:**

```json
{
  "extends": "@wishlist/typescript-config/base.json",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../../packages/shared/src/*"]
    },
    "jsx": "react-native",
    "lib": ["ESNext"],
    "moduleResolution": "bundler",
    "noEmit": true
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"],
  "exclude": ["node_modules"]
}
```

**4. metro.config.js（モノレポ対応）:**

```javascript
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

// モノレポのルートディレクトリ
const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// モノレポ内の全ファイルを監視
config.watchFolders = [monorepoRoot]

// node_modules の解決パス
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// packages/* を解決
config.resolver.disableHierarchicalLookup = true

module.exports = config
```

### 3.4 依存関係インストールと EAS 初期化

```bash
# ルートディレクトリで実行
cd ../..
pnpm install

# mobile ディレクトリに移動
cd apps/mobile

# EAS プロジェクトを初期化
eas init

# Development Build を作成（クラウドビルド）
eas build --profile development --platform all

# ビルド完了後、Expo Orbit でインストール
# または QR コードからデバイスにインストール

# 開発サーバー起動
pnpm --filter @wishlist/mobile dev
```

> **初回のみ:** Development Build の作成には 10〜20 分程度かかります。ビルド完了後は、JS の変更のみで高速にイテレーションできます。

---

## 4. データ管理原則

### 4.1 Single Source of Truth（SSOT）

モバイルアプリは **サーバーを唯一のデータソース（Single Source of Truth）** として扱います。

```
┌─────────────────────────────────────────────────────────────┐
│                    データ管理原則                            │
├─────────────────────────────────────────────────────────────┤
│  サーバー = SSOT（Single Source of Truth）                  │
│  - すべてのデータはサーバーに保存                            │
│  - クライアントはサーバーからデータを取得して表示             │
│  - ローカルストレージへのデータ永続化は原則禁止               │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 ストレージの使い分け

| ストレージ | 用途 | 例 |
|-----------|------|-----|
| **サーバー（SSOT）** | アプリデータの永続化 | ウィッシュリスト、カテゴリー、ステップ、設定 |
| **SecureStore** | 認証情報のみ | Device ID、Access Token、Token 有効期限 |
| **React State** | 一時的なデータ保持 | オンボーディング中の入力データ、フォーム状態 |
| **TanStack Query Cache** | サーバーデータのキャッシュ | API レスポンスのメモリキャッシュ |

### 4.3 禁止事項

```typescript
// ❌ 禁止: AsyncStorage へのアプリデータ保存
import AsyncStorage from '@react-native-async-storage/async-storage'
await AsyncStorage.setItem('wishlist', JSON.stringify(items))

// ❌ 禁止: MMKV へのアプリデータ保存
import { MMKV } from 'react-native-mmkv'
storage.set('categories', JSON.stringify(categories))

// ✅ 許可: サーバーへのデータ保存
await orpcClient.wishlistItem.create({ title, categoryIds })

// ✅ 許可: SecureStore への認証情報保存
await SecureStore.setItemAsync('access_token', token)
```

### 4.4 オフライン対応（将来計画）

現時点ではオフラインファースト設計は **Non-Goals** です。将来的に以下を検討予定：

- オフライン時のデータキャッシュ
- 複数デバイス間の同期
- リアルタイム同期

---

## 5. API バージョニング

### 5.1 パスベースのバージョニング

モバイルアプリは API の後方互換性を維持するため、パスベースのバージョニングを採用しています。

```
/api/user/v1/rpc/*  ← 現行バージョン（破壊的変更禁止）
/api/user/v2/rpc/*  ← 新バージョン（必要に応じて追加）
```

### 5.2 バージョニングルール

| ルール | 説明 |
|--------|------|
| **v1 は破壊的変更禁止** | フィールド追加は OK、削除/変更は NG |
| **新機能は v1 に追加** | 後方互換性がある限り既存バージョンに追加 |
| **破壊的変更は新バージョン** | 必要な場合のみ v2 を作成 |
| **旧バージョンは維持** | 古いアプリのサポートのため |

### 5.3 アプリバージョン追跡

サーバーはクライアントのバージョン情報を追跡します。

**ヘッダー形式:**
```
X-App-Version: 1.2.0          # SemVer 形式
X-OS-Version: iOS/17.0        # {OS}/{Version} 形式
```

**用途:**
- アプリの利用状況把握
- バージョン別の問題特定
- 非推奨バージョンの利用状況確認

---

## 6. oRPC クライアント設計

### 6.1 基本設定

```typescript
// apps/mobile/src/services/orpc-client.ts
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import type { UserRouter } from '@wishlist/server/procedures/user'
import { API_URL, APP_VERSION } from '@/constants'
import { Platform } from 'react-native'
import { getAccessToken } from './device.service'

/**
 * OS バージョンを取得
 */
function getOSVersion(): string {
  const os = Platform.OS === 'ios' ? 'iOS' : 'Android'
  const version = Platform.Version
  return `${os}/${version}`
}

/**
 * expo/fetch を使用した RPCLink
 * Event Iterator をサポート
 */
const link = new RPCLink({
  url: `${API_URL}/api/user/v1/rpc`,  // v1 バージョニング
  async fetch(request, init) {
    // expo/fetch を動的インポート
    const { fetch } = await import('expo/fetch')

    // device.service からアクセストークンを取得
    const token = await getAccessToken()

    const headers = new Headers(request.headers)
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    // アプリバージョン追跡ヘッダー
    headers.set('X-App-Version', APP_VERSION)
    headers.set('X-OS-Version', getOSVersion())

    return fetch(request.url, {
      body: await request.blob(),
      headers,
      method: request.method,
      ...(request.signal && { signal: request.signal as unknown as AbortSignal }),
      ...init,
    })
  },
})

/**
 * oRPC クライアントインスタンス
 */
export const orpcClient: RouterClient<UserRouter> = createORPCClient(link)
```

### 6.2 TanStack Query との統合

```typescript
// apps/mobile/src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60, // 1分
            gcTime: 1000 * 60 * 5, // 5分
            retry: 2,
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

### 6.3 カスタムフックの実装

```typescript
// apps/mobile/src/hooks/useOrpc.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orpcClient } from '@/services/orpc-client'

/**
 * お問い合わせスレッド一覧を取得
 */
export function useContactThreads(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['contact', 'threads', page, limit],
    queryFn: () => orpcClient.contact.getThreads({ page, limit }),
  })
}

/**
 * メッセージ送信
 */
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { threadId: string; content: string }) =>
      orpcClient.contact.sendMessage(params),
    onSuccess: () => {
      // キャッシュを無効化して再フェッチ
      queryClient.invalidateQueries({ queryKey: ['contact'] })
    },
  })
}
```

### 6.4 コンポーネントでの使用例

```tsx
// apps/mobile/app/(tabs)/contacts.tsx
import { View, Text, FlatList, ActivityIndicator } from 'react-native'
import { useContactThreads } from '@/hooks/useOrpc'

export default function ContactsScreen() {
  const { data, isLoading, error } = useContactThreads()

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-500">エラーが発生しました</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={data?.threads}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="p-4 border-b border-gray-200">
          <Text className="text-lg font-bold">{item.subject}</Text>
          <Text className="text-gray-600">{item.lastMessage}</Text>
        </View>
      )}
    />
  )
}
```

---

## 7. 認証フロー

モバイルアプリは **Device ID ベースの匿名認証** を採用しています。Better-Auth には依存しません。

### 7.1 認証アーキテクチャ

```
┌─────────────────────────────────────┐
│         Device ID 認証              │
│  - UUID v4 による一意識別           │
│  - SecureStore にトークン保存       │
│  - 90日有効のアクセストークン       │
│  - サーバー側で Device テーブル管理 │
└─────────────────────────────────────┘
```

**認証フロー:**
1. アプリ起動時に Device ID を取得（なければ UUID v4 を生成）
2. Device ID をサーバーに登録してアクセストークンを取得
3. トークンを SecureStore に保存
4. API リクエスト時に Authorization ヘッダーにトークンを付与
5. トークン期限切れ時（24時間前から検出）は自動更新

### 7.2 デバイスサービス

```typescript
// apps/mobile/src/services/device.service.ts
import * as Crypto from 'expo-crypto'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

// SecureStore キー
const DEVICE_ID_KEY = 'device_id'
const ACCESS_TOKEN_KEY = 'access_token'
const TOKEN_EXPIRES_AT_KEY = 'token_expires_at'

/**
 * Device ID を取得（存在しない場合は生成）
 */
export async function getOrCreateDeviceId(): Promise<string> {
  const existingId = await SecureStore.getItemAsync(DEVICE_ID_KEY)

  if (existingId) {
    return existingId
  }

  // UUID v4 を生成
  const newId = Crypto.randomUUID()
  await SecureStore.setItemAsync(DEVICE_ID_KEY, newId)

  return newId
}

/**
 * アクセストークンを取得
 */
export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
}

/**
 * アクセストークンを保存
 */
export async function saveAccessToken(token: string, expiresAt: Date): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token)
  await SecureStore.setItemAsync(TOKEN_EXPIRES_AT_KEY, expiresAt.toISOString())
}

/**
 * トークンが期限切れかどうかをチェック
 */
export async function isTokenExpired(): Promise<boolean> {
  const expiresAtStr = await SecureStore.getItemAsync(TOKEN_EXPIRES_AT_KEY)

  if (!expiresAtStr) {
    return true
  }

  const expiresAt = new Date(expiresAtStr)
  // 24時間前から期限切れとみなす（余裕を持たせる）
  const bufferMs = 24 * 60 * 60 * 1000
  return expiresAt.getTime() - bufferMs < Date.now()
}

/**
 * 認証データをクリア
 */
export async function clearAuthData(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY)
  await SecureStore.deleteItemAsync(TOKEN_EXPIRES_AT_KEY)
}

/**
 * プラットフォームを取得
 */
export function getPlatform(): 'ios' | 'android' {
  return Platform.OS === 'ios' ? 'ios' : 'android'
}
```

### 7.3 認証プロバイダー

```tsx
// apps/mobile/src/providers/AuthProvider.tsx
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  clearAuthData,
  getAccessToken,
  getOrCreateDeviceId,
  getPlatform,
  isTokenExpired,
  saveAccessToken,
} from '../services/device.service'
import { orpcClient } from '../services/orpc-client'

interface AuthContextType {
  /** デバイス ID */
  deviceId: string | null
  /** 認証済みかどうか */
  isAuthenticated: boolean
  /** 認証処理中かどうか */
  isLoading: boolean
  /** エラー */
  error: Error | null
  /** 認証状態を更新 */
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  /**
   * デバイスを登録してトークンを取得
   */
  const registerDevice = useCallback(async (deviceIdToRegister: string) => {
    const result = await orpcClient.auth.registerDevice({
      deviceId: deviceIdToRegister,
      platform: getPlatform(),
    })

    if (!result.success || !result.accessToken || !result.expiresAt) {
      throw new Error(result.error || 'Failed to register device')
    }

    await saveAccessToken(result.accessToken, result.expiresAt)
    return true
  }, [])

  /**
   * トークンを更新
   */
  const refreshToken = useCallback(async (deviceIdToRefresh: string) => {
    const result = await orpcClient.auth.refreshToken({
      deviceId: deviceIdToRefresh,
    })

    if (!result.success || !result.accessToken || !result.expiresAt) {
      throw new Error(result.error || 'Failed to refresh token')
    }

    await saveAccessToken(result.accessToken, result.expiresAt)
    return true
  }, [])

  /**
   * 認証を初期化
   */
  const initializeAuth = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Device ID を取得または生成
      const id = await getOrCreateDeviceId()
      setDeviceId(id)

      // 既存のトークンを確認
      const existingToken = await getAccessToken()

      if (existingToken) {
        // トークンが期限切れかチェック
        const expired = await isTokenExpired()

        if (expired) {
          // トークンを更新
          await refreshToken(id)
        }
        // トークンが有効な場合はそのまま使用
      } else {
        // トークンがない場合はデバイスを登録
        await registerDevice(id)
      }

      setIsAuthenticated(true)
    } catch (err) {
      console.error('Auth initialization failed:', err)
      setError(err instanceof Error ? err : new Error('Authentication failed'))
      setIsAuthenticated(false)

      // 認証データをクリアして再試行可能にする
      await clearAuthData()
    } finally {
      setIsLoading(false)
    }
  }, [registerDevice, refreshToken])

  /**
   * 認証状態を更新（リトライ用）
   */
  const refreshAuth = useCallback(async () => {
    await initializeAuth()
  }, [initializeAuth])

  // アプリ起動時に認証を初期化
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <AuthContext.Provider
      value={{
        deviceId,
        isAuthenticated,
        isLoading,
        error,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### 7.4 サーバー側 API（参考）

サーバー側のデバイス認証 API は以下のエンドポイントを提供します:

| エンドポイント | 説明 |
|---------------|------|
| `auth.registerDevice` | デバイス登録とトークン発行 |
| `auth.refreshToken` | トークン更新 |
| `auth.getDeviceStatus` | デバイス状態取得 |
| `auth.agreeToTerms` | 利用規約同意記録 |

詳細は `apps/server/src/procedures/user/v1/device-auth.ts` を参照してください。

---

## 8. オンボーディングフロー

オンボーディングフローはサーバーと連携し、ユーザーデータを永続化します。

### 8.1 フローの概要

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    オンボーディングフロー                                  │
├──────────────────────────────────────────────────────────────────────────┤
│  splash → categories → items → steps → monthly → notifications           │
│     │                                                    │               │
│     │  利用規約同意                                        │               │
│     └─── agreeToTerms API ─────────────────────────────────┘               │
│                                                          │               │
│     │  オンボーディング完了                                 │               │
│     └─────────────────────────────────── completeOnboarding API ────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### 8.2 データの一時保持

オンボーディング中のデータは **React State（OnboardingProvider）** で一時保持します。

```typescript
// apps/mobile/src/providers/OnboardingProvider.tsx
interface OnboardingState {
  categories: string[]           // 選択したカテゴリー ID
  items: OnboardingItem[]        // 作成したウィッシュリストアイテム
  stepsByItem: Record<string, Step[]>  // アイテムごとのステップ
  monthlyGoals: string[]         // 今月やることに設定したアイテム ID
  notificationFrequency: string  // 通知頻度
}
```

**重要:**
- AsyncStorage や MMKV への保存は **禁止**
- サーバーが SSOT のため、ローカル永続化は不要
- アプリ終了時にデータは消失（再度オンボーディングから開始）

### 8.3 サーバー連携ポイント

| 画面 | API 呼び出し | タイミング |
|------|-------------|----------|
| terms | `agreeToTerms` | 同意ボタン押下時 |
| steps | `suggestSteps` | AI ステップ提案取得時 |
| notifications | `completeOnboarding` | 完了ボタン押下時 |

### 8.4 completeOnboarding API

オンボーディング完了時に全データを一括でサーバーに保存します。

```typescript
// API 呼び出し例
const result = await orpcClient.onboarding.complete({
  categories: selectedCategoryIds,
  items: items.map(item => ({
    clientId: item.id,  // クライアント側の一時 ID
    title: item.title,
    categoryIds: item.categoryIds,
  })),
  stepsByItem: Object.fromEntries(
    Object.entries(stepsByItem).map(([itemClientId, steps]) => [
      itemClientId,
      steps.map(step => ({ title: step.title })),
    ])
  ),
  monthlyGoals: monthlyGoalItemClientIds,
  notificationFrequency,
})

// レスポンス: ID マッピング
// {
//   categoryIdMap: { 'client-id-1': 'server-id-abc', ... },
//   itemIdMap: { 'item-1234': 'server-id-xyz', ... },
// }
```

### 8.5 AI ステップ提案

steps 画面では、サーバー側の LLM と連携してステップを自動提案します。

```typescript
// AI ステップ提案 API
const result = await orpcClient.stepSuggestion.suggest({
  itemTitle: 'ヨーロッパ旅行に行く',
  categoryIds: ['travel'],
  existingSteps: [],      // 既存ステップ（重複回避用）
  completedSteps: [],     // 完了済みステップ（次のアクション提案用）
})

// レスポンス
// {
//   steps: [
//     { title: 'パスポートの有効期限を確認する' },
//     { title: '航空券を検索・比較する' },
//     { title: '宿泊先を予約する' },
//   ]
// }
```

### 8.6 エラーハンドリング

ネットワークエラー時はリトライ UI を表示します。

```tsx
// エラー時の UI 例
function OnboardingErrorDialog({ error, onRetry }: Props) {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Text className="text-lg font-bold text-red-600 mb-4">
        {t('onboarding.error.title')}
      </Text>
      <Text className="text-gray-600 text-center mb-6">
        {t('onboarding.error.message')}
      </Text>
      <Pressable
        className="bg-blue-600 rounded-lg py-3 px-8"
        onPress={onRetry}
      >
        <Text className="text-white font-semibold">
          {t('onboarding.error.retry')}
        </Text>
      </Pressable>
    </View>
  )
}
```

### 8.7 オンボーディング完了状態の判定

アプリ起動時にサーバーからオンボーディング完了状態を取得します。

```typescript
// AuthProvider 内での判定
const checkOnboardingStatus = async () => {
  const status = await orpcClient.auth.getDeviceStatus()

  if (status.onboardingCompletedAt) {
    // ホーム画面へ
    router.replace('/(tabs)')
  } else {
    // オンボーディング画面へ
    router.replace('/(onboarding)')
  }
}
```

---

## 9. NativeWind (Tailwind CSS)

### 9.1 セットアップ

**1. 依存関係インストール:**

```bash
pnpm add nativewind
pnpm add -D tailwindcss
```

**2. tailwind.config.js:**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Web版と同じブランドカラー
        'brand-primary': '#3B82F6',
        'brand-secondary': '#10B981',
        'brand-accent': '#F59E0B',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
}
```

**3. babel.config.js:**

```javascript
module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  }
}
```

**4. nativewind-env.d.ts:**

```typescript
/// <reference types="nativewind/types" />
```

**5. global.css（オプション）:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 9.2 使用例

```tsx
// NativeWind を使用したコンポーネント
import { View, Text, Pressable } from 'react-native'

function MyButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      className="bg-brand-primary px-4 py-2 rounded-lg active:bg-blue-700"
      onPress={onPress}
    >
      <Text className="text-white font-semibold text-center">{title}</Text>
    </Pressable>
  )
}

function MyCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-white rounded-xl shadow-md p-4 mb-4">
      {children}
    </View>
  )
}
```

### 9.3 Web版との互換性

| Tailwind クラス | Web | React Native | 備考 |
|----------------|-----|--------------|------|
| `flex` | OK | OK | - |
| `bg-*` | OK | OK | - |
| `text-*` | OK | OK | - |
| `rounded-*` | OK | OK | - |
| `shadow-*` | OK | 制限あり | iOS のみフル対応 |
| `hover:*` | OK | 非対応 | `active:` を使用 |
| `grid` | OK | 制限あり | Flexbox 推奨 |
| `gap-*` | OK | OK | RN 0.71+ |

### 9.4 プラットフォーム固有のスタイル

```tsx
import { Platform, View, Text } from 'react-native'

function PlatformCard() {
  return (
    <View
      className={`
        p-4 rounded-lg
        ${Platform.OS === 'ios' ? 'shadow-lg' : 'elevation-4'}
      `}
    >
      <Text>プラットフォーム固有のスタイル</Text>
    </View>
  )
}
```

---

## 10. ナビゲーション設計

### 10.1 Expo Router のレイアウト構造

```tsx
// apps/mobile/app/_layout.tsx
import { Stack } from 'expo-router'
import { QueryProvider } from '@/providers/QueryProvider'
import { AuthProvider } from '@/providers/AuthProvider'

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(onboarding)" />
        </Stack>
      </AuthProvider>
    </QueryProvider>
  )
}
```

### 10.2 タブナビゲーション

```tsx
// apps/mobile/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router'
import { Home, Settings, MessageSquare } from 'lucide-react-native'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'お問い合わせ',
          tabBarIcon: ({ color }) => <MessageSquare color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  )
}
```

### 10.3 スタックナビゲーション（オンボーディングフロー）

```tsx
// apps/mobile/app/(onboarding)/_layout.tsx
import { Stack } from 'expo-router'

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
```

### 10.4 認証状態によるナビゲーション制御

Device ID 認証はアプリ起動時に自動で行われるため、ログイン画面は不要です。
代わりに、初回起動時のオンボーディングや利用規約同意画面を表示できます。

```tsx
// apps/mobile/app/(onboarding)/index.tsx
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/providers/AuthProvider'

export default function OnboardingScreen() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const handleComplete = async () => {
    // 利用規約同意などの処理
    router.replace('/(tabs)')
  }

  return (
    <View className="flex-1 justify-center items-center px-6">
      <Text className="text-3xl font-bold text-center mb-8">
        ようこそ
      </Text>
      <Text className="text-lg text-center text-gray-600 mb-8">
        アプリの説明文
      </Text>
      <Pressable
        className="bg-blue-600 rounded-lg py-3 px-8"
        onPress={handleComplete}
      >
        <Text className="text-white font-semibold">
          はじめる
        </Text>
      </Pressable>
    </View>
  )
}
```

---

## 11. 状態管理

### 11.1 サーバー状態（TanStack Query）

```tsx
// TanStack Query によるサーバー状態管理
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// データ取得
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => orpcClient.user.getProfile({ id: userId }),
})

// データ更新
const mutation = useMutation({
  mutationFn: (data) => orpcClient.user.updateProfile(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['user'] })
  },
})
```

### 11.2 ローカル状態（Context API）

```tsx
// apps/mobile/src/providers/AppProvider.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react'

interface AppState {
  theme: 'light' | 'dark'
  notifications: boolean
}

type AppAction =
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'TOGGLE_NOTIFICATIONS' }

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    case 'TOGGLE_NOTIFICATIONS':
      return { ...state, notifications: !state.notifications }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    theme: 'light',
    notifications: true,
  })

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
```

---

## 12. 開発・ビルド・デプロイ（Expo サービスフル活用）

このプロジェクトでは [expo.dev](https://expo.dev) のサービスをフル活用し、ローカル環境のセットアップを最小限に抑えつつ、効率的な開発・CI/CD パイプラインを構築します。

### 12.1 Expo サービス一覧

| サービス | 用途 | 備考 |
|---------|------|------|
| **EAS Build** | クラウドビルド | Mac 不要で iOS ビルド可能 |
| **EAS Submit** | ストア提出自動化 | App Store / Google Play |
| **EAS Update** | OTA アップデート | JS バンドルの即時配信 |
| **EAS Workflows** | CI/CD パイプライン | GitHub 連携 |
| **EAS Metadata** | ストアメタデータ管理 | store.config.json |
| **Expo Orbit** | シミュレーター管理 | デスクトップアプリ |
| **Development Builds** | カスタム開発クライアント | ネイティブモジュール対応 |

### 12.2 開発環境セットアップ

#### Expo Orbit（推奨）

[Expo Orbit](https://expo.dev/orbit) はメニューバーからシミュレーター/エミュレーターを管理できるデスクトップアプリです。

```bash
# macOS (Homebrew)
brew install expo-orbit

# Windows / Linux
# GitHub releases からダウンロード
# https://github.com/expo/orbit/releases
```

**Orbit の主な機能:**
- EAS Build からワンクリックでシミュレーターにインストール
- ドラッグ＆ドロップで .apk / .app をインストール
- シミュレーター/エミュレーターの一覧表示・起動
- EAS Update のプレビュー

#### EAS CLI のセットアップ

```bash
# EAS CLI インストール
npm install -g eas-cli

# Expo アカウントにログイン
eas login

# プロジェクトを Expo に接続
cd apps/mobile
eas init
```

### 12.3 Development Build（カスタム開発クライアント）

Development Build はネイティブモジュールを含むカスタム開発クライアントです。初回にビルドを作成し、その後は JS の変更のみ高速にイテレーションできます。

#### Development Build の利点

- **ネイティブモジュール**: 任意のネイティブモジュールを追加可能
- **カスタム設定**: app.json で自由に設定可能
- **チーム共有**: EAS で配布可能
- **ビルド頻度**: ネイティブコード変更時のみ再ビルド

#### Development Build の作成

```bash
# iOS 用 Development Build（クラウドビルド）
eas build --profile development --platform ios

# Android 用 Development Build（クラウドビルド）
eas build --profile development --platform android

# ビルド完了後、Expo Orbit でワンクリックインストール
# または QR コードからインストール
```

#### Development Build での開発

```bash
# 開発サーバー起動（--dev-client フラグ）
pnpm --filter @wishlist/mobile dev

# または
npx expo start --dev-client
```

### 12.4 環境変数管理

**app.config.ts（TypeScript 対応の動的設定）:**

```typescript
// apps/mobile/app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'MyApp',
  slug: 'myapp',
  scheme: 'myapp',
  version: '1.0.0',
  extra: {
    apiUrl: process.env.API_URL ?? 'http://localhost:8080',
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
  updates: {
    url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID}`,
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
})
```

### 12.5 EAS Build 設定

```json
// apps/mobile/eas.json
{
  "cli": {
    "version": ">= 14.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "env": {
        "API_URL": "http://localhost:8080"
      }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "env": {
        "API_URL": "https://staging.yourdomain.com"
      }
    },
    "production": {
      "channel": "production",
      "autoIncrement": true,
      "env": {
        "API_URL": "https://api.yourdomain.com"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### 12.6 EAS Update（OTA アップデート）

EAS Update を使うと、ストア審査なしで JS バンドルを即時配信できます。

```bash
# プレビューチャンネルにアップデート公開
eas update --branch preview --message "Fix: ログイン画面のバグ修正"

# 本番チャンネルにアップデート公開
eas update --branch production --message "v1.0.1 - パフォーマンス改善"

# 特定のコミットにロールバック
eas update:rollback --branch production
```

**アップデートの確認（アプリ内）:**

```typescript
// src/hooks/useAppUpdate.ts
import * as Updates from 'expo-updates'
import { useEffect } from 'react'
import { Alert } from 'react-native'

export function useAppUpdate() {
  useEffect(() => {
    async function checkForUpdates() {
      if (__DEV__) return

      try {
        const update = await Updates.checkForUpdateAsync()
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync()
          Alert.alert(
            'アップデート',
            '新しいバージョンが利用可能です。再起動しますか？',
            [
              { text: 'あとで', style: 'cancel' },
              { text: '再起動', onPress: () => Updates.reloadAsync() },
            ]
          )
        }
      } catch (e) {
        console.error('Update check failed:', e)
      }
    }

    checkForUpdates()
  }, [])
}
```

### 12.7 EAS Workflows（CI/CD）

EAS Workflows を使うと、GitHub と連携した完全な CI/CD パイプラインを構築できます。

#### ワークフロー設定ファイル

```yaml
# apps/mobile/.eas/workflows/pr-preview.yml
name: PR Preview

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  update:
    name: Create Preview Update
    type: update
    params:
      branch: pr-${{ github.event.pull_request.number }}
      message: "PR #${{ github.event.pull_request.number }}: ${{ github.event.pull_request.title }}"

  comment:
    name: Post PR Comment
    type: github-pr-comment
    needs: [update]
    params:
      message: |
        ## 📱 Preview Update Ready

        **Branch:** `pr-${{ github.event.pull_request.number }}`

        Scan the QR code with your development build to preview this change:

        ![QR Code](${{ needs.update.outputs.qrCodeUrl }})
```

```yaml
# apps/mobile/.eas/workflows/production-release.yml
name: Production Release

on:
  push:
    branches: [main]
    paths:
      - 'apps/mobile/**'

jobs:
  build-ios:
    name: Build iOS
    type: build
    params:
      platform: ios
      profile: production

  build-android:
    name: Build Android
    type: build
    params:
      platform: android
      profile: production

  submit-ios:
    name: Submit to App Store
    type: submit
    needs: [build-ios]
    params:
      platform: ios
      profile: production
      build_id: ${{ needs.build-ios.outputs.build_id }}

  submit-android:
    name: Submit to Google Play
    type: submit
    needs: [build-android]
    params:
      platform: android
      profile: production
      build_id: ${{ needs.build-android.outputs.build_id }}

  notify:
    name: Notify Slack
    type: slack
    needs: [submit-ios, submit-android]
    params:
      message: "🚀 New release submitted to stores!"
      channel: "#releases"
```

```yaml
# apps/mobile/.eas/workflows/ota-update.yml
name: OTA Update (Hotfix)

on:
  push:
    branches: [hotfix/*]

jobs:
  update:
    name: Publish OTA Update
    type: update
    params:
      branch: production
      message: "Hotfix: ${{ github.event.head_commit.message }}"

  notify:
    name: Notify Team
    type: slack
    needs: [update]
    params:
      message: "🔥 Hotfix deployed via OTA update"
      channel: "#releases"
```

#### GitHub 連携の設定

1. [expo.dev](https://expo.dev) でプロジェクトを開く
2. **Settings** → **GitHub** に移動
3. **Install GitHub App** をクリック
4. リポジトリを選択して接続

### 12.8 EAS Submit（ストア提出）

```bash
# App Store Connect に提出
eas submit --platform ios --latest

# Google Play Console に提出
eas submit --platform android --latest

# 特定のビルドを提出
eas submit --platform ios --id <build-id>
```

### 12.9 EAS Metadata（ストアメタデータ管理）

ストアのメタデータ（説明文、スクリーンショット等）をコードで管理します。

```json
// apps/mobile/store.config.json
{
  "configVersion": 0,
  "apple": {
    "info": {
      "ja-JP": {
        "title": "MyApp",
        "subtitle": "便利なアプリ",
        "description": "アプリの説明文...",
        "keywords": ["キーワード1", "キーワード2"],
        "releaseNotes": "バグ修正とパフォーマンス改善"
      }
    },
    "categories": ["UTILITIES", "PRODUCTIVITY"],
    "copyright": "© 2025 Your Company"
  },
  "android": {
    "ja-JP": {
      "title": "MyApp",
      "shortDescription": "便利なアプリ",
      "fullDescription": "アプリの詳細説明...",
      "releaseNotes": "バグ修正とパフォーマンス改善"
    }
  }
}
```

```bash
# メタデータをストアに同期
eas metadata:push

# ストアからメタデータを取得
eas metadata:pull
```

### 12.10 package.json スクリプト（推奨）

```json
{
  "scripts": {
    "dev": "expo start --dev-client",
    "dev:ios": "expo start --dev-client --ios",
    "dev:android": "expo start --dev-client --android",

    "build:dev": "eas build --profile development --platform all",
    "build:dev:ios": "eas build --profile development --platform ios",
    "build:dev:android": "eas build --profile development --platform android",

    "build:preview": "eas build --profile preview --platform all",
    "build:production": "eas build --profile production --platform all",

    "update:preview": "eas update --branch preview",
    "update:production": "eas update --branch production",

    "submit:ios": "eas submit --platform ios --latest",
    "submit:android": "eas submit --platform android --latest",

    "metadata:push": "eas metadata:push",
    "metadata:pull": "eas metadata:pull",

    "lint": "expo lint",
    "typecheck": "tsc --noEmit"
  }
}
```

### 12.11 開発フロー（推奨）

```
1. 初回セットアップ
   └── eas init → Development Build 作成 → Orbit でインストール

2. 日常開発
   └── pnpm dev → Development Build で動作確認

3. PR 作成時
   └── EAS Workflows が自動で Preview Update を作成
   └── QR コードで Development Build からプレビュー

4. マージ後
   └── EAS Workflows が自動でビルド・ストア提出

5. 緊急修正（Hotfix）
   └── hotfix/* ブランチにプッシュ
   └── EAS Update で即時 OTA 配信（審査不要）
```

---

## 13. 制約事項と注意点

### 13.1 React Native Fetch API の制限

| 機能 | サポート状況 | 回避策 |
|------|-------------|--------|
| File/Blob | 非サポート | Base64 エンコード |
| Event Iterator | 制限あり | `expo/fetch` を使用 |
| Streaming | 制限あり | `expo/fetch` で対応可能 |

### 13.2 プラットフォーム固有の注意点

**iOS:**
- `shadow-*` クラスは完全サポート
- SafeAreaView の使用を推奨
- コードプッシュには Apple の審査ガイドライン遵守が必要

**Android:**
- シャドウは `elevation` プロパティを使用
- 権限の明示的な要求が必要
- BackHandler でバックボタン処理

### 13.3 パフォーマンス最適化

```tsx
// FlatList の最適化
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={renderItem}
  // パフォーマンス設定
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={10}
  // メモ化されたレンダー関数
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### 13.4 禁止事項

Web版（FRONTEND.md）と同様に以下は禁止:

- **Class コンポーネント**: 関数コンポーネントのみ使用
- **Enum の使用**: const assertion を使用
- **Redux/Zustand**: Context API + TanStack Query を使用
- **CSS-in-JS**: NativeWind (Tailwind) を使用
- **インラインスタイル**: className のみ使用

**モバイル固有の禁止事項:**

- **AsyncStorage へのアプリデータ保存**: サーバーが SSOT のため禁止（認証情報は SecureStore を使用）
- **MMKV へのアプリデータ保存**: 同上
- **ローカルデータベース（SQLite等）**: オフラインファーストは将来対応
- **バージョンなし API（`/api/user/rpc`）**: 必ず `/api/user/v1/rpc` を使用

---

## 変更履歴

### 2025年1月
- 初版作成
- Expo SDK 54+ / React Native 0.83+ 対応
- oRPC + TanStack Query 統合
- Better-Auth Expo プラグイン対応
- NativeWind v4 対応

---

## 参考リンク

### Expo サービス
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [EAS Workflows](https://docs.expo.dev/eas/workflows/get-started/)
- [EAS Metadata](https://docs.expo.dev/eas/metadata/)
- [Expo Orbit](https://expo.dev/orbit)
- [Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)

### フレームワーク・ライブラリ
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [oRPC React Native Adapter](https://orpc.dev/docs/adapters/react-native)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [TanStack Query](https://tanstack.com/query/latest)

### セットアップガイド
- [Expo Monorepo Guide](https://docs.expo.dev/guides/monorepos/)
- [expo-monorepo-example (byCedric)](https://github.com/byCedric/expo-monorepo-example)
