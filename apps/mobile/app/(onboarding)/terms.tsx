/**
 * 利用規約同意画面
 */

import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/constants'
import { useOnboarding } from '@/providers/OnboardingProvider'

export default function TermsScreen() {
  const router = useRouter()
  const { state, acceptTerms } = useOnboarding()

  const [termsChecked, setTermsChecked] = useState(state.termsAccepted)
  const [privacyChecked, setPrivacyChecked] = useState(state.privacyAccepted)

  const handleTermsToggle = useCallback(() => {
    const newValue = !termsChecked
    setTermsChecked(newValue)
    acceptTerms(newValue, privacyChecked)
  }, [termsChecked, privacyChecked, acceptTerms])

  const handlePrivacyToggle = useCallback(() => {
    const newValue = !privacyChecked
    setPrivacyChecked(newValue)
    acceptTerms(termsChecked, newValue)
  }, [termsChecked, privacyChecked, acceptTerms])

  const handleViewTerms = useCallback(() => {
    Linking.openURL(TERMS_OF_SERVICE_URL)
  }, [])

  const handleViewPrivacy = useCallback(() => {
    Linking.openURL(PRIVACY_POLICY_URL)
  }, [])

  const handleContinue = useCallback(() => {
    if (termsChecked && privacyChecked) {
      router.push('/(onboarding)/categories')
    }
  }, [termsChecked, privacyChecked, router])

  const isValid = termsChecked && privacyChecked

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-5 pt-10">
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          {/* タイトル */}
          <Text className="mb-2 text-2xl font-bold text-stone-800">利用規約への同意</Text>
          <Text className="mb-10 text-base text-stone-500">
            サービスをご利用いただくには、以下への同意が必要です
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(400)} className="space-y-4">
          {/* 利用規約チェックボックス */}
          <Pressable
            onPress={handleTermsToggle}
            className="flex-row items-center rounded-xl bg-stone-50 p-4"
          >
            <View
              className={`mr-4 h-6 w-6 items-center justify-center rounded-md border-2 ${
                termsChecked ? 'border-stone-800 bg-stone-800' : 'border-stone-300 bg-white'
              }`}
            >
              {termsChecked && <Text className="text-sm text-white">✓</Text>}
            </View>
            <View className="flex-1">
              <Text className="text-base font-medium text-stone-800">利用規約に同意する</Text>
            </View>
            <Pressable onPress={handleViewTerms} className="px-2 py-1">
              <Text className="text-sm text-stone-500 underline">利用規約を見る</Text>
            </Pressable>
          </Pressable>

          {/* プライバシーポリシーチェックボックス */}
          <Pressable
            onPress={handlePrivacyToggle}
            className="mt-4 flex-row items-center rounded-xl bg-stone-50 p-4"
          >
            <View
              className={`mr-4 h-6 w-6 items-center justify-center rounded-md border-2 ${
                privacyChecked ? 'border-stone-800 bg-stone-800' : 'border-stone-300 bg-white'
              }`}
            >
              {privacyChecked && <Text className="text-sm text-white">✓</Text>}
            </View>
            <View className="flex-1">
              <Text className="text-base font-medium text-stone-800">
                プライバシーポリシーに同意する
              </Text>
            </View>
            <Pressable onPress={handleViewPrivacy} className="px-2 py-1">
              <Text className="text-sm text-stone-500 underline">プライバシーポリシーを見る</Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </View>

      {/* 続行ボタン */}
      <View className="px-5 pb-6">
        <Pressable
          onPress={handleContinue}
          disabled={!isValid}
          className={`items-center rounded-xl py-4 ${
            isValid ? 'bg-stone-800 active:bg-stone-700' : 'bg-stone-300'
          }`}
        >
          <Text className={`text-base font-semibold ${isValid ? 'text-white' : 'text-stone-500'}`}>
            同意して続ける
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
