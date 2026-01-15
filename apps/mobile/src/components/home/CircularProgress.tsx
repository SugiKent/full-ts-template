import { View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

interface CircularProgressProps {
  /** 進捗率（0-100） */
  progress: number
  /** サイズ（直径） */
  size?: number
  /** ストロークの太さ */
  strokeWidth?: number
  /** 進捗バーの色 */
  color?: string
  /** 背景の色 */
  backgroundColor?: string
}

/**
 * 円形プログレスインジケーター
 * 視覚的に美しい進捗表示
 */
export function CircularProgress({
  progress,
  size = 40,
  strokeWidth = 3,
  color = '#1F2937',
  backgroundColor = '#E5E7EB',
}: CircularProgressProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* 背景の円 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* 進捗の円 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  )
}
