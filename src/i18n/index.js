import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import bn from './locales/bn.json'

export const SUPPORTED_LOCALES = ['en', 'bn']
export const LOCALE_COOKIE_KEY = 'tidy-locale'

// BCP 47 tags used for Intl date/number formatting ('bn-BD' uses Bengali digits)
const INTL_TAGS = { en: 'en-US', bn: 'bn-BD' }

export function resolveLocale(value) {
  return SUPPORTED_LOCALES.includes(value) ? value : 'en'
}

export function createI18nInstance(locale = 'en') {
  return createI18n({
    legacy: false,
    globalInjection: true,
    locale: resolveLocale(locale),
    fallbackLocale: 'en',
    messages: { en, bn }
  })
}

// The instance the non-component callers (the weather store, weatherMixin,
// utils/astro consumers) read the active locale from. plugins/preferences.js
// installs a fresh one per request so SSR renders the locale from the cookie.
let active = createI18nInstance()

export function setActiveI18n(instance) {
  active = instance
}

export function activeI18n() {
  return active
}

export function currentLocale() {
  return active.global.locale.value
}

export function intlTagFor(locale) {
  return INTL_TAGS[resolveLocale(locale)]
}

export function currentIntlTag() {
  return intlTagFor(currentLocale())
}
