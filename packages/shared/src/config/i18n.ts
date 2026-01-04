/**
 * i18n 言語設定
 *
 * このファイルで対応言語を一元管理します。
 * 新しい言語を追加する場合は、以下を更新してください：
 * 1. SUPPORTED_LANGUAGES に言語コードを追加
 * 2. LANGUAGE_NAMES に言語名を追加
 * 3. src/client/locales/{言語コード}/ にJSON翻訳ファイルを追加
 * 4. src/client/i18n/index.ts でリソースをimport
 */

/**
 * 対応言語コードの配列
 * - 最初の要素がフォールバック言語として使用されます
 */
export const SUPPORTED_LANGUAGES = ['ja'] as const

/**
 * 対応言語の型
 */
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

/**
 * フォールバック言語（対応言語の最初の要素）
 */
export const FALLBACK_LANGUAGE: SupportedLanguage = SUPPORTED_LANGUAGES[0]

/**
 * 各言語の表示名
 */
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  ja: '日本語',
  // en: 'English',
  // zh: '中文',
}

/**
 * 翻訳ファイルのnamespace一覧
 */
export const I18N_NAMESPACES = ['common', 'auth'] as const
export type I18nNamespace = (typeof I18N_NAMESPACES)[number]

/**
 * デフォルトのnamespace
 */
export const DEFAULT_NAMESPACE: I18nNamespace = 'common'
