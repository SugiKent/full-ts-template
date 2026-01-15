/**
 * ルートレイアウト
 * 認証完了後にサーバー API でオンボーディング状態を判定してリダイレクト
 */

import { STORAGE_KEYS } from '@/constants/storage'
import { useNeedsOnboarding } from '@/hooks/useApi'
import { AuthProvider, useAuth } from '@/providers/AuthProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import '../global.css'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Toast from 'react-native-toast-message'

/**
 * オンボーディングゲート
 *
 * 認証完了後にサーバー API でオンボーディング状態を判定し、
 * 適切な画面にリダイレクトする
 *
 * - サーバー API を SSOT（Single Source of Truth）として扱う
 * - AsyncStorage はキャッシュとして補助的に使用（API エラー時のフォールバック）
 */
function OnboardingGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const segments = useSegments()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [isReady, setIsReady] = useState(false)
  const [cachedOnboardingStatus, setCachedOnboardingStatus] = useState<boolean | null>(null)

  // サーバー API でオンボーディング状態を取得
  // 認証完了後にのみ API を呼び出す（トークンが必要なため）
  const {
    data: needsOnboardingData,
    isLoading: isOnboardingLoading,
    isError: isOnboardingError,
  } = useNeedsOnboarding(isAuthenticated)

  // 認証中は AsyncStorage のキャッシュを読み込み（フォールバック用）
  useEffect(() => {
    const loadCachedStatus = async () => {
      try {
        const completed = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED)
        setCachedOnboardingStatus(completed === 'true')
      } catch (error) {
        console.error('Failed to load cached onboarding status:', error)
        setCachedOnboardingStatus(false)
      }
    }

    loadCachedStatus()
  }, [])

  // サーバー API の結果を AsyncStorage にキャッシュ
  useEffect(() => {
    const updateCache = async () => {
      if (needsOnboardingData === undefined) return

      // オンボーディング完了 = アイテムがある AND 利用規約に同意済み
      const isCompleted =
        !needsOnboardingData.needsOnboarding && needsOnboardingData.hasAgreedToTerms
      try {
        if (isCompleted) {
          await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true')
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED)
        }
        setCachedOnboardingStatus(isCompleted)
      } catch (error) {
        console.error('Failed to update onboarding cache:', error)
      }
    }

    updateCache()
  }, [needsOnboardingData])

  // リダイレクトロジック
  useEffect(() => {
    // 認証中は待機
    if (isAuthLoading) return

    // 認証済みかつ API 読み込み中は待機
    if (isAuthenticated && isOnboardingLoading) return

    // キャッシュがまだ読み込まれていない場合は待機
    if (cachedOnboardingStatus === null) return

    // オンボーディング状態を判定
    // 優先順位: サーバー API > AsyncStorage キャッシュ
    // オンボーディング完了 = アイテムがある AND 利用規約に同意済み
    let isOnboardingCompleted: boolean
    if (isOnboardingError || needsOnboardingData === undefined) {
      // API エラー時はキャッシュを使用
      isOnboardingCompleted = cachedOnboardingStatus
    } else {
      // needsOnboarding=false かつ hasAgreedToTerms=true の場合のみ完了とみなす
      isOnboardingCompleted =
        !needsOnboardingData.needsOnboarding && needsOnboardingData.hasAgreedToTerms
    }

    const inOnboardingGroup = segments[0] === '(onboarding)'

    if (isOnboardingCompleted) {
      // オンボーディング完了済み
      if (inOnboardingGroup) {
        // オンボーディング画面にいる場合はホームへリダイレクト
        router.replace('/(tabs)')
      } else {
        // 正しい画面にいるので準備完了
        setIsReady(true)
      }
    } else {
      // オンボーディング未完了
      if (!inOnboardingGroup) {
        // オンボーディング画面以外にいる場合はオンボーディングへリダイレクト
        router.replace('/(onboarding)/splash')
      } else {
        // 正しい画面にいるので準備完了
        setIsReady(true)
      }
    }
  }, [
    isAuthLoading,
    isAuthenticated,
    isOnboardingLoading,
    isOnboardingError,
    needsOnboardingData,
    cachedOnboardingStatus,
    segments,
    router,
  ])

  // 準備中は何も表示しない（スプラッシュ画面が代わりに表示される）
  // リダイレクト中も children をレンダリングしない
  if (!isReady) {
    return null
  }

  return <>{children}</>
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              <OnboardingGate>
                <StatusBar style="auto" />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(onboarding)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </OnboardingGate>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </BottomSheetModalProvider>
      <Toast />
    </GestureHandlerRootView>
  )
}
