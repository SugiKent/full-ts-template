/**
 * テーマ定数
 *
 * プリセットテーマの定義とカラークラス
 */

/**
 * テーマプリセット
 *
 * NativeWind は Tailwind のクラス名をビルド時に静的解析するため、
 * 動的なクラス名生成ではなく、すべてのカラークラスを事前に定義する
 */
export const THEME_PRESETS = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ウォーム系
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  honey: {
    id: 'honey',
    name: '🍯 ハニー',
    previewColor: '#D97706',
    colors: {
      background: 'bg-amber-50',
      backgroundDark: 'bg-amber-100',
      primary: 'bg-amber-600',
      primaryHex: '#D97706',
      primaryText: 'text-amber-600',
      primaryActive: 'active:bg-amber-700',
      secondary: 'text-stone-500',
      secondaryHex: '#78716C',
      text: 'text-stone-800',
      textMuted: 'text-stone-500',
      border: 'border-amber-200',
      borderHex: '#FDE68A',
      card: 'bg-white',
      cardBorder: 'border-amber-200',
      // 拡張トークン
      cardActive: 'active:bg-amber-50',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-700',
      iconBg: 'bg-amber-100',
      iconColor: '#D97706',
      divider: 'bg-amber-200',
      dividerHex: '#FDE68A',
      dividerBorder: 'border-amber-100',
    },
  },
  sunset: {
    id: 'sunset',
    name: '🌅 サンセット',
    previewColor: '#EA580C',
    colors: {
      background: 'bg-orange-50',
      backgroundDark: 'bg-orange-100',
      primary: 'bg-orange-600',
      primaryHex: '#EA580C',
      primaryText: 'text-orange-600',
      primaryActive: 'active:bg-orange-700',
      secondary: 'text-stone-500',
      secondaryHex: '#78716C',
      text: 'text-stone-800',
      textMuted: 'text-stone-500',
      border: 'border-orange-200',
      borderHex: '#FED7AA',
      card: 'bg-white',
      cardBorder: 'border-orange-200',
      // 拡張トークン
      cardActive: 'active:bg-orange-50',
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-700',
      iconBg: 'bg-orange-100',
      iconColor: '#EA580C',
      divider: 'bg-orange-200',
      dividerHex: '#FED7AA',
      dividerBorder: 'border-orange-100',
    },
  },
  coffee: {
    id: 'coffee',
    name: '☕ コーヒー',
    previewColor: '#78350F',
    colors: {
      background: 'bg-yellow-50',
      backgroundDark: 'bg-yellow-100',
      primary: 'bg-yellow-900',
      primaryHex: '#78350F',
      primaryText: 'text-yellow-900',
      primaryActive: 'active:bg-yellow-800',
      secondary: 'text-yellow-700',
      secondaryHex: '#A16207',
      text: 'text-yellow-950',
      textMuted: 'text-yellow-700',
      border: 'border-yellow-300',
      borderHex: '#FDE047',
      card: 'bg-white',
      cardBorder: 'border-yellow-200',
      // 拡張トークン
      cardActive: 'active:bg-yellow-50',
      badgeBg: 'bg-yellow-100',
      badgeText: 'text-yellow-800',
      iconBg: 'bg-yellow-100',
      iconColor: '#78350F',
      divider: 'bg-yellow-200',
      dividerHex: '#FEF08A',
      dividerBorder: 'border-yellow-100',
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // クール系
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ocean: {
    id: 'ocean',
    name: '🌊 オーシャン',
    previewColor: '#0891B2',
    colors: {
      background: 'bg-cyan-50',
      backgroundDark: 'bg-cyan-100',
      primary: 'bg-cyan-600',
      primaryHex: '#0891B2',
      primaryText: 'text-cyan-600',
      primaryActive: 'active:bg-cyan-700',
      secondary: 'text-slate-500',
      secondaryHex: '#64748B',
      text: 'text-slate-800',
      textMuted: 'text-slate-500',
      border: 'border-cyan-200',
      borderHex: '#A5F3FC',
      card: 'bg-white',
      cardBorder: 'border-cyan-200',
      // 拡張トークン
      cardActive: 'active:bg-cyan-50',
      badgeBg: 'bg-cyan-100',
      badgeText: 'text-cyan-700',
      iconBg: 'bg-cyan-100',
      iconColor: '#0891B2',
      divider: 'bg-cyan-200',
      dividerHex: '#A5F3FC',
      dividerBorder: 'border-cyan-100',
    },
  },
  sky: {
    id: 'sky',
    name: '🩵 スカイ',
    previewColor: '#2563EB',
    colors: {
      background: 'bg-blue-50',
      backgroundDark: 'bg-blue-100',
      primary: 'bg-blue-600',
      primaryHex: '#2563EB',
      primaryText: 'text-blue-600',
      primaryActive: 'active:bg-blue-700',
      secondary: 'text-slate-500',
      secondaryHex: '#64748B',
      text: 'text-slate-800',
      textMuted: 'text-slate-500',
      border: 'border-blue-200',
      borderHex: '#BFDBFE',
      card: 'bg-white',
      cardBorder: 'border-blue-200',
      // 拡張トークン
      cardActive: 'active:bg-blue-50',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-700',
      iconBg: 'bg-blue-100',
      iconColor: '#2563EB',
      divider: 'bg-blue-200',
      dividerHex: '#BFDBFE',
      dividerBorder: 'border-blue-100',
    },
  },
  mint: {
    id: 'mint',
    name: '🌿 ミント',
    previewColor: '#0D9488',
    colors: {
      background: 'bg-teal-50',
      backgroundDark: 'bg-teal-100',
      primary: 'bg-teal-600',
      primaryHex: '#0D9488',
      primaryText: 'text-teal-600',
      primaryActive: 'active:bg-teal-700',
      secondary: 'text-slate-500',
      secondaryHex: '#64748B',
      text: 'text-slate-800',
      textMuted: 'text-slate-500',
      border: 'border-teal-200',
      borderHex: '#99F6E4',
      card: 'bg-white',
      cardBorder: 'border-teal-200',
      // 拡張トークン
      cardActive: 'active:bg-teal-50',
      badgeBg: 'bg-teal-100',
      badgeText: 'text-teal-700',
      iconBg: 'bg-teal-100',
      iconColor: '#0D9488',
      divider: 'bg-teal-200',
      dividerHex: '#99F6E4',
      dividerBorder: 'border-teal-100',
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ナチュラル系
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  forest: {
    id: 'forest',
    name: '🌲 フォレスト',
    previewColor: '#059669',
    colors: {
      background: 'bg-emerald-50',
      backgroundDark: 'bg-emerald-100',
      primary: 'bg-emerald-600',
      primaryHex: '#059669',
      primaryText: 'text-emerald-600',
      primaryActive: 'active:bg-emerald-700',
      secondary: 'text-stone-500',
      secondaryHex: '#78716C',
      text: 'text-stone-800',
      textMuted: 'text-stone-500',
      border: 'border-emerald-200',
      borderHex: '#A7F3D0',
      card: 'bg-white',
      cardBorder: 'border-emerald-200',
      // 拡張トークン
      cardActive: 'active:bg-emerald-50',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-700',
      iconBg: 'bg-emerald-100',
      iconColor: '#059669',
      divider: 'bg-emerald-200',
      dividerHex: '#A7F3D0',
      dividerBorder: 'border-emerald-100',
    },
  },
  lime: {
    id: 'lime',
    name: '🍀 ライム',
    previewColor: '#65A30D',
    colors: {
      background: 'bg-lime-50',
      backgroundDark: 'bg-lime-100',
      primary: 'bg-lime-600',
      primaryHex: '#65A30D',
      primaryText: 'text-lime-600',
      primaryActive: 'active:bg-lime-700',
      secondary: 'text-stone-500',
      secondaryHex: '#78716C',
      text: 'text-stone-800',
      textMuted: 'text-stone-500',
      border: 'border-lime-200',
      borderHex: '#D9F99D',
      card: 'bg-white',
      cardBorder: 'border-lime-200',
      // 拡張トークン
      cardActive: 'active:bg-lime-50',
      badgeBg: 'bg-lime-100',
      badgeText: 'text-lime-700',
      iconBg: 'bg-lime-100',
      iconColor: '#65A30D',
      divider: 'bg-lime-200',
      dividerHex: '#D9F99D',
      dividerBorder: 'border-lime-100',
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ロマンティック系
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  sakura: {
    id: 'sakura',
    name: '🌸 さくら',
    previewColor: '#DB2777',
    colors: {
      background: 'bg-pink-50',
      backgroundDark: 'bg-pink-100',
      primary: 'bg-pink-600',
      primaryHex: '#DB2777',
      primaryText: 'text-pink-600',
      primaryActive: 'active:bg-pink-700',
      secondary: 'text-pink-400',
      secondaryHex: '#F472B6',
      text: 'text-stone-800',
      textMuted: 'text-stone-500',
      border: 'border-pink-200',
      borderHex: '#FBCFE8',
      card: 'bg-white',
      cardBorder: 'border-pink-200',
      // 拡張トークン
      cardActive: 'active:bg-pink-50',
      badgeBg: 'bg-pink-100',
      badgeText: 'text-pink-700',
      iconBg: 'bg-pink-100',
      iconColor: '#DB2777',
      divider: 'bg-pink-200',
      dividerHex: '#FBCFE8',
      dividerBorder: 'border-pink-100',
    },
  },
  rose: {
    id: 'rose',
    name: '🌹 ローズ',
    previewColor: '#E11D48',
    colors: {
      background: 'bg-rose-50',
      backgroundDark: 'bg-rose-100',
      primary: 'bg-rose-600',
      primaryHex: '#E11D48',
      primaryText: 'text-rose-600',
      primaryActive: 'active:bg-rose-700',
      secondary: 'text-rose-400',
      secondaryHex: '#FB7185',
      text: 'text-stone-800',
      textMuted: 'text-stone-500',
      border: 'border-rose-200',
      borderHex: '#FECDD3',
      card: 'bg-white',
      cardBorder: 'border-rose-200',
      // 拡張トークン
      cardActive: 'active:bg-rose-50',
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-700',
      iconBg: 'bg-rose-100',
      iconColor: '#E11D48',
      divider: 'bg-rose-200',
      dividerHex: '#FECDD3',
      dividerBorder: 'border-rose-100',
    },
  },
  lavender: {
    id: 'lavender',
    name: '💜 ラベンダー',
    previewColor: '#7C3AED',
    colors: {
      background: 'bg-violet-50',
      backgroundDark: 'bg-violet-100',
      primary: 'bg-violet-600',
      primaryHex: '#7C3AED',
      primaryText: 'text-violet-600',
      primaryActive: 'active:bg-violet-700',
      secondary: 'text-violet-400',
      secondaryHex: '#A78BFA',
      text: 'text-slate-800',
      textMuted: 'text-slate-500',
      border: 'border-violet-200',
      borderHex: '#DDD6FE',
      card: 'bg-white',
      cardBorder: 'border-violet-200',
      // 拡張トークン
      cardActive: 'active:bg-violet-50',
      badgeBg: 'bg-violet-100',
      badgeText: 'text-violet-700',
      iconBg: 'bg-violet-100',
      iconColor: '#7C3AED',
      divider: 'bg-violet-200',
      dividerHex: '#DDD6FE',
      dividerBorder: 'border-violet-100',
    },
  },
  grape: {
    id: 'grape',
    name: '🍇 グレープ',
    previewColor: '#9333EA',
    colors: {
      background: 'bg-purple-50',
      backgroundDark: 'bg-purple-100',
      primary: 'bg-purple-600',
      primaryHex: '#9333EA',
      primaryText: 'text-purple-600',
      primaryActive: 'active:bg-purple-700',
      secondary: 'text-purple-400',
      secondaryHex: '#C084FC',
      text: 'text-slate-800',
      textMuted: 'text-slate-500',
      border: 'border-purple-200',
      borderHex: '#E9D5FF',
      card: 'bg-white',
      cardBorder: 'border-purple-200',
      // 拡張トークン
      cardActive: 'active:bg-purple-50',
      badgeBg: 'bg-purple-100',
      badgeText: 'text-purple-700',
      iconBg: 'bg-purple-100',
      iconColor: '#9333EA',
      divider: 'bg-purple-200',
      dividerHex: '#E9D5FF',
      dividerBorder: 'border-purple-100',
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // モノトーン系
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  stone: {
    id: 'stone',
    name: '🪨 ストーン',
    previewColor: '#57534E',
    colors: {
      background: 'bg-stone-50',
      backgroundDark: 'bg-stone-100',
      primary: 'bg-stone-600',
      primaryHex: '#57534E',
      primaryText: 'text-stone-600',
      primaryActive: 'active:bg-stone-700',
      secondary: 'text-stone-400',
      secondaryHex: '#A8A29E',
      text: 'text-stone-800',
      textMuted: 'text-stone-500',
      border: 'border-stone-200',
      borderHex: '#E7E5E4',
      card: 'bg-white',
      cardBorder: 'border-stone-200',
      // 拡張トークン
      cardActive: 'active:bg-stone-50',
      badgeBg: 'bg-stone-100',
      badgeText: 'text-stone-700',
      iconBg: 'bg-stone-100',
      iconColor: '#57534E',
      divider: 'bg-stone-200',
      dividerHex: '#E7E5E4',
      dividerBorder: 'border-stone-100',
    },
  },
  slate: {
    id: 'slate',
    name: '🌑 スレート',
    previewColor: '#475569',
    colors: {
      background: 'bg-slate-50',
      backgroundDark: 'bg-slate-100',
      primary: 'bg-slate-600',
      primaryHex: '#475569',
      primaryText: 'text-slate-600',
      primaryActive: 'active:bg-slate-700',
      secondary: 'text-slate-400',
      secondaryHex: '#94A3B8',
      text: 'text-slate-800',
      textMuted: 'text-slate-500',
      border: 'border-slate-200',
      borderHex: '#E2E8F0',
      card: 'bg-white',
      cardBorder: 'border-slate-200',
      // 拡張トークン
      cardActive: 'active:bg-slate-50',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-700',
      iconBg: 'bg-slate-100',
      iconColor: '#475569',
      divider: 'bg-slate-200',
      dividerHex: '#E2E8F0',
      dividerBorder: 'border-slate-100',
    },
  },
  midnight: {
    id: 'midnight',
    name: '🌙 ミッドナイト',
    previewColor: '#1E293B',
    colors: {
      background: 'bg-slate-100',
      backgroundDark: 'bg-slate-200',
      primary: 'bg-slate-800',
      primaryHex: '#1E293B',
      primaryText: 'text-slate-800',
      primaryActive: 'active:bg-slate-900',
      secondary: 'text-slate-500',
      secondaryHex: '#64748B',
      text: 'text-slate-900',
      textMuted: 'text-slate-600',
      border: 'border-slate-300',
      borderHex: '#CBD5E1',
      card: 'bg-white',
      cardBorder: 'border-slate-300',
      // 拡張トークン
      cardActive: 'active:bg-slate-100',
      badgeBg: 'bg-slate-200',
      badgeText: 'text-slate-800',
      iconBg: 'bg-slate-200',
      iconColor: '#1E293B',
      divider: 'bg-slate-300',
      dividerHex: '#CBD5E1',
      dividerBorder: 'border-slate-200',
    },
  },
} as const

/**
 * テーマID型
 */
export type ThemeId = keyof typeof THEME_PRESETS

/**
 * テーマ型
 */
export type Theme = (typeof THEME_PRESETS)[ThemeId]

/**
 * テーマカラー型
 */
export type ThemeColors = Theme['colors']

/**
 * デフォルトテーマID
 */
export const DEFAULT_THEME_ID: ThemeId = 'honey'

/**
 * テーマIDが有効か検証
 */
export function isValidThemeId(id: string): id is ThemeId {
  return id in THEME_PRESETS
}

/**
 * テーマIDからテーマを取得
 */
export function getThemeById(id: ThemeId): Theme {
  return THEME_PRESETS[id]
}

/**
 * すべてのテーマIDを取得
 */
export function getAllThemeIds(): ThemeId[] {
  return Object.keys(THEME_PRESETS) as ThemeId[]
}
