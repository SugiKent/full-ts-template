import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'
import { useAuth } from '@/hooks/useAuth'

export default function SettingsScreen() {
  const { t } = useTranslation('common')
  const { user, logout } = useAuth()

  return (
    <View className="flex-1 bg-white p-6">
      <Text className="mb-6 text-2xl font-bold text-gray-900">{t('settings')}</Text>

      {user && (
        <View className="mb-6 rounded-lg bg-gray-50 p-4">
          <Text className="text-lg font-medium text-gray-900">{user.name}</Text>
          <Text className="text-gray-600">{user.email}</Text>
        </View>
      )}

      <Pressable
        className="items-center rounded-lg bg-red-500 py-3 active:bg-red-600"
        onPress={logout}
      >
        <Text className="font-semibold text-white">{t('logout')}</Text>
      </Pressable>
    </View>
  )
}
