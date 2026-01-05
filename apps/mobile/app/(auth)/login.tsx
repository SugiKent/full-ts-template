import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Pressable, Text, TextInput, View } from 'react-native'
import { authClient } from '@/services/auth-client'

export default function LoginScreen() {
  const { t } = useTranslation('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) return

    setIsLoading(true)
    try {
      await authClient.signIn.email({
        email,
        password,
      })
    } catch (error) {
      Alert.alert(t('error.title'), t('error.sendFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <Text className="mb-8 text-center text-3xl font-bold">{t('login.title')}</Text>

      <TextInput
        className="mb-4 rounded-lg border border-gray-300 px-4 py-3"
        placeholder={t('login.emailPlaceholder')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      <TextInput
        className="mb-4 rounded-lg border border-gray-300 px-4 py-3"
        placeholder={t('login.passwordPlaceholder')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
      />

      <Pressable
        className="items-center rounded-lg bg-blue-600 py-3 disabled:bg-gray-400"
        onPress={handleLogin}
        disabled={isLoading || !email || !password}
      >
        <Text className="font-semibold text-white">
          {isLoading ? t('common.loading') : t('login.submit')}
        </Text>
      </Pressable>
    </View>
  )
}
