import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import bn from './locales/bn.json'

export const SUPPORTED_LOCALES = ['en', 'bn']
export const LOCALE_STORAGE_KEY = 'tidy-locale'

// BCP 47 tags used for Intl date/number formatting ('bn-BD' uses Bengali digits)
const INTL_TAGS = { en: 'en-US', bn: 'bn-BD' }

function initialLocale() {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (SUPPORTED_LOCALES.includes(saved)) return saved
  } catch {
    /* localStorage unavailable (SSR/tests) */
  }
  return 'en'
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: initialLocale(),
  fallbackLocale: 'en',
  messages: { en, bn }
})

export function currentLocale() {
  return i18n.global.locale.value
}

export function currentIntlTag() {
  return INTL_TAGS[currentLocale()] || INTL_TAGS.en
}

export default i18n
