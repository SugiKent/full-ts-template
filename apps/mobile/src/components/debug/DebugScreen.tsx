/**
 * デバッグスクリーン
 *
 * フルスクリーンモーダルとして表示
 * デバイス情報の表示とデータ削除機能を提供
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { Calendar, Shield, Smartphone, Trash2, X } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, Modal, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { STORAGE_KEYS } from '@/constants/storage'
import { useDeleteDeviceData, useDeviceStatus } from '@/hooks/useApi'
import { useAuth } from '@/providers/AuthProvider'
import { clearAuthData } from '@/services/device.service'

interface DebugScreenProps {
  visible: boolean
  onClose: () => void
}

/**
 * 日付をフォーマット
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DebugScreen({ visible, onClose }: DebugScreenProps) {
  const router = useRouter()
  const { deviceId } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)

  // デバイス状態を取得
  const { data: deviceStatus, isLoading: isLoadingStatus } = useDeviceStatus(deviceId ?? '')

  // デバイスデータ削除ミューテーション
  const deleteDeviceDataMutation = useDeleteDeviceData()

  /**
   * データ削除を実行
   */
  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true)

    try {
      // 1. サーバー側でデバイスデータを削除
      await deleteDeviceDataMutation.mutateAsync()

      // 2. ローカルストレージをクリア
      // SecureStore から deviceId、accessToken、expiresAt を削除
      await clearAuthData()

      // AsyncStorage から ONBOARDING_COMPLETED を削除
      await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED)

      // 3. モーダルを閉じる
      onClose()

      // 4. オンボーディング画面へリダイレクト
      // Note: 少し遅延を入れてモーダルのクローズアニメーションを待つ
      setTimeout(() => {
        router.replace('/(onboarding)/splash')
      }, 300)
    } catch (error) {
      console.error('Failed to delete device data:', error)
      Alert.alert('エラーが発生しました', 'データの削除に失敗しました', [{ text: 'OK' }])
    } finally {
      setIsDeleting(false)
    }
  }, [deleteDeviceDataMutation, onClose, router])

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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-stone-100">
        {/* ヘッダー */}
        <View className="flex-row items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
          <Text className="text-lg font-bold text-stone-800">デバッグ</Text>
          <Pressable className="rounded-full p-2 active:bg-stone-100" onPress={onClose}>
            <X size={24} color="#78716C" />
          </Pressable>
        </View>

        {/* コンテンツ */}
        <View className="flex-1 p-4">
          {/* デバイス情報カード */}
          <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
            <Text className="mb-4 text-base font-semibold text-stone-800">デバイス情報</Text>

            {isLoadingStatus ? (
              <ActivityIndicator size="small" color="#D97706" />
            ) : (
              <View className="gap-3">
                {/* Device ID */}
                <View className="flex-row items-center">
                  <View className="mr-3 rounded-lg bg-amber-100 p-2">
                    <Smartphone size={18} color="#D97706" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-stone-500">Device ID</Text>
                    <Text
                      className="font-mono text-sm text-stone-700"
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {deviceId ?? '-'}
                    </Text>
                  </View>
                </View>

                {/* Platform */}
                <View className="flex-row items-center">
                  <View className="mr-3 rounded-lg bg-blue-100 p-2">
                    <Shield size={18} color="#2563EB" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-stone-500">Platform</Text>
                    <Text className="text-sm text-stone-700">{deviceStatus?.platform ?? '-'}</Text>
                  </View>
                </View>

                {/* 作成日時 */}
                <View className="flex-row items-center">
                  <View className="mr-3 rounded-lg bg-green-100 p-2">
                    <Calendar size={18} color="#16A34A" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-stone-500">初回アクセス</Text>
                    <Text className="text-sm text-stone-700">
                      {deviceStatus?.firstSeenAt ? formatDate(deviceStatus.firstSeenAt) : '-'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* 危険ゾーン */}
          <View className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <Text className="mb-2 text-base font-semibold text-red-800">危険な操作</Text>
            <Text className="mb-4 text-sm text-red-600">
              以下の操作は取り消せません。すべてのデータが完全に削除されます。
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
                  <Text className="ml-2 font-medium text-white">すべてのデータを削除</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}
