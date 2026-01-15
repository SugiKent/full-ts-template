/**
 * オンボーディング用Stackナビゲーション
 */

import { Stack } from 'expo-router'
import { OnboardingProvider } from '@/providers/OnboardingProvider'

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: false, // スワイプで戻れないようにする
        }}
      >
        <Stack.Screen name="splash" />
        <Stack.Screen name="introduction" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="items" />
        <Stack.Screen name="monthly-goals" />
        <Stack.Screen name="steps" />
      </Stack>
    </OnboardingProvider>
  )
}
