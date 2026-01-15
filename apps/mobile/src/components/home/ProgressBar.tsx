import { View } from 'react-native'

interface ProgressBarProps {
  /** 進捗率（0-100） */
  progress: number
  /** 高さ（デフォルト: 4） */
  height?: number
}

/**
 * シンプルなプログレスバー
 * Notion風ミニマルデザイン - グレー背景に黒のプログレス
 */
export function ProgressBar({ progress, height = 4 }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <View className="w-full overflow-hidden rounded-full bg-gray-200" style={{ height }}>
      <View className="h-full rounded-full bg-gray-800" style={{ width: `${clampedProgress}%` }} />
    </View>
  )
}
