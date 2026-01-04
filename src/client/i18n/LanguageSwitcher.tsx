/**
 * Language Switcher Component
 * Provides a dropdown menu for switching between supported languages
 */
import { useTranslation } from 'react-i18next'
import { languageNames, type SupportedLanguage, supportedLanguages } from './index'

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation('common')

  const handleLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = event.target.value as SupportedLanguage
    await i18n.changeLanguage(newLang)
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        className="h-4 w-4 text-gray-500"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
        />
      </svg>
      <select
        value={i18n.language}
        onChange={handleLanguageChange}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        aria-label={t('selectLanguage')}
      >
        {supportedLanguages.map((lang) => (
          <option key={lang} value={lang}>
            {languageNames[lang]}
          </option>
        ))}
      </select>
    </div>
  )
}
