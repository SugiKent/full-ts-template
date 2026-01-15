# Design: enable-item-detail-sheet

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                      ItemDetailSheet                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ useItemMutation │  │ useStepMutation │  │useAiSuggest │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
│           │                    │                   │        │
└───────────┼────────────────────┼───────────────────┼────────┘
            │                    │                   │
            ▼                    ▼                   ▼
      ┌──────────────────────────────────────────────────┐
      │                   orpcClient                      │
      │   item.update  step.create  step.toggle  ai.suggest │
      └──────────────────────────────────────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ Server API   │
                        │ (v1 Router)  │
                        └──────────────┘
```

## カスタムフック設計

### useItemMutation

```typescript
interface UseItemMutationOptions {
  onSuccess?: (item: WishlistItem) => void
  onError?: (error: Error) => void
}

interface UseItemMutationReturn {
  updateItem: (id: string, data: { title?: string }) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  isUpdating: boolean
  isDeleting: boolean
  error: Error | null
}
```

### useStepMutation

```typescript
interface UseStepMutationOptions {
  itemId: string
  onStepCreated?: (step: Step) => void
  onStepToggled?: (step: Step) => void
  onStepDeleted?: (stepId: string) => void
  onError?: (error: Error) => void
}

interface UseStepMutationReturn {
  createStep: (title: string) => Promise<void>
  toggleStep: (stepId: string) => Promise<void>
  deleteStep: (stepId: string) => Promise<void>
  isCreating: boolean
  pendingToggleIds: Set<string>  // 複数同時トグル対応
  pendingDeleteIds: Set<string>
  error: Error | null
}
```

### useAiSuggestion

```typescript
interface UseAiSuggestionOptions {
  onSuccess?: (suggestions: SuggestedStep[]) => void
  onError?: (error: Error) => void
}

interface SuggestedStep {
  title: string
  description?: string
}

interface UseAiSuggestionReturn {
  suggest: (params: {
    itemTitle: string
    categoryIds?: string[]
    existingSteps?: string[]
    completedSteps?: string[]
  }) => Promise<SuggestedStep[]>
  suggestions: SuggestedStep[]
  isLoading: boolean
  error: Error | null
}
```

## 楽観的更新パターン

### ステップ完了トグルの例

```typescript
const handleStepToggle = async (stepId: string) => {
  // 1. 楽観的に UI を更新
  setSteps(prev => prev.map(s =>
    s.id === stepId ? { ...s, isCompleted: !s.isCompleted } : s
  ))

  try {
    // 2. API 呼び出し
    await orpcClient.step.toggleComplete({ id: stepId })
  } catch (error) {
    // 3. エラー時はロールバック
    setSteps(prev => prev.map(s =>
      s.id === stepId ? { ...s, isCompleted: !s.isCompleted } : s
    ))
    showToast('ステップの更新に失敗しました')
  }
}
```

## AIステップ提案UI

### 提案モーダル/シート

```
┌─────────────────────────────────────┐
│  AIがステップを提案中...            │  ← ローディング状態
│  ░░░░░░░░░░░░░░░░░░░░               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  おすすめのステップ                  │
│                                     │
│  ☐ 旅行先の候補をリストアップ        │
│  ☐ 航空券の価格を比較する            │
│  ☐ ホテルの口コミを確認する          │
│  ☐ 現地の観光スポットを調べる        │
│                                     │
│  [選択したステップを追加]            │
└─────────────────────────────────────┘
```

## アイテム編集UI

### インライン編集

シートヘッダー部分をタップ可能にし、編集モードに切り替え：

```
通常モード:
┌─────────────────────────────────────┐
│  ヨーロッパ旅行に行く        [✕]    │
│  🌍 旅行                            │
└─────────────────────────────────────┘

編集モード:
┌─────────────────────────────────────┐
│  [ヨーロッパ旅行に行く____]  [✓][✕] │
│  🌍 旅行                            │
└─────────────────────────────────────┘
```

## エラーハンドリング

### トースト通知

ライブラリ: **react-native-toast-message** を使用

```bash
pnpm add react-native-toast-message --filter @repo/mobile
```

#### セットアップ

```typescript
// apps/mobile/app/_layout.tsx
import Toast from 'react-native-toast-message'

export default function RootLayout() {
  return (
    <>
      {/* 既存のレイアウト */}
      <Toast />
    </>
  )
}
```

#### 使用方法

```typescript
import Toast from 'react-native-toast-message'

// 成功トースト（2秒で自動消去）
Toast.show({
  type: 'success',
  text1: '保存しました',
  visibilityTime: 2000,
})

// エラートースト（タップで消去）
Toast.show({
  type: 'error',
  text1: 'ステップの更新に失敗しました',
  autoHide: false,
})

// 情報トースト（2秒で自動消去）
Toast.show({
  type: 'info',
  text1: 'AIがステップを提案中...',
  visibilityTime: 2000,
})
```

#### トーストヘルパー関数

```typescript
// apps/mobile/src/utils/toast.ts
import Toast from 'react-native-toast-message'

export const showSuccessToast = (message: string) => {
  Toast.show({ type: 'success', text1: message, visibilityTime: 2000 })
}

export const showErrorToast = (message: string) => {
  Toast.show({ type: 'error', text1: message, autoHide: false })
}

export const showInfoToast = (message: string) => {
  Toast.show({ type: 'info', text1: message, visibilityTime: 2000 })
}
```

## データフロー

### 状態の同期

```
HomePageContent.items (state)
       │
       ├─── 初期値: mockWishlistItems (現状)
       │    └── 将来: API から取得
       │
       ├─── 更新: ItemDetailSheet からのコールバック
       │    ├── onItemUpdate(updatedItem)
       │    ├── onItemDelete(itemId)
       │    └── (steps は item.steps として含まれる)
       │
       └─── 表示: CategorySection, MonthlyGoalCard
```

## トレードオフ

### 楽観的更新 vs 確定後更新

**選択: 楽観的更新**

理由:
- UXが良い（即時フィードバック）
- ステップ操作は頻繁に行われる
- エラー発生率は低い想定

リスク軽減:
- エラー時は視覚的にロールバック + トースト表示
- ネットワーク切断時は操作をブロック（将来対応）

### 状態管理ライブラリ導入 vs ローカルstate

**選択: ローカルstate維持**

理由:
- 現状の実装に近く、変更量が最小
- 単一コンポーネント内で完結
- 将来的なサーバー同期移行時に全面的に変更予定

## ファイル構成

```
apps/mobile/src/
├── hooks/
│   ├── useItemMutation.ts      # NEW - アイテム更新・削除
│   ├── useStepMutation.ts      # NEW - ステップCRUD
│   └── useAiSuggestion.ts      # NEW - AI提案
├── components/
│   ├── common/
│   │   └── Toast.tsx           # NEW - トースト設定（_layout.tsx用）
│   └── home/
│       ├── ItemDetailSheet.tsx # MODIFY - API連携追加
│       ├── HomePageContent.tsx # MODIFY - コールバック追加
│       └── AiSuggestionSheet.tsx # NEW - AI提案UI
└── utils/
    └── toast.ts                # NEW - トーストヘルパー関数
```

## 依存関係

### 新規パッケージ

```bash
pnpm add react-native-toast-message --filter @repo/mobile
```

### 既存API依存

以下のサーバーAPIエンドポイントが既に実装済みであること:

- `v1.item.update` - アイテム更新
- `v1.item.delete` - アイテム削除
- `v1.step.create` - ステップ作成
- `v1.step.toggleComplete` - ステップ完了トグル
- `v1.step.delete` - ステップ削除
- `v1.ai.suggest` - AIステップ提案
