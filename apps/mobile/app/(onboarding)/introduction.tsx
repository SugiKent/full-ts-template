/**
 * サービス説明画面（4画面スワイプ）
 */

import { useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

interface SlideContent {
  id: string
  icon: string
  title: string
  description: string
}

const SLIDES: SlideContent[] = [
  {
    id: 'welcome',
    icon: '🌟',
    title: 'My Wishlistへようこそ',
    description: 'やりたいことを「今月やること」として可視化し、第一歩を踏み出しましょう',
  },
  {
    id: 'create',
    icon: '📝',
    title: 'ウィッシュリストを作成',
    description: '旅行、スキル習得、趣味など、あなたのやりたいことを自由に登録できます',
  },
  {
    id: 'select',
    icon: '🎯',
    title: '今月やることを選ぶ',
    description: '最大10個を選んで、今月集中する目標を決めましょう',
  },
]

export default function IntroductionScreen() {
  const router = useRouter()
  const pagerRef = useRef<PagerView>(null)
  const [currentPage, setCurrentPage] = useState(0)

  const isLastPage = currentPage === SLIDES.length - 1

  const handlePageSelected = useCallback((e: PagerViewOnPageSelectedEvent) => {
    setCurrentPage(e.nativeEvent.position)
  }, [])

  const handleNext = useCallback(() => {
    if (isLastPage) {
      router.push('/(onboarding)/terms')
    } else {
      pagerRef.current?.setPage(currentPage + 1)
    }
  }, [isLastPage, currentPage, router])

  const handleSkip = useCallback(() => {
    router.push('/(onboarding)/terms')
  }, [router])

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* スキップボタン */}
      <View className="flex-row justify-end px-5 py-3">
        {!isLastPage && (
          <Pressable onPress={handleSkip} className="px-3 py-2">
            <Text className="text-base text-stone-500">スキップ</Text>
          </Pressable>
        )}
      </View>

      {/* スライドコンテンツ */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} className="flex-1 items-center justify-center px-10">
            <Animated.View entering={FadeInUp.delay(100).duration(400)} className="items-center">
              {/* アイコン */}
              <View className="mb-8 h-32 w-32 items-center justify-center rounded-full bg-stone-100">
                <Text className="text-6xl">{slide.icon}</Text>
              </View>

              {/* タイトル */}
              <Text className="mb-4 text-center text-2xl font-bold text-stone-800">
                {slide.title}
              </Text>

              {/* 説明 */}
              <Text className="text-center text-base leading-6 text-stone-600">
                {slide.description}
              </Text>
            </Animated.View>
          </View>
        ))}
      </PagerView>

      {/* ページインジケーター */}
      <View className="mb-6 flex-row items-center justify-center">
        {SLIDES.map((slide, index) => (
          <View
            key={slide.id}
            className={`mx-1 h-2 rounded-full ${
              index === currentPage ? 'w-6 bg-stone-800' : 'w-2 bg-stone-300'
            }`}
          />
        ))}
      </View>

      {/* ボタン */}
      <View className="px-5 pb-6">
        <Pressable
          onPress={handleNext}
          className="items-center rounded-xl bg-stone-800 py-4 active:bg-stone-700"
        >
          <Text className="text-base font-semibold text-white">
            {isLastPage ? '始める' : '次へ'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
