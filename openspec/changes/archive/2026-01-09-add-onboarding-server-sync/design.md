# 設計書: オンボーディングデータのサーバー同期

## Context

モバイルアプリのオンボーディングフローで収集されたデータを Device ID に紐づけてサーバーに保存する。既存の Device 認証システム（device-auth spec）を活用し、認証済み Procedure を構築する。

## Goals / Non-Goals

**Goals**:
- オンボーディングデータをサーバーに永続化
- Device ID に紐づけたデータ管理
- 認証済み Procedure パターンの確立
- 今後の CRUD 操作の基盤構築

**Non-Goals**:
- オフラインファースト設計（将来対応）
- 複数デバイス間の同期（将来対応）
- リアルタイム同期（将来対応）
- ローカルストレージへのデータ永続化（サーバーが SSOT）

## Decisions

### 1. API バージョニング

**決定**: パスベースのバージョニングを採用

**理由**:
- 後方互換性を維持しながら API を進化させることができる
- クライアントが明示的にバージョンを指定するため、移行が制御しやすい
- URL で一目でバージョンがわかる

**エンドポイント構成**:
```
/api/user/v1/rpc/*  ← 新バージョン（今回追加）
```

**ディレクトリ構成**:
```
apps/server/src/procedures/user/
├── v1/
│   ├── index.ts           # v1 Router
│   ├── device-auth.ts     # 既存を移動
│   ├── onboarding.ts      # 新規
│   ├── category.ts        # 新規
│   ├── wishlist-item.ts   # 新規
│   ├── step.ts            # 新規
│   └── monthly-goal.ts    # 新規
└── index.ts               # 後方互換用（v1 を re-export）
```

**ルート設定**:
```typescript
// apps/server/src/routes/user/rpc.ts
fastify.all('/v1/rpc/*', async (request, reply) => {
  await handler.handle(request, reply, {
    prefix: '/api/user/v1/rpc',
    context,
  })
})
```

**クライアント設定**:
```typescript
// apps/mobile/src/services/orpc-client.ts
const link = new RPCLink({
  url: `${API_URL}/api/user/v1/rpc`,  // v1 を追加
  // ...
})
```

### 2. アプリバージョン追跡

**決定**: X-App-Version と X-OS-Version ヘッダーでクライアント情報を収集

**理由**:
- アプリの利用状況を把握できる
- バージョン別の問題特定に役立つ
- 非推奨バージョンの利用状況を確認できる

**ヘッダー形式**:
```
X-App-Version: 1.2.0
X-OS-Version: iOS/17.0
```

**実装**:
- モバイルアプリ: oRPC クライアントのヘッダーに追加
- サーバー: リクエストからヘッダーを抽出してログ出力
- ログ形式: `{ appVersion: "1.2.0", osVersion: "iOS/17.0", deviceId: "xxx" }`

### 3. DB スキーマ設計

**決定**: すべてのテーブルは `Device.id`（内部 ID）に紐づける

**理由**:
- Device テーブルは既に存在し、`id`（cuid）と `deviceId`（クライアント UUID）を区別している
- `onDelete: Cascade` でデバイス削除時にデータを自動削除

**スキーマ構成**:
```
Device (既存)
├── Category (1:N)
├── WishlistItem (1:N)
│   ├── WishlistItemCategory (N:M 中間テーブル)
│   ├── Step (1:N)
│   └── MonthlyGoal (1:N)
├── MonthlyGoal (1:N、直接参照も可能に)
└── UserSettings (1:1、@unique deviceId)
```

### 4. 認証パターン

**決定**: 2段階のミドルウェアチェーン

```typescript
// デバイス認証のみ（利用規約同意前に使用可能）
const deviceOnly = os.use(requireDevice)

// 完全認証（利用規約同意後のみ）
const authenticated = os.use(requireDevice).use(requireTermsAgreement)
```

**使い分け**:
- `deviceOnly`: `agreeToTerms` など利用規約同意前に呼べる必要があるもの
- `authenticated`: データ CRUD 操作すべて

### 4.1 Single Source of Truth: サーバー

**設計原則**:
- サーバーが唯一のデータソース（SSOT）
- ローカルストレージ（AsyncStorage）へのデータ永続化は行わない
- オンボーディング中は React state（メモリ）で一時保持

**オンボーディング中**（splash → notifications）:
- データは React state（OnboardingProvider）で一時保持
- **呼び出す API**:
  - `agreeToTerms` - terms 画面で利用規約同意を記録
  - `suggestSteps` - steps 画面で AI ステップ提案を取得
- **呼び出さない API**: 個別 CRUD（category, item, step, monthly-goal）
- **完了時**: `completeOnboarding` で全データをサーバーに保存

**オンボーディング後**（ホーム画面以降）:
- サーバーからデータを取得して表示
- 個別 CRUD API を使用してデータを操作
- `suggestSteps` で再提案を取得（completedSteps を渡す）

**オンボーディング画面表示判定**:
- サーバーの `WishlistItem` が 0 件かどうかで判定
- 0 件 → オンボーディング画面、1 件以上 → ホーム画面
- `UserSettings.onboardingCompletedAt` は記録用（判定には使用しない）
- 利用規約同意の有無に関わらず、オンボーディング時は毎回 terms 画面を表示

### 5. オンボーディング完了の処理

**決定**: トランザクションで一括保存

**理由**:
- 部分的な保存失敗を防ぐ
- クライアント ID からサーバー ID へのマッピングを返却可能

**フロー**:
```
Client                          Server
  |                               |
  +-- completeOnboarding() ------>|
  |   {                           |
  |     categories[],             |
  |     items[],                  |  prisma.$transaction
  |     monthlyGoals[],           |    1. 利用規約同意更新
  |     stepsByItem{},            |    2. Category 一括作成
  |     notificationFrequency     |    3. WishlistItem 一括作成
  |   }                           |    4. WishlistItemCategory 一括作成
  |                               |    5. MonthlyGoal 一括作成
  |<-- { idMappings } ------------|    6. Step 一括作成
  |                               |    7. UserSettings 作成
```

### 6. AI ステップ提案

**決定**: OpenRouter SDK を使用した LLM 連携

**理由**:
- 複数の LLM モデル（OpenAI, Anthropic, Google 等）を統一 API でアクセス可能
- Structured Outputs（JSON Schema）でレスポンス形式を保証
- response-healing プラグインで JSON 構文エラーを自動修復

**アーキテクチャ**:
```
apps/server/src/services/
├── llm-provider.service.ts      # LLM 抽象化層（OpenRouter SDK ラッパー）
└── step-suggestion.service.ts   # ステップ提案サービス（ドメイン固有）
```

**LLM 抽象化層** (`llm-provider.service.ts`):
- OpenRouter SDK のラッパー
- JSON Schema を使用した Structured Outputs
- リクエスト/レスポンスのロギング
- エラーハンドリング

**ステップ提案サービス** (`step-suggestion.service.ts`):
- システムプロンプト設計
- JSON Schema 定義（ステップ配列）
- レスポンスのバリデーションと正規化

**入力**:
```typescript
{
  itemTitle: string           // アイテム名（例: 「ヨーロッパ旅行に行く」）
  categoryIds: string[]       // カテゴリー（例: ['travel']）
  existingSteps?: string[]    // 既存ステップ（重複回避用）
  completedSteps?: string[]   // 完了済みステップ（次のアクション提案用）
}
```

**出力**:
```typescript
{
  steps: Array<{
    title: string       // ステップ名
    description?: string // 詳細説明（任意）
  }>
}
```

**利用シーン**:
1. **オンボーディング時**: `completedSteps` は空または未指定。初期ステップを提案
2. **進捗後の再提案**: `completedSteps` に完了済みステップを渡し、次のアクションを提案

**プロンプト設計のポイント**:
- 完了済みステップがある場合は「これまでの進捗を踏まえて」次のステップを提案
- 完了済みステップの内容から進捗度合いを推測し、より具体的・発展的なステップを提案
- 例: 「パスポート確認」「航空券調査」が完了していれば「宿泊先の予約」「現地ツアーの検討」を提案
```

**JSON Schema**:
```typescript
const STEP_SUGGESTION_SCHEMA = {
  name: 'step_suggestion_response',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['title'],
          additionalProperties: false,
        },
      },
    },
    required: ['steps'],
    additionalProperties: false,
  },
}
```

**Procedure**:
```typescript
// apps/server/src/procedures/user/v1/step-suggestion.ts
const suggestSteps = os
  .use(requireDevice)
  .use(requireTermsAgreement)
  .input(SuggestStepsInput)
  .handler(async ({ input, context }) => {
    const suggestions = await suggestStepsForItem({
      itemTitle: input.itemTitle,
      categoryIds: input.categoryIds,
      existingSteps: input.existingSteps,
      completedSteps: input.completedSteps, // 完了済みステップ（任意）
    })
    return { success: true, data: suggestions }
  })
```

**環境変数**:
- `OPENROUTER_API_KEY` - OpenRouter API キー

**モデル選択**:
- デフォルト: `openai/gpt-4o-mini`（高速・低コスト）
- 将来: システム設定で変更可能に

### 7. クライアント ID とサーバー ID のマッピング

**決定**: レスポンスでマッピングを返却

```typescript
{
  success: true,
  data: {
    categoryIdMap: { 'client-id-1': 'server-id-abc', ... },
    itemIdMap: { 'item-1234': 'server-id-xyz', ... },
  }
}
```

**理由**:
- クライアント側でローカルデータを更新可能
- 今後の同期処理で ID 参照が必要

## Risks / Trade-offs

**リスク**: ネットワークエラー時のデータ損失
- **緩和策**: React state でデータを保持し、リトライ UI を提供（サーバー保存成功までデータは state に残る）

**リスク**: トランザクションが大きくなりタイムアウト
- **緩和策**: 10 アイテム × 10 ステップ = 100 レコード程度なら問題なし

## Migration Plan

1. DB マイグレーション実行
2. サーバー Procedure デプロイ
3. モバイルアプリ更新
4. 既存ユーザーは次回オンボーディング時にサーバー保存開始

## Open Questions

- なし（初期実装のため）
