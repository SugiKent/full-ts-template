# フロントエンド開発規約

このドキュメントは、React 19 + Tailwind CSS を使用したフロントエンド開発の規約とベストプラクティスを説明します。

**関連ドキュメント:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 全体アーキテクチャ
- [BACKEND.md](./BACKEND.md) - バックエンド開発規約
- [AUTH.md](./AUTH.md) - 認証実装

## 目次
1. [React 19新機能パターン](#1-react-19新機能パターン)
2. [Tailwind CSS設計](#2-tailwind-css設計)
3. [コンポーネント設計](#3-コンポーネント設計)
4. [状態管理](#4-状態管理)
5. [パフォーマンス最適化](#5-パフォーマンス最適化)
6. [テスト](#6-テスト)
7. [多言語対応（i18n）](#7-多言語対応i18n)

## 1. React 19新機能パターン

### 1.1 Actions による非同期処理

**React 19のActionsは、非同期処理を大幅に簡素化します：**

```tsx
// ✅ 正しい実装: React 19 Actions
// src/client/components/UserRegistrationForm.tsx
import { useActionState } from 'react'
import { api } from '@/client/services/api'

interface FormState {
  error?: string
  success?: boolean
}

function UserRegistrationForm() {
  const [state, formAction, isPending] = useActionState<FormState>(
    async (previousState: FormState, formData: FormData): Promise<FormState> => {
      try {
        await api.user.create({
          email: formData.get('email') as string,
          name: formData.get('name') as string,
          birthDate: formData.get('birthDate') as string,
          companyCode: formData.get('companyCode') as string
        })
        return { success: true }
      } catch (error) {
        return { error: error instanceof Error ? error.message : '登録に失敗しました' }
      }
    },
    { success: false }
  )

  return (
    <form action={formAction} className="max-w-md mx-auto p-6 space-y-4">
      {state.error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-md">
          登録が完了しました
        </div>
      )}

      <input
        type="email"
        name="email"
        required
        className="w-full px-4 py-2 border rounded-md"
        placeholder="メールアドレス"
        disabled={isPending}
      />

      <input
        type="text"
        name="name"
        required
        className="w-full px-4 py-2 border rounded-md"
        placeholder="氏名"
        disabled={isPending}
      />

      <input
        type="date"
        name="birthDate"
        required
        className="w-full px-4 py-2 border rounded-md"
        disabled={isPending}
      />

      <input
        type="text"
        name="companyCode"
        required
        pattern="[A-Z0-9]{6}"
        className="w-full px-4 py-2 border rounded-md"
        placeholder="企業コード (6文字)"
        disabled={isPending}
      />

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isPending ? '登録中...' : '登録'}
      </button>
    </form>
  )
}

export default UserRegistrationForm

// ❌ 間違った実装例 - 従来のuseState/useEffectパターン（非推奨）
// React 19ではActionsを使うべき
```

### 1.2 useOptimistic による楽観的UI更新

```tsx
// ✅ 正しい実装: useOptimistic
// src/client/components/TodoList.tsx
import { useOptimistic } from 'react'
import { api } from '@/client/services/api'

interface Todo {
  id: string
  title: string
  completed: boolean
}

function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [optimisticTodos, setOptimisticTodos] = useOptimistic(
    initialTodos,
    (state, newTodo: Todo) => [...state, newTodo]
  )

  const handleAddTodo = async (formData: FormData) => {
    const newTodo = {
      id: crypto.randomUUID(),
      title: formData.get('title') as string,
      completed: false
    }

    // 楽観的UI更新（即座に反映）
    setOptimisticTodos(newTodo)

    try {
      // サーバーへの実際のリクエスト
      await api.todo.create(newTodo)
    } catch (error) {
      // 失敗時は自動的にロールバック
      console.error('Todo作成失敗:', error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <form action={handleAddTodo} className="mb-6">
        <input
          type="text"
          name="title"
          required
          className="w-full px-4 py-2 border rounded-md"
          placeholder="新しいTodo"
        />
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          追加
        </button>
      </form>

      <ul className="space-y-2">
        {optimisticTodos.map((todo) => (
          <li
            key={todo.id}
            className="p-4 bg-white rounded-lg shadow"
          >
            {todo.title}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TodoList
```

### 1.3 use フックによる非同期データ取得

```tsx
// ✅ 正しい実装: use フック
// src/client/components/UserProfile.tsx
import { use, Suspense } from 'react'
import { api } from '@/client/services/api'

interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  // Promiseを直接読み込む
  const user = use(userPromise)

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">{user.name}</h2>
      <p className="text-gray-600">{user.email}</p>
      <p className="text-sm text-gray-500 mt-2">
        登録日: {new Date(user.createdAt).toLocaleDateString()}
      </p>
    </div>
  )
}

function UserProfilePage({ userId }: { userId: string }) {
  // Promiseを作成（コンポーネント外で行うことを推奨）
  const userPromise = api.user.get({ id: userId })

  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  )
}

export default UserProfilePage
```

### 1.4 useFormStatus による送信状態の取得

```tsx
// ✅ 正しい実装: useFormStatus
// src/client/components/SubmitButton.tsx
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
    >
      {pending ? '送信中...' : '送信'}
    </button>
  )
}

// 使用例
function MyForm() {
  const handleSubmit = async (formData: FormData) => {
    // フォーム処理
  }

  return (
    <form action={handleSubmit}>
      <input type="text" name="message" />
      <SubmitButton /> {/* フォーム内でuseFormStatusを使用 */}
    </form>
  )
}

export default SubmitButton
```

### 1.5 React 19 移行時の注意点

1. **useMemo/useCallback の自動最適化**
   - React 19コンパイラが自動最適化するため、多くの場合不要
   - パフォーマンス問題がない限り削除を検討

2. **forwardRef の不要化**
   ```tsx
   // ✅ React 19: forwardRef不要
   function MyInput({ ref }: { ref: Ref<HTMLInputElement> }) {
     return <input ref={ref} />
   }

   // ❌ 従来: forwardRef必須
   const MyInput = forwardRef((props, ref) => {
     return <input ref={ref} />
   })
   ```

3. **Context値の直接読み込み**
   ```tsx
   // ✅ React 19: use フック
   const theme = use(ThemeContext)

   // ❌ 従来: useContext
   const theme = useContext(ThemeContext)
   ```

## 2. Tailwind CSS設計

### 2.1 基本パターン

```tsx
// ✅ 正しい実装例: Tailwind CSSクラスの使用
export const UserCard: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-bold text-gray-800 mb-2">
        {user.name}
      </h3>
      <p className="text-sm text-gray-600">
        {user.email}
      </p>
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
        詳細を見る
      </button>
    </div>
  )
}

// ❌ 間違った実装例（CSS-in-JS）- 使用禁止
const UserCard = styled.div`
  background: white;
  border-radius: 8px;
  /* CSS-in-JS は使用しない！ */
`
```

### 2.2 設計規約

1. **ユーティリティファースト**: カスタムCSSより Tailwind クラスを優先
2. **レスポンシブ設計**: `sm:`, `md:`, `lg:` プレフィックスを活用
3. **再利用性**: 頻出パターンはコンポーネント化
4. **設定**: `tailwind.config.js` でプロジェクト固有のカラーを定義
5. **禁止事項**:
   - インラインスタイル（style属性）の使用
   - CSS-in-JS（styled-components, emotion等）
   - グローバルCSSの追加（Tailwind @layer以外）

### 2.3 Tailwind v4 設定

Tailwind v4はCSS-firstの設定を採用しており、`tailwind.config.js`は不要です。

```css
/* src/client/styles/index.css */
@import "tailwindcss";
@plugin "@tailwindcss/forms";
@plugin "@tailwindcss/typography";

/* カスタムテーマの定義 */
@theme {
  /* プロジェクト固有カラー（プロジェクトに応じてカスタマイズ） */
  --color-brand-primary: #3B82F6;   /* Blue-500 */
  --color-brand-secondary: #10B981; /* Emerald-500 */
  --color-brand-accent: #F59E0B;    /* Amber-500 */

  /* フォント */
  --font-sans: 'Noto Sans JP', sans-serif;
}
```

**Tailwind v4の主な変更点:**

1. **CSS-first設定**: `tailwind.config.js`の代わりにCSSで設定
2. **`@import "tailwindcss"`**: 旧`@tailwind base/components/utilities`を置き換え
3. **`@plugin`**: プラグインの読み込み
4. **`@theme`**: カスタムテーマ値の定義
5. **自動コンテンツ検出**: `content`配列の設定不要

```tsx
// カスタムカラーの使用例
<div className="bg-brand-primary text-white">
  ブランドカラーの背景
</div>
```

### 2.4 レスポンシブデザイン

```tsx
// ✅ 正しい実装: レスポンシブクラスの使用
function ResponsiveCard() {
  return (
    <div className="
      w-full
      sm:w-1/2
      md:w-1/3
      lg:w-1/4
      p-4
      bg-white
      rounded-lg
      shadow-md
    ">
      <h3 className="text-lg sm:text-xl md:text-2xl font-bold">
        レスポンシブタイトル
      </h3>
    </div>
  )
}
```

## 3. コンポーネント設計

### 3.1 関数コンポーネント

**必須パターン：**
- **関数コンポーネントのみ使用**（クラスコンポーネント禁止）
- Props型定義にinterfaceを使用
- デフォルトエクスポート推奨

```tsx
// ✅ 正しい実装
interface UserCardProps {
  user: User
  onEdit?: (id: string) => void
}

function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-xl font-bold">{user.name}</h3>
      {onEdit && (
        <button onClick={() => onEdit(user.id)}>
          編集
        </button>
      )}
    </div>
  )
}

export default UserCard
```

### 3.2 カスタムフック

```tsx
// ✅ 正しい実装: カスタムフック
// src/client/hooks/useUser.ts
import { useState, useEffect } from 'react'
import { api } from '@/client/services/api'

interface User {
  id: string
  name: string
  email: string
}

export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    api.user.get({ id: userId })
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [userId])

  return { user, loading, error }
}
```

## 4. 状態管理

### 4.1 ローカル状態管理

**React標準のuseState/useContext/useReducer + React 19 Actionsを使用**
**Redux/Zustand禁止**

```tsx
// ✅ 正しい実装: Context API
// src/client/contexts/ThemeContext.tsx
import { createContext, useState, ReactNode } from 'react'

interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

### 4.2 グローバル状態管理

```tsx
// ✅ 正しい実装: useReducer + Context
// src/client/contexts/AppContext.tsx
import { createContext, useReducer, ReactNode } from 'react'

interface AppState {
  user: User | null
  notifications: Notification[]
}

type AppAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      }
    default:
      return state
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    user: null,
    notifications: []
  })

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}
```

## 5. パフォーマンス最適化

### 5.1 React 19 自動最適化

- **useMemo/useCallback不要**: React 19コンパイラが自動最適化
- **forwardRef不要**: 直接ref propsを受け取れる
- **Concurrent Features**: 自動的にバックグラウンドレンダリング

### 5.2 Code Splitting

```tsx
// ✅ 正しい実装: React.lazy
import { lazy, Suspense } from 'react'

const AdminPanel = lazy(() => import('./AdminPanel'))

function App() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <AdminPanel />
    </Suspense>
  )
}
```

### 5.3 画像最適化

```tsx
// ✅ 正しい実装: 画像の遅延読み込み
function ImageGallery() {
  return (
    <img
      src="/images/photo.jpg"
      alt="説明"
      loading="lazy"
      className="w-full h-auto"
    />
  )
}
```

## 6. テスト

フロントエンドのテスト戦略とベストプラクティスについては **[TEST.md](./TEST.md)** を参照してください。

### 6.1 コンポーネントテスト

```typescript
// ✅ 推奨: コンポーネント単体テスト
// src/client/components/UserCard.test.tsx
import { render, screen } from '@testing-library/react'
import { UserCard } from './UserCard'

it('ユーザーカードが正しく表示される', () => {
  render(<UserCard user={{ id: '1', name: '山田太郎', email: 'yamada@example.com' }} />)

  expect(screen.getByText('山田太郎')).toBeInTheDocument()
  expect(screen.getByText('yamada@example.com')).toBeInTheDocument()
})
```

### 6.2 カスタムフックのテスト

```typescript
// ✅ 推奨: カスタムフックのテスト
// src/client/hooks/useUser.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useUser } from './useUser'

it('useUser がユーザー情報を取得する', async () => {
  const { result } = renderHook(() => useUser('user-123'))

  expect(result.current.loading).toBe(true)

  await waitFor(() => {
    expect(result.current.loading).toBe(false)
    expect(result.current.user).toBeDefined()
  })
})
```

**詳細なテストパターン、モック戦略、ベストプラクティスは [TEST.md](./TEST.md) を参照してください。**

## 7. 多言語対応（i18n）

このプロジェクトは `react-i18next` を使用してi18n対応しています。

### 7.1 言語設定

**対応言語は `src/shared/config/i18n.ts` で一元管理されています。**

```typescript
// src/shared/config/i18n.ts
export const SUPPORTED_LANGUAGES = ['ja'] as const  // 対応言語を変更する場合はここを編集
export const I18N_NAMESPACES = ['common', 'auth'] as const  // namespaceを追加する場合はここを編集
```

新しい言語を追加する場合：
1. `src/shared/config/i18n.ts` の `SUPPORTED_LANGUAGES` に言語コードを追加
2. `src/client/locales/{言語コード}/` ディレクトリに翻訳ファイルを作成
3. `src/client/i18n/index.ts` でリソースをimportして追加

### 7.2 基本ルール

1. **すべての UI テキストは翻訳キーを使用**（ハードコード禁止）
2. 新しいテキスト追加時は **対応言語すべて** に翻訳を追加
3. `pnpm run lint` でハードコードテキストと翻訳ファイルの整合性がチェックされる

### 7.3 翻訳ファイルの構成

```
src/client/locales/
├── {言語コード}/          # 言語ごとのディレクトリ
│   ├── common.json        # 共通（ボタン、ラベル等）
│   ├── auth.json          # 認証画面
│   └── ...                # 他のnamespace
```

namespaceは `src/shared/config/i18n.ts` の `I18N_NAMESPACES` で定義されています。

### 7.4 基本的な使い方

```tsx
// ✅ 正しい実装
import { useTranslation } from 'react-i18next'

function MyComponent() {
  // namespace を指定（'user', 'common', 'auth', 'landing', 'analytics'）
  const { t } = useTranslation('user')

  return (
    <div>
      {/* 基本的な翻訳 */}
      <h1>{t('nav.home')}</h1>
      <button>{t('common.submit')}</button>

      {/* プレースホルダー */}
      <input placeholder={t('form.emailPlaceholder')} />

      {/* 動的値の補間 */}
      <p>{t('dropdown.userMenu', { name: user.name })}</p>

      {/* 条件分岐 */}
      <span>{isLoading ? t('common.loading') : t('common.ready')}</span>
    </div>
  )
}

// ❌ 禁止: ハードコードテキスト
function BadComponent() {
  return (
    <div>
      <h1>ホーム</h1>              {/* 日本語ハードコード */}
      <button>Submit</button>       {/* 英語ハードコード */}
      <p>Welcome to our app</p>     {/* 英語文章 */}
    </div>
  )
}
```

### 7.5 翻訳キーの命名規則

```json
// src/client/locales/ja/user.json
{
  "nav": {
    "home": "ホーム",
    "projects": "プロジェクト",
    "recentProjects": "最近のプロジェクト"
  },
  "dropdown": {
    "userMenu": "{{name}}さんのメニュー"
  },
  "form": {
    "emailPlaceholder": "メールアドレスを入力"
  }
}
```

**命名規則:**
- ドット区切りの階層構造: `section.subsection.key`
- 小文字 camelCase: `nav.recentProjects`
- 動的値は `{{変数名}}`: `"userMenu": "{{name}}さんのメニュー"`
- 複数形は別キー: `item` / `items`

### 7.6 新しい翻訳を追加する手順

1. **適切な namespace を選択**
   - `src/shared/config/i18n.ts` の `I18N_NAMESPACES` を確認
   - 新しいnamespaceが必要な場合は設定ファイルに追加

2. **対応言語すべてに追加**
   - `src/shared/config/i18n.ts` の `SUPPORTED_LANGUAGES` を確認
   - 各言語の翻訳ファイルに同じキー構造で追加
   ```bash
   # 例: 日本語のみ対応の場合
   src/client/locales/ja/{namespace}.json
   ```

3. **翻訳内容の例**
   ```json
   // ja/common.json
   { "settings": { "title": "設定" } }
   ```

4. **lint で確認**
   ```bash
   pnpm run lint
   ```

### 7.7 複数 namespace の使用

```tsx
// 複数の namespace を使用する場合
function ComplexComponent() {
  const { t } = useTranslation('user')
  const { t: tCommon } = useTranslation('common')

  return (
    <div>
      <h1>{t('nav.home')}</h1>
      <button>{tCommon('submit')}</button>
    </div>
  )
}

// または namespace を都度指定
function AlternativeComponent() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('user:nav.home')}</h1>
      <button>{t('common:submit')}</button>
    </div>
  )
}
```

### 7.8 よくある間違いと対処

```tsx
// ❌ エラーメッセージのハードコード
setError('入力が無効です')

// ✅ 翻訳キーを使用
setError(t('error.invalidInput'))

// ❌ 三項演算子内のハードコード
{isActive ? '有効' : '無効'}

// ✅ 翻訳キーを使用
{isActive ? t('status.active') : t('status.inactive')}

// ❌ aria-label のハードコード
<button aria-label="閉じる">×</button>

// ✅ 翻訳キーを使用
<button aria-label={t('common.close')}>×</button>
```

### 7.9 言語切り替え

言語切り替えは `LanguageSwitcher` コンポーネントで提供されています。

```tsx
import { LanguageSwitcher } from '@/client/i18n/LanguageSwitcher'

function Header() {
  return (
    <header>
      <LanguageSwitcher />
    </header>
  )
}
```

---

## 変更履歴

### 2025年12月
- ボイラープレートテンプレートとして初期化
- 汎用的なブランドカラーに変更
- 多言語対応（i18n）セクションを追加

### 2025年11月15日
- ARCHITECTURE.mdから分離してFRONTEND.mdを作成
- React 19新機能パターンの詳細追加
- Tailwind CSS設計規約の強化
- コンポーネント設計とテストパターンの明確化

最終更新: 2025年12月
