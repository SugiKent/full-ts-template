# Design: add-proactive-step-suggestions

## コンテキスト

ウィッシュリストアプリにおいて、ユーザーがアイテムの次のステップを考える際の「待ち時間」を排除したい。現在はユーザーがボタンを押してからAI APIを呼び出しているため、応答を待つ必要がある。

## ゴール / 非ゴール

### ゴール
- ユーザーが即座に次のステップ候補を選択できるようにする
- アイテムごとに常に5個程度の未採用ステップ候補をプールしておく
- ステップ候補の更新はバックグラウンドで行い、UIをブロックしない

### 非ゴール
- リアルタイム同期（候補の即時反映は不要）
- 候補のカスタマイズ（ユーザーが候補を編集する機能）
- オフラインでの候補生成

## 決定事項

### 1. データモデル: `StepSuggestion` テーブルを新設

```prisma
model StepSuggestion {
  id          String   @id @default(cuid())
  itemId      String
  title       String
  description String?
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())

  item WishlistItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@index([itemId])
}
```

**理由**:
- 既存の `Step` テーブルは「採用済みのステップ」を表し、進捗管理に使用
- 「未採用の候補」は別テーブルで管理することで、関心の分離を実現
- 採用時に `StepSuggestion` → `Step` へ変換（移動ではなくコピー＋削除）

**代替案検討**:
- `Step` テーブルに `status` フィールドを追加 → 既存クエリへの影響が大きいため却下
- フロントエンドでのみ管理 → サーバー側で候補を事前生成できないため却下

### 2. 候補の更新タイミングと戦略

| タイミング | 処理 | 実行方式 |
|-----------|------|---------|
| アイテム作成時 | 5個の候補を生成 | Worker（非同期） |
| アイテムタイトル更新時 | 既存候補を削除し、新規に5個生成 | Worker（非同期） |
| ステップ完了時 | 完了情報を踏まえて候補を更新 | Worker（非同期） |
| ステップ採用時 | 残り候補が2個以下になったら補充 | Worker（非同期） |

**すべて非同期（Worker）で処理する理由**:
- AI API 呼び出しは 2-5 秒かかる可能性があり、同期処理では UX が悪化
- PROJECT.md の「インスタで調査した内容を一気に登録できる」要件と整合
- アイテム詳細を開いた際に候補がなければローディング表示で対応

### 3. API設計

#### 新規エンドポイント

```typescript
// ステップ候補一覧取得（アイテム詳細取得に含める）
stepSuggestion.listByItemId({ itemId: string })
  => { suggestions: StepSuggestion[] }

// ステップ候補を採用（候補 → 正式なステップに変換）
stepSuggestion.adopt({ suggestionId: string })
  => { step: Step }

// ステップ候補を却下（削除のみ）
stepSuggestion.dismiss({ suggestionId: string })
  => { success: boolean }

// 候補を手動で再生成（オプショナル）
stepSuggestion.regenerate({ itemId: string })
  => { suggestions: StepSuggestion[] }
```

#### 既存エンドポイントの修正

```typescript
// アイテム作成時は候補生成ジョブをエンキューするのみ
// 候補は Worker で非同期生成されるため、即座には返却されない
item.create({ title, categoryIds })
  => { item: WishlistItem }

// アイテム取得時に候補も含める（この時点で候補が存在すれば）
item.getById({ id: string })
  => { item: WishlistItem & { suggestions: StepSuggestion[] } }
```

**注意**: アイテム作成直後は候補が0個の状態。アイテム詳細画面ではローディング表示で対応し、Worker による生成完了後にリフレッシュで取得する。

### 4. 候補の補充ロジック

```typescript
const TARGET_SUGGESTION_COUNT = 5
const MIN_SUGGESTION_COUNT = 2

async function ensureSuggestions(itemId: string): Promise<void> {
  const currentCount = await countSuggestionsByItemId(itemId)

  if (currentCount < MIN_SUGGESTION_COUNT) {
    const item = await getItemWithSteps(itemId)
    const countToGenerate = TARGET_SUGGESTION_COUNT - currentCount

    const newSuggestions = await suggestSteps({
      itemTitle: item.title,
      categoryIds: item.categoryIds,
      existingSteps: item.steps.map(s => s.title),
      completedSteps: item.steps.filter(s => s.isCompleted).map(s => s.title),
    })

    // 既存候補と重複しないものを追加
    await createSuggestions(itemId, newSuggestions.slice(0, countToGenerate))
  }
}
```

### 5. フロントエンドの更新戦略

- **楽観的更新**: 候補採用時は即座にUIを更新し、APIは非同期で呼び出す
- **エラー時ロールバック**: API失敗時は元の状態に戻す
- **候補の即時削除**: 採用/却下した候補は即座にリストから削除

## リスク / トレードオフ

| リスク | 影響 | 対策 |
|-------|------|------|
| AI API負荷増加 | コスト増、レート制限 | キュー処理、デバウンス |
| DBストレージ増加 | 長期的なコスト | 定期的な古い候補の削除 |
| 候補の質の問題 | UX低下 | フィードバック機能（将来） |

## マイグレーション計画

1. `StepSuggestion` テーブルを追加（既存データへの影響なし）
2. 新規 API エンドポイントをデプロイ
3. モバイルアプリを更新
4. 既存アイテムの候補は、ユーザーがアイテム詳細を開いた際に遅延生成

### 6. Worker による非同期処理

#### ジョブキュー設計

既存の bee-queue インフラを使用して、ステップ候補生成ジョブを処理する。

```typescript
// キュー名定義
export const STEP_SUGGESTION_QUEUE = 'step-suggestion-queue'

// ジョブタイプ
type StepSuggestionJobType =
  | 'generate'      // 新規生成（アイテム作成時）
  | 'regenerate'    // 再生成（タイトル更新時）
  | 'replenish'     // 補充（採用/却下後）
  | 'update'        // 更新（ステップ完了時）

// ジョブペイロード
interface StepSuggestionJobPayload {
  type: StepSuggestionJobType
  data: {
    itemId: string
    deleteExisting?: boolean  // regenerate 時に true
  }
}
```

#### ジョブのエンキュー

```typescript
// アイテム作成時
await enqueueJob(STEP_SUGGESTION_QUEUE, {
  type: 'generate',
  data: { itemId: newItem.id }
})

// タイトル更新時
await enqueueJob(STEP_SUGGESTION_QUEUE, {
  type: 'regenerate',
  data: { itemId, deleteExisting: true }
})

// 候補採用/却下後（残り2個以下の場合）
await enqueueJob(STEP_SUGGESTION_QUEUE, {
  type: 'replenish',
  data: { itemId }
})
```

#### Worker 処理フロー

```
┌─────────────────────────────────────────┐
│  Server (Producer)                       │
│  ・アイテム作成 → enqueueJob('generate') │
│  ・タイトル更新 → enqueueJob('regenerate')│
│  ・候補採用    → enqueueJob('replenish') │
└─────────────────────────────────────────┘
                    ↓ Redis Queue
┌─────────────────────────────────────────┐
│  Worker (Consumer)                       │
│  ・processStepSuggestionJob()           │
│  ・AI API 呼び出し                       │
│  ・StepSuggestion テーブルに保存         │
└─────────────────────────────────────────┘
```

#### エラーハンドリング

- bee-queue の exponential backoff リトライを使用（最大4回リトライ）
- AI API タイムアウト時はフォールバック候補を生成
- 全リトライ失敗時は Sentry にエラー通知

#### ジョブ重複排除（Deduplication）

短時間に複数の候補を採用/却下した場合、重複した replenish ジョブがエンキューされる可能性がある。これを防ぐため、Redis を使用したデバウンス機構を導入する。

```typescript
const DEBOUNCE_KEY_PREFIX = 'step-suggestion:debounce:'
const DEBOUNCE_TTL_SECONDS = 10  // 10秒間は同じ itemId のジョブをスキップ

/**
 * replenish ジョブをエンキューすべきか判定する
 * 直近 DEBOUNCE_TTL_SECONDS 以内に同じ itemId でエンキュー済みならスキップ
 */
async function shouldEnqueueReplenishJob(itemId: string): Promise<boolean> {
  const key = `${DEBOUNCE_KEY_PREFIX}${itemId}`
  const redis = getRedisClient()

  // SET NX (存在しない場合のみセット) + EX (有効期限)
  const result = await redis.set(key, '1', 'EX', DEBOUNCE_TTL_SECONDS, 'NX')

  // result が 'OK' なら新規セット成功 = エンキューすべき
  // result が null なら既にキーが存在 = スキップ
  return result === 'OK'
}

// 使用例（adopt/dismiss procedure 内）
if (remainingCount <= MIN_SUGGESTION_COUNT) {
  const shouldEnqueue = await shouldEnqueueReplenishJob(itemId)
  if (shouldEnqueue) {
    await enqueueJob(STEP_SUGGESTION_QUEUE, {
      type: 'replenish',
      data: { itemId }
    })
  }
}
```

**設計根拠**:
- Redis の SET NX はアトミック操作であり、競合状態を防ぐ
- 10秒のデバウンス間隔は、連続操作をまとめつつも適切なタイミングで補充を行うバランス
- generate/regenerate ジョブは頻度が低いため、デバウンス対象外とする

## オープンな質問

- ~~候補生成を同期で行うか非同期で行うか~~ → すべて Worker で非同期処理
- ~~候補の最大保持数~~ → 5個（TARGET_SUGGESTION_COUNT）
- 候補の有効期限は設けるか？ → 当面は設けない（将来的に検討）
