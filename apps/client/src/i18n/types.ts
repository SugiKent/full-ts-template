import type { FALLBACK_LANGUAGE } from '@shared/config/i18n'
import type { defaultNS, resources } from './index'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: (typeof resources)[typeof FALLBACK_LANGUAGE]
  }
}
