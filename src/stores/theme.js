import { defineStore } from 'pinia'
import { THEME_COOKIE_KEY, writePreferenceCookie } from '@/utils/preferences'

const useThemeStore = defineStore('theme', {
  state: () => ({
    isDark: false
  }),

  actions: {
    // called once by plugins/preferences.js, before the app renders
    setInitialTheme(isDark) {
      this.isDark = isDark
    },

    toggleTheme() {
      this.isDark = !this.isDark
      writePreferenceCookie(THEME_COOKIE_KEY, this.isDark ? 'dark' : 'light')
    }
  }
})

export default useThemeStore
