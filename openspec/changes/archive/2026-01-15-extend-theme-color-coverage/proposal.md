# Proposal: extend-theme-color-coverage

## What

テーマカラーの影響範囲を拡大し、現在ハードコードされている色をテーマ対応に変更する。これにより、ユーザーがテーマを変更した際に、アプリ全体で一貫したカラースキームが適用される。

## Why

1. **テーマ適用の不整合**: 現在、テーマカラーは一部のコンポーネント（背景、ローディング状態、エラー表示）にのみ適用されており、多くのUIコンポーネントがハードコードされた色を使用している
2. **ユーザー体験の一貫性**: テーマを変更しても、カード内のテキストやボーダー、進捗インジケーター等が変わらないため、「テーマが変わった」という印象が薄い
3. **パーソナライゼーションの強化**: 色の影響範囲を広げることで、ユーザーの愛着とエンゲージメントが向上する

## 変更内容

### 影響するスペック

| スペック | 変更種別 | 説明 |
|----------|----------|------|
| `theme-customization` | **新規** | テーマカラー適用範囲の要件を定義 |

### テーマ適用対象の拡大

#### 1. WishlistItemCard
- テキスト色（完了/未完了）
- ボーダー色
- 「今月やること」バッジの色
- 進捗インジケーターの色

#### 2. ItemDetailSheet
- タイトルテキスト色
- カテゴリータグ色
- 進捗カード色
- ステップリストの色
- ボタン色（追加、削除）
- AI提案セクションの色

#### 3. MonthlyGoalCard
- カードの背景色・ボーダー色
- テキスト色
- 完了バッジの色
- 進捗インジケーターの色

#### 4. TimelineEntryCard
- ジャーナルカードの色
- アイコン背景の色
- テキスト色

#### 5. 日付セパレーター
- ライン色
- テキスト色

#### 6. CategorySection
- セクションタイトル色
- ディバイダー色

### テーマカラートークンの拡張

現在のトークンに加え、以下のトークンを追加：

| トークン | 用途 | 例 |
|----------|------|-----|
| `progressBar` | 進捗バーの色 | `bg-amber-600` |
| `progressBarBg` | 進捗バー背景の色 | `bg-amber-100` |
| `success` | 完了・成功状態の色 | `bg-green-500` |
| `successText` | 完了・成功テキストの色 | `text-green-600` |
| `cardActive` | カードの active 状態 | `active:bg-amber-50` |
| `badgeBg` | バッジ背景色 | `bg-amber-100` |
| `badgeText` | バッジテキスト色 | `text-amber-700` |
| `divider` | ディバイダー色 | `bg-stone-200` |

## 実装上の考慮事項

### NativeWind の静的解析制限

NativeWind は Tailwind クラスをビルド時に静的解析するため、すべてのクラス名を `theme.ts` に事前定義する必要がある。動的クラス名生成は不可。

### 段階的な適用

1. **フェーズ1**: カラートークンの拡張と型定義
2. **フェーズ2**: 各コンポーネントへの適用
3. **フェーズ3**: テスト・動作確認

### 後方互換性

- 既存のテーマ選択機能は維持
- サーバーとの同期方式は変更なし

## 影響範囲

### モバイルアプリ

- `apps/mobile/src/constants/theme.ts` - カラートークン追加
- `apps/mobile/src/components/home/WishlistItemCard.tsx`
- `apps/mobile/src/components/home/ItemDetailSheet.tsx`
- `apps/mobile/src/components/home/MonthlyGoalCard.tsx`
- `apps/mobile/src/components/home/CircularProgress.tsx`
- `apps/mobile/src/components/home/CategorySection.tsx`
- `apps/mobile/src/components/timeline/TimelineEntryCard.tsx`
- `apps/mobile/src/components/timeline/TimelinePage.tsx`
