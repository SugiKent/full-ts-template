/**
 * プリセットカテゴリー定数
 *
 * オンボーディング時にユーザーに提示するカテゴリー一覧
 * PROJECT.md の仕様に準拠
 */

import type { PresetCategory } from '@wishlist/shared/schemas/preset-category'

/**
 * プリセットカテゴリー一覧
 *
 * 注意: 順序は表示順序を表す
 */
export const PRESET_CATEGORIES: readonly PresetCategory[] = [
  { id: 'travel', title: '旅行', icon: '🌍' },
  { id: 'skill', title: 'スキル習得', icon: '📚' },
  { id: 'hobby', title: '趣味', icon: '🎨' },
  { id: 'health', title: '健康', icon: '💪' },
  { id: 'career', title: 'キャリア', icon: '💼' },
  { id: 'money', title: 'お金', icon: '💰' },
  { id: 'relationship', title: '人間関係', icon: '👥' },
  { id: 'self-investment', title: '自己投資', icon: '📖' },
  { id: 'experience', title: '体験', icon: '🎭' },
  { id: 'other', title: 'その他', icon: '✨' },
] as const
