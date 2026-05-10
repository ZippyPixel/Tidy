import { defineStore } from 'pinia'

const STORAGE_KEY = 'tidy-theme'

const useThemeStore = defineStore('theme', {
  state: () => ({
    isDark: false
  }),

  actions: {
    initTheme() {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) {
        this.isDark = saved === 'dark'
      } else {
        this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      this._applyTheme()
    },

    toggleTheme() {
      this.isDark = !this.isDark
      localStorage.setItem(STORAGE_KEY, this.isDark ? 'dark' : 'light')
      this._applyTheme()
    },

    _applyTheme() {
      const root = document.documentElement
      if (this.isDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }
})

export default useThemeStore
