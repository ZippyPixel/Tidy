import { defineStore } from 'pinia'
import i18n, { SUPPORTED_LOCALES, LOCALE_STORAGE_KEY } from '@/i18n'
import useWeatherStore from '@/stores/weather'

const useLocaleStore = defineStore('locale', {
  state: () => ({
    // i18n already resolved the persisted locale at startup
    locale: i18n.global.locale.value
  }),

  actions: {
    initLocale() {
      this._applyLocale(this.locale)
    },

    setLocale(locale) {
      if (!SUPPORTED_LOCALES.includes(locale) || locale === this.locale) return
      this.locale = locale
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
      this._applyLocale(locale)
      // re-fetch so API-provided texts (condition) arrive in the new language
      useWeatherStore()
        .refetchWeather()
        .catch((error) => console.error('Weather refetch after locale change failed:', error))
    },

    toggleLocale() {
      this.setLocale(this.locale === 'en' ? 'bn' : 'en')
    },

    _applyLocale(locale) {
      i18n.global.locale.value = locale
      document.documentElement.lang = locale
    }
  }
})

export default useLocaleStore
