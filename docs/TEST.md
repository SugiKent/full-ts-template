# テスト戦略ガイド

**フルスタック TypeScript アプリケーション**のテスト方針とベストプラクティスを定義します。

## 📋 目次

1. [テストの種類と配置](#テストの種類と配置)
2. [テストファイルの命名規則](#テストファイルの命名規則)
3. [カバレッジ要件](#カバレッジ要件)
4. [単体テスト（Unit Test）](#単体テストunit-test)
5. [統合テスト（Integration Test）](#統合テスト-integration-test)
6. [E2Eテスト（End-to-End Test）](#e2eテストend-to-end-test)
7. [テストデータ管理](#テストデータ管理)
8. [モック戦略](#モック戦略)
9. [CI/CD統合](#cicd統合)
10. [ベストプラクティス](#ベストプラクティス)

---

## テストの種類と配置

### 📁 ディレクトリ構造

```
project/
├── src/
│   ├── server/
│   │   ├── handlers/
│   │   │   ├── user/
│   │   │   │   ├── create.ts
│   │   │   │   └── create.test.ts                    # 単体テスト（同じディレクトリ）
│   │   ├── services/
│   │   │   ├── auth/
│   │   │   │   ├── session.ts
│   │   │   │   └── session.test.ts                   # 単体テスト（同じディレクトリ）
│   │   ├── repositories/
│   │   │   ├── user.repository.ts
│   │   │   └── user.repository.test.ts               # 単体テスト（同じディレクトリ）
│   │   └── routes/
│   │       ├── api/
│   │       │   ├── users.ts
│   │       │   └── users.integration.test.ts         # 統合テスト（同じディレクトリ）
│   │       └── admin/
│   │           ├── index.ts
│   │           └── index.integration.test.ts         # 統合テスト（同じディレクトリ）
│   └── client/
│       └── components/
│           ├── Button.tsx
│           └── Button.test.tsx                        # 単体テスト（同じディレクトリ）
├── tests/
│   ├── e2e/                                           # E2Eテスト
│   │   ├── specs/
│   │   │   ├── admin-login.spec.ts
│   │   │   └── user-registration.spec.ts
│   │   └── fixtures/                                  # E2Eテスト用フィクスチャ
│   ├── mocks/                                         # 共通モック
│   │   ├── api-client.mock.ts
│   │   └── prisma.mock.ts
│   ├── factories/                                     # テストデータファクトリー
│   │   ├── user.factory.ts
│   │   └── organization.factory.ts
│   └── setup.ts                                       # グローバルセットアップ
└── vitest.config.ts
```

### 🎯 配置ルール

| テストの種類 | 配置場所 | 拡張子 | 説明 |
|------------|---------|-------|------|
| **単体テスト** | `src/**/*.test.ts(x)` | `.test.ts(x)` | アプリケーションコードと同じディレクトリ |
| **統合テスト** | `src/**/*.integration.test.ts` | `.integration.test.ts` | アプリケーションコードと同じディレクトリ（routesなど） |
| **E2Eテスト** | `tests/e2e/specs/**/*.spec.ts` | `.spec.ts` | `tests/e2e/specs/` 配下 |

---

## テストファイルの命名規則

### ✅ 推奨

```typescript
// 単体テスト
src/server/services/auth/session.ts
src/server/services/auth/session.test.ts

// 統合テスト
src/server/routes/api/users.ts
src/server/routes/api/users.integration.test.ts
src/server/routes/admin/index.ts
src/server/routes/admin/index.integration.test.ts

// E2Eテスト
tests/e2e/specs/admin-login.spec.ts
tests/e2e/specs/user-registration-flow.spec.ts
```

### ❌ 禁止

```typescript
// ❌ ケバブケース以外
src/server/services/auth/session_test.ts
src/server/services/auth/sessionTest.ts

// ❌ 別ディレクトリに単体テスト・統合テスト
tests/unit/services/session.test.ts
tests/integration/routes/users.test.ts

// ❌ 拡張子の混在
tests/e2e/specs/admin-login.test.ts         // E2Eは .spec.ts を使用
src/server/routes/users.test.ts             // 統合テストは .integration.test.ts を使用
```

---

## カバレッジ要件

### 📊 現在の閾値

```typescript
// vitest.config.ts
thresholds: {
  branches: 70,    // 分岐カバレッジ: 70%
  functions: 70,   // 関数カバレッジ: 70%
  lines: 80,       // 行カバレッジ: 80%
  statements: 80,  // 文カバレッジ: 80%
}
```

### 🎯 目標（維持・改善）

```typescript
thresholds: {
  branches: 75,    // 分岐カバレッジ: 75%
  functions: 75,   // 関数カバレッジ: 75%
  lines: 85,       // 行カバレッジ: 85%
  statements: 85,  // 文カバレッジ: 85%
}
```

### 📈 カバレッジ改善計画

| 期間 | branches | functions | lines | statements |
|-----|----------|-----------|-------|------------|
| 現在 | 70% | 70% | 80% | 80% |
| 3ヶ月後 | 72% | 72% | 82% | 82% |
| 6ヶ月後 | 74% | 74% | 84% | 84% |
| 9ヶ月後 | 75% | 75% | 85% | 85% |

---

## 単体テスト（Unit Test）

### 🎯 目的

- 個々の関数・メソッドの振る舞いを検証
- 外部依存をモックして高速実行
- リグレッション防止

### 📝 テスト対象

```typescript
// ✅ 必須テスト対象
- ビジネスロジック（handlers, services）
- ユーティリティ関数（utils）
- Repository層（repositories）
- バリデーション関数
- 型ガード関数
- Reactコンポーネント（client/components）

// ⚠️ 任意テスト対象
- 単純なgetters/setters
- 型定義のみのファイル
```

### 🔧 テストテンプレート

```typescript
/**
 * [モジュール名]の単体テスト
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { /* 必要な型 */ } from './types'

// モックの定義
const mockDependency = vi.fn()
vi.mock('./dependency', () => ({
  dependency: mockDependency,
}))

// テスト対象のインポート
const { functionUnderTest } = await import('./module')

describe('[モジュール名]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('[関数名]', () => {
    it('正常系: 期待される値を返す', () => {
      // Arrange
      const input = { /* テストデータ */ }
      mockDependency.mockReturnValueOnce('expected')

      // Act
      const result = functionUnderTest(input)

      // Assert
      expect(result).toBe('expected')
      expect(mockDependency).toHaveBeenCalledWith(input)
    })

    it('異常系: 不正な入力で例外をスローする', () => {
      // Arrange
      const invalidInput = null

      // Act & Assert
      expect(() => functionUnderTest(invalidInput)).toThrow('Invalid input')
    })

    it('境界値: 空文字列を正しく処理する', () => {
      // Arrange
      const emptyInput = ''

      // Act
      const result = functionUnderTest(emptyInput)

      // Assert
      expect(result).toBe('')
    })
  })
})
```

### ⚡ 実行方法

```bash
# 全ての単体テストを実行
pnpm run test

# ウォッチモード
pnpm run test -- --watch

# カバレッジ計測
pnpm run test:coverage

# 特定のファイルのみ実行
pnpm run test src/server/services/auth/session.test.ts
```

---

## 統合テスト（Integration Test）

### 🎯 目的

- 複数のモジュール間の連携を検証
- APIエンドポイントの動作確認
- データベースとの統合テスト

### 📝 テスト対象

```typescript
// ✅ 必須テスト対象
- APIルート（routes）
- Webhook処理
- 認証フロー
- データベーストランザクション
```

### 🔧 テストテンプレート

```typescript
/**
 * [API名] の統合テスト
 */

import { PrismaClient } from '@prisma/client'
import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// モックの定義
const mockExternalService = vi.fn()
vi.mock('@/server/services/external', () => ({
  externalService: mockExternalService,
}))

// テスト対象のインポート
const routes = await import('@/server/routes/target')

describe('[API名] Integration Test', () => {
  let app: FastifyInstance
  let prisma: PrismaClient

  beforeAll(async () => {
    // Prisma クライアントの初期化
    prisma = new PrismaClient()

    // Fastify アプリケーションの初期化
    app = Fastify()
    app.decorate('prisma', prisma)

    // ルートの登録
    await app.register(routes.default, { prefix: '/api' })
  })

  afterAll(async () => {
    await prisma.$disconnect()
    await app.close()
  })

  beforeEach(async () => {
    vi.clearAllMocks()

    // テストデータのクリーンアップ（トランザクション推奨）
    await prisma.$transaction([
      prisma.endUser.deleteMany(),
      prisma.organization.deleteMany(),
    ])
  })

  describe('GET /api/endpoint', () => {
    it('正常系: データを取得できる', async () => {
      // Arrange: テストデータの準備
      await prisma.organization.create({
        data: { code: 'TEST', name: 'Test Company' },
      })

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/api/endpoint',
      })

      // Assert
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('data')
    })

    it('異常系: 認証エラーで401を返す', async () => {
      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/api/endpoint',
        headers: {
          authorization: 'Bearer invalid_token',
        },
      })

      // Assert
      expect(response.statusCode).toBe(401)
    })
  })
})
```

### ⚡ 実行方法

```bash
# 統合テストを実行
pnpm run test src/**/*.integration.test.ts

# 特定の統合テストのみ実行
pnpm run test src/server/routes/api/users.integration.test.ts

# データベース付きで実行
ENABLE_TEST_DB=true pnpm run test src/**/*.integration.test.ts
```

---

## E2Eテスト（End-to-End Test）

### 🎯 目的

- ユーザー視点での動作確認
- UI/UXの検証
- ブラウザ互換性確認

### 📝 テスト対象

```typescript
// ✅ 必須テスト対象
- 重要な業務フロー（ログイン、登録、決済等）
- クリティカルパス
- ユーザージャーニー

// ⚠️ 任意テスト対象
- エッジケース
- デバッグ用画面
```

### 🔧 Playwright推奨パターン

```typescript
import { expect, test } from '@playwright/test'

test.describe('[機能名]', () => {
  test.beforeEach(async ({ page }) => {
    // 共通の初期化処理
    await page.goto('/target-page')
  })

  test('正常フロー: ユーザーがタスクを完了できる', async ({ page }) => {
    // Given: 初期状態
    await page.getByLabel('メールアドレス').fill('user@example.com')

    // When: アクション
    await page.getByRole('button', { name: '送信' }).click()

    // Then: 検証
    await expect(page.getByText('成功しました')).toBeVisible()
    await expect(page).toHaveURL('/success')
  })

  test('エラーハンドリング: バリデーションエラーを表示', async ({ page }) => {
    // When: 不正な入力
    await page.getByRole('button', { name: '送信' }).click()

    // Then: エラー表示
    await expect(page.getByText('メールアドレスを入力してください')).toBeVisible()
  })
})
```

### ⚡ 実行方法

```bash
# E2Eテストを実行
pnpm run test:e2e

# UIモードで実行
pnpm run test:e2e:ui

# デバッグモード
pnpm run test:e2e:debug

# コード生成
pnpm run test:e2e:codegen
```

---

## テストデータ管理

### 🏭 テストデータファクトリー

**推奨**: テストデータは再利用可能なファクトリーで生成

```typescript
// tests/factories/user.factory.ts
import { faker } from '@faker-js/faker'
import type { EndUser } from '@prisma/client'

export const createTestUser = (overrides?: Partial<EndUser>): EndUser => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  organizationId: faker.string.uuid(),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
})

// 使用例
const testUser = createTestUser({
  name: '山田太郎',
  email: 'yamada@example.com',
})
```

### 🔐 環境変数の管理

```typescript
// tests/fixtures/test-credentials.ts
export const TEST_CREDENTIALS = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@test.local',
    password: process.env.TEST_ADMIN_PASSWORD || 'TestP@ssw0rd123',
  },
  user: {
    email: process.env.TEST_USER_EMAIL || 'user@test.local',
    password: process.env.TEST_USER_PASSWORD || 'UserP@ss456',
  },
} as const

// .env.test
TEST_ADMIN_EMAIL=admin@test.local
TEST_ADMIN_PASSWORD=SecurePassword123!
```

### 🗄️ データベーステストデータ

```typescript
// tests/integration/setup.ts
import { PrismaClient } from '@prisma/client'
import { beforeEach, afterEach } from 'vitest'

export const setupTestDatabase = () => {
  let prisma: PrismaClient

  beforeEach(async () => {
    prisma = new PrismaClient()

    // トランザクション開始（推奨）
    await prisma.$transaction(async (tx) => {
      // テストデータの準備
    })
  })

  afterEach(async () => {
    // クリーンアップ
    await prisma.$transaction([
      prisma.endUser.deleteMany(),
      prisma.organization.deleteMany(),
    ])
    await prisma.$disconnect()
  })

  return { getPrisma: () => prisma }
}
```

---

## モック戦略

### 🎭 モックの種類と使い分け

| 種類 | 用途 | 実装方法 |
|-----|------|----------|
| **Spy** | 関数の呼び出しを監視 | `vi.spyOn()` |
| **Mock** | 関数の実装を置き換え | `vi.fn()`, `vi.mock()` |
| **Stub** | 固定値を返す | `mockFn.mockReturnValue()` |

### 🔧 共通モックの定義

```typescript
// tests/mocks/api-client.mock.ts
import { vi } from 'vitest'

export const createApiClientMock = () => ({
  get: vi.fn().mockResolvedValue({ data: {} }),
  post: vi.fn().mockResolvedValue({ data: {} }),
  put: vi.fn().mockResolvedValue({ data: {} }),
  delete: vi.fn().mockResolvedValue({ data: {} }),
})

// 使用例
import { createApiClientMock } from '@/tests/mocks/api-client.mock'

const apiClientMock = createApiClientMock()
vi.mock('@/server/services/api-client', () => ({
  apiClient: apiClientMock,
}))
```

### ⚠️ モック使用時の注意点

```typescript
// ❌ 悪い例: グローバルモックの副作用
vi.mock('@/server/services/api-client')  // 全テストに影響

// ✅ 良い例: ローカルモック
describe('特定のテストスイート', () => {
  const apiClientMock = createApiClientMock()

  beforeEach(() => {
    vi.clearAllMocks()
  })
})
```

---

## ベストプラクティス

### ✅ DO（推奨）

1. **AAA パターンを使用**
   ```typescript
   it('should calculate total', () => {
     // Arrange: テストデータの準備
     const items = [{ price: 100 }, { price: 200 }]

     // Act: 実行
     const total = calculateTotal(items)

     // Assert: 検証
     expect(total).toBe(300)
   })
   ```

2. **テストケースは独立させる**
   ```typescript
   // ✅ 良い例
   beforeEach(() => {
     vi.clearAllMocks()
     // 各テストごとにクリーンな状態
   })
   ```

3. **境界値テストを含める**
   ```typescript
   it.each([
     [0, 'zero'],
     [1, 'one'],
     [999, 'many'],
     [1000, 'max'],
   ])('should handle %i correctly', (input, expected) => {
     expect(handler(input)).toBe(expected)
   })
   ```

4. **エラーケースを必ずテスト**
   ```typescript
   it('should throw error on invalid input', () => {
     expect(() => validate(null)).toThrow('Input cannot be null')
   })
   ```

5. **非同期処理は async/await を使用**
   ```typescript
   it('should fetch data', async () => {
     const data = await fetchData()
     expect(data).toBeDefined()
   })
   ```

### ❌ DON'T（非推奨）

1. **テスト間の依存関係**
   ```typescript
   // ❌ 悪い例
   let sharedState: string

   it('test 1', () => {
     sharedState = 'value'
   })

   it('test 2', () => {
     expect(sharedState).toBe('value')  // test 1 に依存
   })
   ```

2. **実装の詳細をテスト**
   ```typescript
   // ❌ 悪い例: private メソッドのテスト
   expect(instance['privateMethod']()).toBe('value')

   // ✅ 良い例: public API のテスト
   expect(instance.publicMethod()).toBe('value')
   ```

3. **複数のアサーションを1つのテストに詰め込む**
   ```typescript
   // ❌ 悪い例
   it('should do everything', () => {
     expect(a).toBe(1)
     expect(b).toBe(2)
     expect(c).toBe(3)
     // ... 10個以上のアサーション
   })

   // ✅ 良い例: 1テスト1概念
   it('should validate a', () => expect(a).toBe(1))
   it('should validate b', () => expect(b).toBe(2))
   ```

4. **console.log をデバッグに使用**
   ```typescript
   // ❌ 悪い例
   it('test', () => {
     console.log('debug:', value)
   })

   // ✅ 良い例: デバッガーまたはテストフレームワークの機能
   it.only('test', () => {  // 一時的に1つだけ実行
     debugger
   })
   ```

5. **型安全性を犠牲にする**
   ```typescript
   // ❌ 悪い例
   const response = JSON.parse(body) as any

   // ✅ 良い例
   import type { ApiResponse } from '@/types'
   const response = JSON.parse(body) as ApiResponse
   ```

---

## 📚 参考リソース

### 公式ドキュメント

- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)

### 社内ドキュメント

- [ARCHITECTURE.md](./ARCHITECTURE.md) - アーキテクチャ設計
- [BACKEND.md](./BACKEND.md) - バックエンド開発規約
- [FRONTEND.md](./FRONTEND.md) - フロントエンド開発規約

---

## 変更履歴

### 2025年12月
- ボイラープレートテンプレートとして初期化
- 汎用的なテストパターンに変更

最終更新: 2025年12月
