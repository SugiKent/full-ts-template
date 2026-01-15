/**
 * スプラッシュ画面
 * アプリロゴを表示し、2秒後に自動遷移
 */

import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SplashScreen() {
  const router = useRouter()

  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.8)
  const taglineOpacity = useSharedValue(0)

  useEffect(() => {
    // ロゴのアニメーション
    opacity.value = withTiming(1, { duration: 600 })
    scale.value = withTiming(1, { duration: 600 })

    // タグラインのフェードイン（遅延）
    taglineOpacity.value = withDelay(400, withTiming(1, { duration: 400 }))

    // 2秒後に次の画面へ
    const timer = setTimeout(() => {
      router.replace('/(onboarding)/introduction')
    }, 2000)

    return () => clearTimeout(timer)
  }, [opacity, scale, taglineOpacity, router])

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }))

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Animated.View style={logoAnimatedStyle} className="items-center">
          {/* アプリアイコン/ロゴ */}
          <View className="mb-4 h-24 w-24 items-center justify-center rounded-3xl bg-stone-100">
            <Text className="text-5xl">✨</Text>
          </View>

          {/* アプリ名 */}
          <Text className="text-2xl font-bold text-stone-800">My Wishlist</Text>
        </Animated.View>

        {/* タグライン */}
        <Animated.View style={taglineAnimatedStyle} className="mt-4">
          <Text className="text-base text-stone-500">あなたの願いを叶える第一歩</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}
