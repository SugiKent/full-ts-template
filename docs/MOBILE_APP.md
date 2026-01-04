# モバイルアプリ開発規約

このドキュメントは、Expo + React Native を使用したモバイルアプリ開発の規約とベストプラクティスを説明します。

**関連ドキュメント:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 全体アーキテクチャ
- [BACKEND.md](./BACKEND.md) - バックエンド開発規約
- [FRONTEND.md](./FRONTEND.md) - Web フロントエンド開発規約
- [AUTH.md](./AUTH.md) - 認証実装

## 目次

1. [技術スタック](#1-技術スタック)
2. [プロジェクト構造](#2-プロジェクト構造)
3. [セットアップ手順](#3-セットアップ手順)
4. [oRPC クライアント設計](#4-orpc-クライアント設計)
5. [認証フロー](#5-認証フロー)
6. [NativeWind (Tailwind CSS)](#6-nativewind-tailwind-css)
7. [多言語対応（i18n）](#7-多言語対応i18n)
8. [ナビゲーション設計](#8-ナビゲーション設計)
9. [状態管理](#9-状態管理)
10. [開発・ビルド・デプロイ](#10-開発ビルドデプロイ)
11. [制約事項と注意点](#11-制約事項と注意点)

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
| 認証 | Better-Auth | 1.3+ | @better-auth/expo プラグイン |
| 多言語 | i18next | - | react-i18next + expo-localization |
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
| 認証 | Cookie ベース | SecureStore ベース |
| 型共有 | @repo/shared | @repo/shared |

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
│   ├── (auth)/                   # 認証フローグループ
│   │   ├── _layout.tsx           # 認証レイアウト
│   │   ├── login.tsx             # ログイン画面
│   │   └── magic-link.tsx        # マジックリンク確認
│   ├── _layout.tsx               # ルートレイアウト
│   └── +not-found.tsx            # 404 画面
├── src/
│   ├── components/               # 共通コンポーネント
│   │   ├── ui/                   # 基本UIコンポーネント
│   │   └── features/             # 機能別コンポーネント
│   ├── hooks/                    # カスタムフック
│   │   ├── useAuth.ts            # 認証フック
│   │   └── useOrpc.ts            # oRPC フック
│   ├── services/                 # 外部サービス連携
│   │   ├── orpc-client.ts        # oRPC クライアント
│   │   └── auth-client.ts        # Better-Auth クライアント
│   ├── providers/                # Context プロバイダー
│   │   ├── AuthProvider.tsx
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
  "name": "@repo/mobile",
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
    "@repo/shared": "workspace:*",
    "expo": "~54.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-localization": "~16.0.0",
    "react": "19.0.0",
    "react-native": "0.83.0",
    "@orpc/client": "^1.13.0",
    "@tanstack/react-query": "^5.0.0",
    "better-auth": "^1.3.0",
    "@better-auth/expo": "^1.3.0",
    "i18next": "^24.0.0",
    "react-i18next": "^15.0.0",
    "nativewind": "^4.0.0"
  },
  "devDependencies": {
    "@repo/server": "workspace:*",
    "@repo/typescript-config": "workspace:*",
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
  "extends": "@repo/typescript-config/base.json",
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
pnpm --filter @repo/mobile dev
```

> **初回のみ:** Development Build の作成には 10〜20 分程度かかります。ビルド完了後は、JS の変更のみで高速にイテレーションできます。

---

## 4. oRPC クライアント設計

### 4.1 基本設定

```typescript
// apps/mobile/src/services/orpc-client.ts
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import type { UserRouter } from '@repo/server/procedures/user'
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'

// 環境変数からAPI URLを取得
const API_URL = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:8080'

/**
 * expo/fetch を使用した RPCLink
 * Event Iterator をサポート
 */
const link = new RPCLink({
  url: `${API_URL}/api/user/rpc`,
  async fetch(request, init) {
    // expo/fetch を動的インポート
    const { fetch } = await import('expo/fetch')

    // SecureStore からトークンを取得
    const token = await SecureStore.getItemAsync('session_token')

    const headers = new Headers(request.headers)
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    return fetch(request.url, {
      body: await request.blob(),
      headers,
      method: request.method,
      signal: request.signal,
      ...init,
    })
  },
})

/**
 * oRPC クライアントインスタンス
 */
export const orpcClient: RouterClient<UserRouter> = createORPCClient(link)
```

### 4.2 TanStack Query との統合

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

### 4.3 カスタムフックの実装

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

### 4.4 コンポーネントでの使用例

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

## 5. 認証フロー

### 5.1 Better-Auth クライアント設定

```typescript
// apps/mobile/src/services/auth-client.ts
import { createAuthClient } from 'better-auth/react'
import { expoClient } from '@better-auth/expo'
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'

const API_URL = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:8080'
const APP_SCHEME = Constants.expoConfig?.scheme ?? 'myapp'

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      // アプリの URL スキーム
      scheme: APP_SCHEME,
      // セッションストレージ
      storagePrefix: 'auth_',
      storage: SecureStore,
    }),
  ],
})

// 認証ヘルパー関数をエクスポート
export const {
  signIn,
  signOut,
  useSession,
  getSession,
} = authClient
```

### 5.2 app.json のディープリンク設定

```json
{
  "expo": {
    "name": "MyApp",
    "slug": "myapp",
    "scheme": "myapp",
    "ios": {
      "bundleIdentifier": "com.example.myapp",
      "associatedDomains": ["applinks:yourdomain.com"]
    },
    "android": {
      "package": "com.example.myapp",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "yourdomain.com",
              "pathPrefix": "/auth"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "extra": {
      "apiUrl": "http://localhost:8080"
    }
  }
}
```

### 5.3 認証プロバイダー

```tsx
// apps/mobile/src/providers/AuthProvider.tsx
import { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { useSession, signOut, getSession } from '@/services/auth-client'
import { useRouter, useSegments } from 'expo-router'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (isPending) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!session?.user && !inAuthGroup) {
      // 未認証ユーザーをログイン画面へリダイレクト
      router.replace('/(auth)/login')
    } else if (session?.user && inAuthGroup) {
      // 認証済みユーザーをホーム画面へリダイレクト
      router.replace('/(tabs)')
    }
  }, [session, isPending, segments])

  const logout = async () => {
    await signOut()
    router.replace('/(auth)/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        isLoading: isPending,
        logout,
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

### 5.4 マジックリンクログイン画面

```tsx
// apps/mobile/app/(auth)/login.tsx
import { useState } from 'react'
import { View, Text, TextInput, Pressable, Alert } from 'react-native'
import { authClient } from '@/services/auth-client'
import { useTranslation } from 'react-i18next'

export default function LoginScreen() {
  const { t } = useTranslation('auth')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSendMagicLink = async () => {
    if (!email) return

    setIsLoading(true)
    try {
      await authClient.signIn.magicLink({ email })
      setIsSent(true)
      Alert.alert(
        t('magicLink.sent'),
        t('magicLink.checkEmail')
      )
    } catch (error) {
      Alert.alert(
        t('error.title'),
        t('error.sendFailed')
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold text-center mb-8">
        {t('login.title')}
      </Text>

      {!isSent ? (
        <>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
            placeholder={t('login.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Pressable
            className="bg-blue-600 rounded-lg py-3 items-center disabled:bg-gray-400"
            onPress={handleSendMagicLink}
            disabled={isLoading || !email}
          >
            <Text className="text-white font-semibold">
              {isLoading ? t('common.loading') : t('login.sendMagicLink')}
            </Text>
          </Pressable>
        </>
      ) : (
        <View className="items-center">
          <Text className="text-lg text-center text-gray-600 mb-4">
            {t('magicLink.instructions')}
          </Text>
          <Pressable onPress={() => setIsSent(false)}>
            <Text className="text-blue-600">{t('login.resend')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}
```

---

## 6. NativeWind (Tailwind CSS)

### 6.1 セットアップ

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

### 6.2 使用例

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

### 6.3 Web版との互換性

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

### 6.4 プラットフォーム固有のスタイル

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

## 7. 多言語対応（i18n）

### 7.1 設定

```typescript
// apps/mobile/src/i18n/index.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import {
  SUPPORTED_LANGUAGES,
  FALLBACK_LANGUAGE,
  DEFAULT_NAMESPACE,
} from '@shared/config/i18n'

// 翻訳リソースをインポート
// 注意: React Native では require() を使用
const resources = {
  ja: {
    common: require('./locales/ja/common.json'),
    auth: require('./locales/ja/auth.json'),
  },
  // 他の言語を追加する場合はここに追加
}

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3', // React Native 用
  resources,
  lng: Localization.locale.split('-')[0], // デバイス言語
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  defaultNS: DEFAULT_NAMESPACE,
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
```

### 7.2 翻訳ファイルの配置

```
apps/mobile/src/i18n/
├── index.ts              # i18n 設定
└── locales/
    └── ja/
        ├── common.json   # 共通翻訳
        └── auth.json     # 認証画面翻訳
```

**注意:** Web版（`apps/client/src/locales/`）の翻訳ファイルをコピーするか、シンボリックリンクを使用して共有することを推奨します。

### 7.3 使用例

```tsx
import { useTranslation } from 'react-i18next'
import { View, Text, Button } from 'react-native'

function WelcomeScreen() {
  const { t, i18n } = useTranslation('common')

  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-2xl font-bold">{t('welcome.title')}</Text>
      <Text className="text-gray-600">{t('welcome.subtitle')}</Text>

      {/* 言語切り替え */}
      <Button
        title={i18n.language === 'ja' ? 'English' : '日本語'}
        onPress={() => i18n.changeLanguage(i18n.language === 'ja' ? 'en' : 'ja')}
      />
    </View>
  )
}
```

---

## 8. ナビゲーション設計

### 8.1 Expo Router のレイアウト構造

```tsx
// apps/mobile/app/_layout.tsx
import { Stack } from 'expo-router'
import { QueryProvider } from '@/providers/QueryProvider'
import { AuthProvider } from '@/providers/AuthProvider'
import '@/i18n' // i18n 初期化

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
        </Stack>
      </AuthProvider>
    </QueryProvider>
  )
}
```

### 8.2 タブナビゲーション

```tsx
// apps/mobile/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Home, Settings, MessageSquare } from 'lucide-react-native'

export default function TabLayout() {
  const { t } = useTranslation('common')

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
          title: t('nav.home'),
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: t('nav.contacts'),
          tabBarIcon: ({ color }) => <MessageSquare color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('nav.settings'),
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  )
}
```

### 8.3 スタックナビゲーション（認証フロー）

```tsx
// apps/mobile/app/(auth)/_layout.tsx
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="magic-link" />
    </Stack>
  )
}
```

### 8.4 ディープリンク対応

```tsx
// apps/mobile/app/(auth)/magic-link.tsx
import { useEffect } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { authClient } from '@/services/auth-client'

export default function MagicLinkScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const router = useRouter()

  useEffect(() => {
    if (token) {
      // マジックリンクトークンを検証
      authClient.signIn
        .magicLink({ token })
        .then(() => {
          router.replace('/(tabs)')
        })
        .catch(() => {
          router.replace('/(auth)/login')
        })
    }
  }, [token])

  return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" />
      <Text className="mt-4 text-gray-600">認証中...</Text>
    </View>
  )
}
```

---

## 9. 状態管理

### 9.1 サーバー状態（TanStack Query）

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

### 9.2 ローカル状態（Context API）

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

## 10. 開発・ビルド・デプロイ（Expo サービスフル活用）

このプロジェクトでは [expo.dev](https://expo.dev) のサービスをフル活用し、ローカル環境のセットアップを最小限に抑えつつ、効率的な開発・CI/CD パイプラインを構築します。

### 10.1 Expo サービス一覧

| サービス | 用途 | 備考 |
|---------|------|------|
| **EAS Build** | クラウドビルド | Mac 不要で iOS ビルド可能 |
| **EAS Submit** | ストア提出自動化 | App Store / Google Play |
| **EAS Update** | OTA アップデート | JS バンドルの即時配信 |
| **EAS Workflows** | CI/CD パイプライン | GitHub 連携 |
| **EAS Metadata** | ストアメタデータ管理 | store.config.json |
| **Expo Orbit** | シミュレーター管理 | デスクトップアプリ |
| **Development Builds** | カスタム開発クライアント | 独自の Expo Go |

### 10.2 開発環境セットアップ

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

### 10.3 Development Build（カスタム開発クライアント）

Development Build は「自分専用の Expo Go」です。ネイティブモジュールを含むカスタムクライアントをビルドし、その後は JS の変更のみ高速にイテレーションできます。

#### なぜ Development Build を使うのか

| 項目 | Expo Go | Development Build |
|------|---------|-------------------|
| ネイティブモジュール | 制限あり | 自由に追加可能 |
| カスタム設定 | 不可 | app.json で自由に設定 |
| ビルド頻度 | 不要 | ネイティブ変更時のみ |
| チーム共有 | - | EAS で配布可能 |

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
pnpm --filter @repo/mobile dev

# または
npx expo start --dev-client
```

### 10.4 環境変数管理

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

### 10.5 EAS Build 設定

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

### 10.6 EAS Update（OTA アップデート）

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

### 10.7 EAS Workflows（CI/CD）

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

### 10.8 EAS Submit（ストア提出）

```bash
# App Store Connect に提出
eas submit --platform ios --latest

# Google Play Console に提出
eas submit --platform android --latest

# 特定のビルドを提出
eas submit --platform ios --id <build-id>
```

### 10.9 EAS Metadata（ストアメタデータ管理）

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

### 10.10 package.json スクリプト（推奨）

```json
{
  "scripts": {
    "dev": "expo start --dev-client",
    "dev:go": "expo start",
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

### 10.11 開発フロー（推奨）

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

## 11. 制約事項と注意点

### 11.1 React Native Fetch API の制限

| 機能 | サポート状況 | 回避策 |
|------|-------------|--------|
| File/Blob | 非サポート | Base64 エンコード |
| Event Iterator | 制限あり | `expo/fetch` を使用 |
| Streaming | 制限あり | `expo/fetch` で対応可能 |

### 11.2 プラットフォーム固有の注意点

**iOS:**
- `shadow-*` クラスは完全サポート
- SafeAreaView の使用を推奨
- コードプッシュには Apple の審査ガイドライン遵守が必要

**Android:**
- シャドウは `elevation` プロパティを使用
- 権限の明示的な要求が必要
- BackHandler でバックボタン処理

### 11.3 パフォーマンス最適化

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

### 11.4 禁止事項

Web版（FRONTEND.md）と同様に以下は禁止:

- **Class コンポーネント**: 関数コンポーネントのみ使用
- **Enum の使用**: const assertion を使用
- **Redux/Zustand**: Context API + TanStack Query を使用
- **CSS-in-JS**: NativeWind (Tailwind) を使用
- **インラインスタイル**: className のみ使用

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
- [Better-Auth Expo Integration](https://www.better-auth.com/docs/integrations/expo)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [TanStack Query](https://tanstack.com/query/latest)

### セットアップガイド
- [Expo Monorepo Guide](https://docs.expo.dev/guides/monorepos/)
- [expo-monorepo-example (byCedric)](https://github.com/byCedric/expo-monorepo-example)
