import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'
import { useAuth } from '@/hooks/useAuth'

export default function HomeScreen() {
  const { t } = useTranslation('common')
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">{t('loading')}</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold text-gray-900">{t('home.title')}</Text>
      {user && (
        <Text className="mt-4 text-lg text-gray-600">{t('home.welcome', { name: user.name })}</Text>
      )}
    </View>
  )
}
