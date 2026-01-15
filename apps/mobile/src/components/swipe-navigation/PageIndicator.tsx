import { BlurView } from 'expo-blur'
import { useCallback, useEffect, useRef } from 'react'
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
} from 'react-native-reanimated'

interface IconItem {
  id: string
  icon: string
}

interface PageIndicatorProps {
  icons: IconItem[]
  scrollOffset: SharedValue<number>
  onPagePress: (index: number) => void
}

const ICON_SIZE = 48
const ICON_SPACING = 4
const HORIZONTAL_PADDING = 8

// 1アイコンあたりの幅（アイコンサイズ + 間隔）
const ICON_TOTAL_WIDTH = ICON_SIZE + ICON_SPACING

// 画面幅の70%を最大幅とする
const SCREEN_WIDTH = Dimensions.get('window').width
const MAX_CONTAINER_WIDTH = SCREEN_WIDTH * 0.7

// スクロールが必要かどうかを判定する閾値（アイコン数）
const SCROLL_THRESHOLD_ICONS = 5

/**
 * ページインジケーター（絵文字）コンポーネント
 * App Store風タブバーデザイン
 * 選択中のアイコンは背景色で強調
 * カテゴリーが多い場合は横スクロール対応
 */
export function PageIndicator({ icons, scrollOffset, onPagePress }: PageIndicatorProps) {
  const scrollViewRef = useRef<ScrollView>(null)
  const currentPageRef = useRef(0)

  // アイコン数に基づいてスクロールが必要かを判定
  const needsScroll = icons.length > SCROLL_THRESHOLD_ICONS

  // コンテンツの実際の幅を計算
  const contentWidth = icons.length * ICON_TOTAL_WIDTH - ICON_SPACING + HORIZONTAL_PADDING * 2

  // コンテナの幅を決定（スクロール不要なら内容に合わせる、必要なら最大幅に制限）
  const containerWidth = needsScroll ? Math.min(contentWidth, MAX_CONTAINER_WIDTH) : undefined

  // 選択中のタブを表示領域に収めるスクロール処理
  const scrollToIndex = useCallback(
    (index: number) => {
      if (!scrollViewRef.current || !needsScroll) return

      // タブの中央位置
      const tabCenterX = HORIZONTAL_PADDING + index * ICON_TOTAL_WIDTH + ICON_SIZE / 2
      // コンテナの表示幅の中央
      const visibleWidth = containerWidth ?? contentWidth
      const targetScrollX = tabCenterX - visibleWidth / 2

      // スクロール位置を制限（0 〜 最大スクロール位置）
      const maxScrollX = contentWidth - visibleWidth
      const clampedScrollX = Math.max(0, Math.min(targetScrollX, maxScrollX))

      scrollViewRef.current.scrollTo({ x: clampedScrollX, animated: true })
    },
    [needsScroll, containerWidth, contentWidth],
  )

  // scrollOffset の変化を監視して自動スクロール
  useAnimatedReaction(
    () => Math.round(scrollOffset.value),
    (currentPage, previousPage) => {
      if (currentPage !== previousPage && currentPage !== currentPageRef.current) {
        runOnJS(scrollToIndex)(currentPage)
        currentPageRef.current = currentPage
      }
    },
    [needsScroll, containerWidth, contentWidth],
  )

  // 初期表示時に現在のページにスクロール
  useEffect(() => {
    const initialPage = Math.round(scrollOffset.value)
    if (initialPage > 0 && needsScroll) {
      // 少し遅延させて確実にScrollViewがマウントされてから実行
      const timer = setTimeout(() => scrollToIndex(initialPage), 100)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [needsScroll, scrollOffset, scrollToIndex])

  const handlePagePress = (index: number) => {
    onPagePress(index)
    scrollToIndex(index)
  }

  return (
    <View style={styles.container}>
      <View style={[styles.glassContainer, containerWidth ? { width: containerWidth } : undefined]}>
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />

        {needsScroll ? (
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.iconsRow}
            scrollEventThrottle={16}
          >
            {icons.map((iconItem, index) => (
              <AnimatedIcon
                key={iconItem.id}
                index={index}
                icon={iconItem.icon}
                scrollOffset={scrollOffset}
                onPress={() => handlePagePress(index)}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.iconsRow}>
            {icons.map((iconItem, index) => (
              <AnimatedIcon
                key={iconItem.id}
                index={index}
                icon={iconItem.icon}
                scrollOffset={scrollOffset}
                onPress={() => handlePagePress(index)}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    backgroundColor: 'transparent',
  },
  glassContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 8,
    gap: ICON_SPACING,
  },
})

interface AnimatedIconProps {
  index: number
  icon: string
  scrollOffset: SharedValue<number>
  onPress: () => void
}

function AnimatedIcon({ index, icon, scrollOffset, onPress }: AnimatedIconProps) {
  const animatedContainerStyle = useAnimatedStyle(() => {
    const inputRange = [index - 1, index, index + 1]

    // アクティブ時に背景色を付ける
    const backgroundColor = interpolateColor(scrollOffset.value, inputRange, [
      'transparent',
      'rgba(120, 113, 108, 0.15)',
      'transparent',
    ])

    return {
      backgroundColor,
    }
  })

  const animatedIconStyle = useAnimatedStyle(() => {
    const inputRange = [index - 1, index, index + 1]

    const scale = interpolate(scrollOffset.value, inputRange, [0.85, 1, 0.85], 'clamp')
    const opacity = interpolate(scrollOffset.value, inputRange, [0.5, 1, 0.5], 'clamp')

    return {
      transform: [{ scale }],
      opacity,
    }
  })

  return (
    <Pressable onPress={onPress} hitSlop={4}>
      <Animated.View
        style={[
          {
            width: ICON_SIZE,
            height: ICON_SIZE,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
          },
          animatedContainerStyle,
        ]}
      >
        <Animated.Text style={[{ fontSize: 24 }, animatedIconStyle]}>{icon}</Animated.Text>
      </Animated.View>
    </Pressable>
  )
}
