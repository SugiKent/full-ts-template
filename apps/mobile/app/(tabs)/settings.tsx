/**
 * 設定画面
 *
 * テーマカスタマイズ、法的文書リンク、データ削除、アプリ情報を提供
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  Palette,
  Shield,
  Trash2,
} from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/constants/legal'
import { STORAGE_KEYS } from '@/constants/storage'
import { useDeleteDeviceData } from '@/hooks/useApi'
import { useTheme, useThemePresets } from '@/providers/ThemeProvider'
import { clearAuthData } from '@/services/device.service'

/**
 * アプリバージョンを取得
 */
function getAppVersion(): string {
  return Constants.expoConfig?.version ?? '1.0.0'
}

/**
 * テーマカテゴリ
 */
const THEME_CATEGORIES = [
  { label: 'ウォーム', themes: ['honey', 'sunset', 'coffee'] as const },
  { label: 'クール', themes: ['ocean', 'sky', 'mint'] as const },
  { label: 'ナチュラル', themes: ['forest', 'lime'] as const },
  { label: 'ロマンティック', themes: ['sakura', 'rose', 'lavender', 'grape'] as const },
  { label: 'モノトーン', themes: ['stone', 'slate', 'midnight'] as const },
]

/**
 * テーマセレクター
 */
function ThemeSelector() {
  const { themeId: currentThemeId, setTheme, colors } = useTheme()
  const presets = useThemePresets()

  return (
    <View className="gap-4">
      {THEME_CATEGORIES.map((category) => (
        <View key={category.label}>
          <Text className={`text-xs font-medium ${colors.textMuted} mb-2 uppercase tracking-wider`}>
            {category.label}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {category.themes.map((id) => {
              const theme = presets[id]
              const isSelected = id === currentThemeId

              return (
                <Pressable
                  key={id}
                  className={`rounded-xl border-2 px-3 py-2.5 ${
                    isSelected ? 'border-stone-400 bg-stone-50' : 'border-stone-200 bg-white'
                  }`}
                  onPress={() => setTheme(id)}
                >
                  <View className="flex-row items-center">
                    <View
                      className="h-5 w-5 rounded-full mr-2"
                      style={{ backgroundColor: theme.previewColor }}
                    />
                    <Text
                      className={`text-sm ${isSelected ? 'font-semibold' : 'font-medium'} ${colors.text}`}
                    >
                      {theme.name}
                    </Text>
                    {isSelected && <Check size={16} color="#78716C" className="ml-1" />}
                  </View>
                </Pressable>
              )
            })}
          </View>
        </View>
      ))}
    </View>
  )
}

/**
 * セクションタイトル
 */
function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  const { colors } = useTheme()

  return (
    <View className="flex-row items-center mb-3">
      {icon}
      <Text className={`ml-2 text-base font-semibold ${colors.text}`}>{title}</Text>
    </View>
  )
}

/**
 * リンクアイテム
 */
function LinkItem({
  icon,
  title,
  onPress,
}: {
  icon: React.ReactNode
  title: string
  onPress: () => void
}) {
  const { colors } = useTheme()

  return (
    <Pressable className="flex-row items-center py-3 active:opacity-70" onPress={onPress}>
      {icon}
      <Text className={`ml-3 flex-1 text-base ${colors.text}`}>{title}</Text>
      <ChevronRight size={20} color="#9CA3AF" />
    </Pressable>
  )
}

export default function SettingsScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const [isDeleting, setIsDeleting] = useState(false)

  // デバイスデータ削除ミューテーション
  const deleteDeviceDataMutation = useDeleteDeviceData()

  /**
   * 利用規約を開く
   */
  const handleOpenTerms = useCallback(() => {
    Linking.openURL(TERMS_OF_SERVICE_URL)
  }, [])

  /**
   * プライバシーポリシーを開く
   */
  const handleOpenPrivacy = useCallback(() => {
    Linking.openURL(PRIVACY_POLICY_URL)
  }, [])

  /**
   * データ削除を実行
   */
  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true)

    try {
      // 1. サーバー側でデバイスデータを削除
      await deleteDeviceDataMutation.mutateAsync()

      // 2. ローカルストレージをクリア
      await clearAuthData()
      await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED)
      await AsyncStorage.removeItem(STORAGE_KEYS.THEME_ID)

      // 3. オンボーディング画面へリダイレクト
      router.replace('/(onboarding)/splash')
    } catch (error) {
      console.error('Failed to delete device data:', error)
      Alert.alert('エラーが発生しました', 'データの削除に失敗しました', [{ text: 'OK' }])
    } finally {
      setIsDeleting(false)
    }
  }, [deleteDeviceDataMutation, router])

  /**
   * データ削除の確認ダイアログを表示
   */
  const handleDeletePress = useCallback(() => {
    Alert.alert(
      '本当に削除しますか？',
      'この操作を実行すると、すべてのウィッシュリスト、カテゴリー、設定が完全に削除されます。この操作は取り消せません。',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: handleDeleteConfirm,
        },
      ],
    )
  }, [handleDeleteConfirm])

  /**
   * 戻るボタン
   */
  const handleGoBack = useCallback(() => {
    router.back()
  }, [router])

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`} edges={['top']}>
      {/* ヘッダー */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable className="rounded-full p-2 active:bg-stone-100" onPress={handleGoBack}>
          <ArrowLeft size={24} color="#78716C" />
        </Pressable>
        <Text className={`ml-2 text-xl font-bold ${colors.text}`}>設定</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* テーマセクション */}
        <View className="mx-4 mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <SectionTitle icon={<Palette size={20} color="#78716C" />} title="テーマ" />
          <ThemeSelector />
        </View>

        {/* 法的文書セクション */}
        <View className="mx-4 mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <SectionTitle icon={<FileText size={20} color="#78716C" />} title="法的情報" />
          <LinkItem
            icon={<FileText size={20} color="#9CA3AF" />}
            title="利用規約"
            onPress={handleOpenTerms}
          />
          <View className="h-px bg-stone-100" />
          <LinkItem
            icon={<Shield size={20} color="#9CA3AF" />}
            title="プライバシーポリシー"
            onPress={handleOpenPrivacy}
          />
        </View>

        {/* データ管理セクション */}
        <View className="mx-4 mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <SectionTitle icon={<Trash2 size={20} color="#DC2626" />} title="データ管理" />
          <Text className="mb-4 text-sm text-red-600">
            すべてのデータを削除します。この操作は取り消せません。
          </Text>
          <Pressable
            className="flex-row items-center justify-center rounded-xl bg-red-600 py-3 active:bg-red-700 disabled:opacity-50"
            onPress={handleDeletePress}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Trash2 size={18} color="#FFFFFF" />
                <Text className="ml-2 font-medium text-white">データを削除</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* アプリ情報セクション */}
        <View className="mx-4 items-center py-4">
          <Text className={`text-lg font-semibold ${colors.text}`}>My Wishlist</Text>
          <Text className={`text-sm ${colors.textMuted}`}>バージョン {getAppVersion()}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
