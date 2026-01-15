# Design: add-settings-screen

## 概要

この設計ドキュメントでは、設定画面とテーマカスタマイズ機能のアーキテクチャについて説明する。

## テーマシステムのアーキテクチャ

### アプローチの選択

React Native + NativeWind（Tailwind CSS）環境でのテーマカスタマイズには複数のアプローチが考えられる。

| アプローチ | メリット | デメリット |
|-----------|---------|-----------|
| **A. CSS Variables** | 動的変更が容易 | NativeWind での CSS Variables サポートが限定的 |
| **B. Context + StyleSheet** | パフォーマンス良好 | Tailwind クラスが使えない |
| **C. Context + 動的クラス名** | Tailwind 統合可能 | ビルド時にクラスが除外される可能性 |
| **D. プリセットテーマ + Context** | シンプル、確実に動作 | カスタマイズ性が限定的 |

**採用: D. プリセットテーマ + Context**

理由：
- NativeWind は Tailwind のクラス名をビルド時に静的解析するため、動的クラス名生成は困難
- プリセットテーマであれば、すべてのクラス名を事前に定義でき、確実に動作する
- 将来的にカスタムカラー対応が必要になった場合は、StyleSheet ベースの拡張が可能

### テーマプリセット（16種類、5カテゴリ）

```typescript
// apps/mobile/src/constants/theme.ts

export const THEME_PRESETS = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ウォーム系
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  honey: {
    id: 'honey',
    name: '🍯 ハニー',
    previewColor: '#D97706',
    colors: {
      background: 'bg-amber-50',
      backgroundDark: 'bg-amber-100',
      primary: 'bg-amber-600',
      primaryHex: '#D97706',
      primaryText: 'text-amber-600',
      primaryActive: 'active:bg-amber-700',
      secondary: 'text-stone-500',
      secondaryHex: '#78716C',
      text: 'text-stone-800',
      textMuted: 'text-stone-500',
      border: 'border-amber-200',
      borderHex: '#FDE68A',
      card: 'bg-white',
      cardBorder: 'border-amber-200',
    },
  },
  sunset: { /* 🌅 サンセット - orange系 */ },
  coffee: { /* ☕ コーヒー - yellow-900系 */ },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // クール系
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ocean: { /* 🌊 オーシャン - cyan系 */ },
  sky: { /* 🩵 スカイ - blue系 */ },
  mint: { /* 🌿 ミント - teal系 */ },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ナチュラル系
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  forest: { /* 🌲 フォレスト - emerald系 */ },
  lime: { /* 🍀 ライム - lime系 */ },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ロマンティック系
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sakura: { /* 🌸 さくら - pink系 */ },
  rose: { /* 🌹 ローズ - rose系 */ },
  lavender: { /* 💜 ラベンダー - violet系 */ },
  grape: { /* 🍇 グレープ - purple系 */ },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // モノトーン系
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  stone: { /* 🪨 ストーン - stone系 */ },
  slate: { /* 🌑 スレート - slate系 */ },
  midnight: { /* 🌙 ミッドナイト - slate-800系 */ },
} as const

export type ThemeId = keyof typeof THEME_PRESETS
export type Theme = (typeof THEME_PRESETS)[ThemeId]
export type ThemeColors = Theme['colors']

export const DEFAULT_THEME_ID: ThemeId = 'honey'
```

### テーマカラーの構成

各テーマは以下のプロパティを持つ：

| プロパティ | 説明 |
|-----------|------|
| `id` | テーマ識別子 |
| `name` | 絵文字付き表示名 |
| `previewColor` | テーマ選択UIで表示するプレビュー色（Hex値） |
| `colors.background` | 背景色 Tailwind クラス |
| `colors.backgroundDark` | 濃い背景色 Tailwind クラス |
| `colors.primary` | プライマリカラー Tailwind クラス |
| `colors.primaryHex` | プライマリカラー Hex値（ネイティブUI用） |
| `colors.primaryText` | プライマリテキスト色 Tailwind クラス |
| `colors.primaryActive` | アクティブ時のプライマリカラー |
| `colors.secondary` | セカンダリカラー Tailwind クラス |
| `colors.secondaryHex` | セカンダリカラー Hex値 |
| `colors.text` | メインテキスト色 Tailwind クラス |
| `colors.textMuted` | 補助テキスト色 Tailwind クラス |
| `colors.border` | ボーダー色 Tailwind クラス |
| `colors.borderHex` | ボーダー色 Hex値 |
| `colors.card` | カード背景色 Tailwind クラス |
| `colors.cardBorder` | カードボーダー色 Tailwind クラス |

### ThemeProvider の設計

```typescript
// apps/mobile/src/providers/ThemeProvider.tsx

interface ThemeContextValue {
  themeId: ThemeId
  theme: Theme
  colors: ThemeColors
  setTheme: (id: ThemeId) => Promise<void>
  isLoading: boolean
}

// ThemeProvider は以下を担当:
// 1. AsyncStorage からテーマ設定を読み込み
// 2. サーバーとの同期（UserSettings API）
// 3. テーマ変更時の即時反映 + サーバー保存
```

### 永続化戦略

```
[ローカル優先、サーバー同期]

1. アプリ起動時
   - AsyncStorage から themeId を読み込み（即時表示）
   - サーバーから UserSettings を取得
   - サーバーの値が存在すればローカルを上書き

2. テーマ変更時
   - 即座に Context を更新（UI 反映）
   - AsyncStorage に保存（オフライン対応）
   - バックグラウンドでサーバーに同期

3. オフライン時
   - ローカル変更は AsyncStorage に保存
   - オンライン復帰時にサーバーと同期
```

## データモデル拡張

### Prisma Schema

```prisma
model UserSettings {
  id                    String    @id @default(uuid())
  deviceId              String    @unique
  notificationFrequency String    @default("daily")
  onboardingCompletedAt DateTime?
  themeId               String    @default("honey")  // 追加（デフォルト: honey）
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  device                Device    @relation(fields: [deviceId], references: [deviceId], onDelete: Cascade)
}
```

### API 拡張

既存の `updateSettings` API を拡張して `themeId` を受け付ける。

```typescript
// 入力スキーマ（16種類のテーマIDを許容）
const themeIds = [
  // ウォーム系
  'honey', 'sunset', 'coffee',
  // クール系
  'ocean', 'sky', 'mint',
  // ナチュラル系
  'forest', 'lime',
  // ロマンティック系
  'sakura', 'rose', 'lavender', 'grape',
  // モノトーン系
  'stone', 'slate', 'midnight',
] as const

const UpdateSettingsInput = z.object({
  notificationFrequency: z.enum(['daily', 'every3days', 'weekly', 'monthly']).optional(),
  themeId: z.enum(themeIds).optional(),  // 追加
})
```

## コンポーネント設計

### 設定画面の構造

```
SettingsScreen
├── SafeAreaView
│   ├── Header (閉じるボタン)
│   └── ScrollView
│       ├── ProfileSection
│       │   └── プロフィールカード（アイコン + 匿名ユーザー表示）
│       ├── ThemeSection
│       │   ├── セクションタイトル
│       │   └── ThemeSelector（4つのプリセット選択）
│       ├── LegalSection
│       │   ├── 利用規約リンク
│       │   └── プライバシーポリシーリンク
│       ├── DataSection
│       │   └── データ削除ボタン
│       └── AppInfoSection
│           └── バージョン情報
```

### テーマセレクターUI

```
+------------------------------------------+
|  テーマ                                   |
+------------------------------------------+
|  [●] Default   [○] Cool                  |
|      (Warm)                               |
|  [○] Nature    [○] Minimal               |
+------------------------------------------+

各テーマは:
- 丸いカラーサンプル（プライマリカラー）
- テーマ名
- 選択中は外枠ハイライト
```

## 画面遷移とテーマ適用

### テーマ適用対象

以下の画面/コンポーネントでテーマカラーを使用：

| 画面/コンポーネント | 適用箇所 |
|-------------------|---------|
| SwipeNavigator | 背景色、ローディング/エラー表示 |
| HomePageContent | 背景、テキスト、ボタン、カード |
| CategoryPage | 背景、テキスト |
| TimelinePage | 背景、テキスト、カード |
| PageIndicator | アクティブインジケーター |
| BottomSheet各種 | 背景、テキスト、ボタン |
| SettingsScreen | 全体 |

### テーマ適用方法

各コンポーネントで `useTheme()` フックを使用してカラークラスを取得：

```tsx
function SomeComponent() {
  const { colors } = useTheme()

  return (
    <View className={`flex-1 ${colors.background}`}>
      <Text className={colors.text}>Hello</Text>
      <Pressable className={`rounded-full ${colors.primary} ${colors.primaryActive}`}>
        <Text className="text-white">Button</Text>
      </Pressable>
    </View>
  )
}
```

## パフォーマンス考慮事項

1. **テーマ変更時の再レンダリング**
   - ThemeProvider の value を useMemo でメモ化
   - 必要なコンポーネントのみ colors を参照

2. **起動時のちらつき防止**
   - AsyncStorage からの読み込みを SplashScreen 表示中に完了
   - 初期値はデフォルトテーマを使用

3. **サーバー同期の非同期化**
   - テーマ変更は即座にローカル反映
   - サーバー同期は debounce してバッチ処理
