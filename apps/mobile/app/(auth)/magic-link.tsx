import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'

export default function MagicLinkScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const router = useRouter()

  useEffect(() => {
    // Magic link verification would happen here
    // For now, redirect to login
    if (token) {
      // TODO: Implement magic link verification when server supports it
      router.replace('/(auth)/login')
    } else {
      router.replace('/(auth)/login')
    }
  }, [token, router])

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="mt-4 text-gray-600">認証中...</Text>
    </View>
  )
}
