import { defineStore } from 'pinia'
import { activeI18n, resolveLocale, SUPPORTED_LOCALES, LOCALE_COOKIE_KEY } from '@/i18n'
import { writePreferenceCookie } from '@/utils/preferences'
import useWeatherStore from '@/stores/weather'

const useLocaleStore = defineStore('locale', {
  state: () => ({
    locale: 'en'
  }),

  actions: {
    // called once by plugins/preferences.js, before the app renders
    setInitialLocale(locale) {
      this.locale = resolveLocale(locale)
      activeI18n().global.locale.value = this.locale
    },

    setLocale(locale) {
      if (!SUPPORTED_LOCALES.includes(locale) || locale === this.locale) return
      this.locale = locale
      writePreferenceCookie(LOCALE_COOKIE_KEY, locale)
      // <html lang> follows this.locale via useHead in plugins/preferences.js
      activeI18n().global.locale.value = locale
      // re-fetch so API-provided texts (condition) arrive in the new language
      useWeatherStore()
        .refetchWeather()
        .catch((error) => console.error('Weather refetch after locale change failed:', error))
    },

    toggleLocale() {
      this.setLocale(this.locale === 'en' ? 'bn' : 'en')
    }
  }
})

export default useLocaleStore
