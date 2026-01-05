import { DEFAULT_NAMESPACE, FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES } from '@repo/shared/config/i18n'
import * as Localization from 'expo-localization'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Import translation resources
// Note: React Native uses require() for JSON
const resources = {
  ja: {
    common: require('./locales/ja/common.json'),
    auth: require('./locales/ja/auth.json'),
  },
}

// Get device language, default to fallback if undefined
const deviceLang = Localization.locale?.split('-')[0] ?? FALLBACK_LANGUAGE

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLang,
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: [...SUPPORTED_LANGUAGES],
  defaultNS: DEFAULT_NAMESPACE,
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
