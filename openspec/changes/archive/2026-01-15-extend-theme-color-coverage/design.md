# Design: extend-theme-color-coverage

## 概要

このドキュメントでは、テーマカラーの影響範囲を拡大するための技術設計について説明する。

## 現状分析

### テーマ適用済みのコンポーネント

| コンポーネント | 適用箇所 |
|---------------|---------|
| HomePageContent | 背景色、ローディング/エラー状態、ボタン |
| TimelinePage | 背景色、ローディング/エラー状態、ボタン |
| CategoryPage | 背景色 |
| SwipeNavigator | ローディング/エラー状態 |

### ハードコードされているコンポーネント

| コンポーネント | ハードコード内容 |
|---------------|-----------------|
| WishlistItemCard | `text-stone-*`, `border-stone-*`, `text-amber-*` |
| ItemDetailSheet | `gray-*`, `amber-*` 全般 |
| MonthlyGoalCard | 独自の `CARD_COLORS` パレット |
| TimelineEntryCard | `amber-*`, `green-*`, `blue-*`, `stone-*` |
| DateSeparator | `bg-stone-200`, `text-stone-500` |

## カラートークン設計

### 新規トークン

```typescript
// theme.ts に追加するカラートークン
{
  // 進捗バー
  progressBar: 'bg-amber-600',      // 進捗バーのフォアグラウンド
  progressBarHex: '#D97706',        // SVG用のHex値
  progressBarBg: 'bg-amber-100',    // 進捗バーの背景

  // 成功状態
  success: 'bg-green-500',          // 完了アイコンなど
  successText: 'text-green-600',    // 成功テキスト

  // カードとインタラクション
  cardActive: 'active:bg-amber-50', // カードのactive状態

  // バッジ
  badgeBg: 'bg-amber-100',          // バッジ背景
  badgeText: 'text-amber-700',      // バッジテキスト

  // その他
  divider: 'bg-stone-200',          // ディバイダー
  dividerHex: '#E7E5E4',            // SVG用のHex値
  iconBg: 'bg-amber-100',           // アイコン背景
  iconColor: '#D97706',             // アイコンのHex色
}
```

### テーマごとのトークン値

各テーマで一貫した見た目を実現するため、以下のようにトークンを設定：

| テーマ | progressBar | badgeBg | divider |
|--------|-------------|---------|---------|
| honey | bg-amber-600 | bg-amber-100 | bg-amber-200 |
| sunset | bg-orange-600 | bg-orange-100 | bg-orange-200 |
| ocean | bg-cyan-600 | bg-cyan-100 | bg-cyan-200 |
| sakura | bg-pink-600 | bg-pink-100 | bg-pink-200 |
| forest | bg-emerald-600 | bg-emerald-100 | bg-emerald-200 |

## 実装方針

### NativeWind の制約

NativeWind は Tailwind クラスをビルド時に静的解析するため、以下の制約がある：

1. **動的クラス名は使用不可**: `bg-${color}-500` のような動的生成は不可
2. **すべてのクラスを事前定義**: 使用するクラスは `theme.ts` 内で文字列リテラルとして定義

```typescript
// ❌ 動的生成は不可
const bgClass = `bg-${theme.color}-500`

// ✅ 事前定義されたクラスを使用
const bgClass = colors.background
```

### コンポーネントの更新パターン

```tsx
// Before: ハードコード
function Component() {
  return (
    <View className="border-stone-100">
      <Text className="text-stone-800">Title</Text>
    </View>
  )
}

// After: テーマ対応
function Component() {
  const { colors } = useTheme()
  return (
    <View className={`border ${colors.border}`}>
      <Text className={colors.text}>Title</Text>
    </View>
  )
}
```

### SVG / lucide-react-native への対応

SVGコンポーネント（CircularProgress, lucide icons）は Tailwind クラスではなく Hex 値を使用：

```tsx
// Before
<CircularProgress color="#78716C" backgroundColor="#E7E5E4" />

// After
<CircularProgress
  color={colors.progressBarHex}
  backgroundColor={colors.progressBarBgHex}
/>
```

## 完了/成功状態の扱い

### アプローチ選択

完了状態（チェックマーク、完了カード等）の色については、2つのアプローチを検討：

**A. テーマ連動**: 完了状態もテーマカラーで表示
- メリット: 完全な一貫性
- デメリット: 「完了」の意味が色で伝わりにくくなる

**B. 固定色**: 完了状態は緑系で固定、それ以外はテーマ連動
- メリット: 「完了＝緑」という直感的な理解を維持
- デメリット: 一部の色がテーマと調和しない可能性

**採用: 折衷案（コンポーネントによって使い分け）**

- **チェックマーク/チェックボックス**: テーマの `primary` を使用（テーマ連動）
- **タイムラインの完了カード**: 緑/青の固定色を維持（意味を明確に）

## パフォーマンス考慮

1. **Context の値をメモ化**: ThemeProvider で `useMemo` を使用済み
2. **必要なコンポーネントのみ useTheme を呼び出し**: 不要な再レンダリングを避ける
3. **カラートークンの参照コスト**: オブジェクトプロパティアクセスのみで軽微

## 移行リスク

1. **ビルド時のクラス欠落**: 新しいクラスが NativeWind のビルドに含まれない可能性
   - 対策: `theme.ts` で明示的に全クラスを定義

2. **視認性の問題**: 特定のテーマで読みにくい色の組み合わせ
   - 対策: 各テーマで実機テスト実施

3. **既存コードへの影響**: 大量のコンポーネント変更
   - 対策: 段階的に適用、各コンポーネントごとにテスト
