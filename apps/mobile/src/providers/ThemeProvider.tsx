/**
 * テーマプロバイダー
 *
 * アプリ全体のテーマカラーを管理するコンテキストプロバイダー
 * - AsyncStorage によるローカル永続化
 * - サーバーとの同期
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { STORAGE_KEYS } from '@/constants/storage'
import {
  DEFAULT_THEME_ID,
  getThemeById,
  isValidThemeId,
  THEME_PRESETS,
  type Theme,
  type ThemeColors,
  type ThemeId,
} from '@/constants/theme'
import { orpcClient } from '@/services/orpc-client'

/**
 * テーマコンテキストの値
 */
interface ThemeContextValue {
  /** 現在のテーマID */
  themeId: ThemeId
  /** 現在のテーマオブジェクト */
  theme: Theme
  /** 現在のテーマカラー */
  colors: ThemeColors
  /** テーマを変更 */
  setTheme: (id: ThemeId) => Promise<void>
  /** テーマ読み込み中 */
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/**
 * テーマプロバイダー
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME_ID)
  const [isLoading, setIsLoading] = useState(true)

  // テーマオブジェクトとカラーをメモ化
  const theme = useMemo(() => getThemeById(themeId), [themeId])
  const colors = useMemo(() => theme.colors, [theme])

  // 初期化: AsyncStorage からテーマを読み込み
  useEffect(() => {
    async function loadTheme() {
      try {
        // 1. ローカルストレージから読み込み（即時表示）
        const storedThemeId = await AsyncStorage.getItem(STORAGE_KEYS.THEME_ID)
        if (storedThemeId && isValidThemeId(storedThemeId)) {
          setThemeId(storedThemeId)
        }

        // 2. サーバーから設定を取得して同期（バックグラウンド）
        try {
          const result = await orpcClient.settings.getSettings()
          if (result.success && result.data?.themeId) {
            const serverThemeId = result.data.themeId
            if (isValidThemeId(serverThemeId)) {
              setThemeId(serverThemeId)
              await AsyncStorage.setItem(STORAGE_KEYS.THEME_ID, serverThemeId)
            }
          }
        } catch {
          // サーバー同期失敗時はローカル値を使用（オフライン対応）
          console.log('[ThemeProvider] Server sync failed, using local value')
        }
      } catch (error) {
        console.error('[ThemeProvider] Failed to load theme:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTheme()
  }, [])

  // テーマを変更
  const setTheme = useCallback(async (id: ThemeId) => {
    // 1. 即座に UI を更新
    setThemeId(id)

    // 2. ローカルストレージに保存
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_ID, id)
    } catch (error) {
      console.error('[ThemeProvider] Failed to save theme to storage:', error)
    }

    // 3. サーバーに同期（バックグラウンド）
    try {
      await orpcClient.settings.updateSettings({ themeId: id })
    } catch {
      console.log('[ThemeProvider] Server sync failed, will retry on next launch')
    }
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId,
      theme,
      colors,
      setTheme,
      isLoading,
    }),
    [themeId, theme, colors, setTheme, isLoading],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * テーマコンテキストを使用するフック
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/**
 * すべてのテーマプリセットを取得するフック
 */
export function useThemePresets() {
  return THEME_PRESETS
}
