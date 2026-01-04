import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import {
  DEFAULT_NAMESPACE,
  FALLBACK_LANGUAGE,
  LANGUAGE_NAMES,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '@/shared/config/i18n'
// 言語リソースのimport
// 新しい言語を追加する場合は、ここにimport文を追加してください
import jaAuth from '../locales/ja/auth.json'
import jaCommon from '../locales/ja/common.json'
// import enAuth from '../locales/en/auth.json'
// import enCommon from '../locales/en/common.json'
// import zhAuth from '../locales/zh/auth.json'
// import zhCommon from '../locales/zh/common.json'

// Re-export for external use
export { SUPPORTED_LANGUAGES as supportedLanguages, LANGUAGE_NAMES as languageNames }
export type { SupportedLanguage }
export const defaultNS = DEFAULT_NAMESPACE

/**
 * 言語リソースの定義
 * 新しい言語を追加する場合は、ここにリソースを追加してください
 */
export const resources = {
  ja: {
    common: jaCommon,
    auth: jaAuth,
  },
  // en: {
  //   common: enCommon,
  //   auth: enAuth,
  // },
  // zh: {
  //   common: zhCommon,
  //   auth: zhAuth,
  // },
} as const satisfies Record<SupportedLanguage, Record<string, unknown>>

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: FALLBACK_LANGUAGE,
    defaultNS,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })
