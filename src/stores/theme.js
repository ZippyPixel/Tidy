import { defineStore } from 'pinia'
import { THEME_COOKIE_KEY, writePreferenceCookie } from '@/utils/preferences'

// How long <html class="theme-transition"> stays on after a toggle. Must cover
// --theme-transition-duration in assets/style.css, which is what actually animates.
export const THEME_TRANSITION_MS = 300
export const THEME_TRANSITION_CLASS = 'theme-transition'

let transitionTimer = null

// Turn the cross-fade on for one switch only. Leaving transitions off the rest of
// the time keeps hovers instant and chart repaints from dragging.
function startThemeTransition() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  clearTimeout(transitionTimer)
  root.classList.add(THEME_TRANSITION_CLASS)
  transitionTimer = setTimeout(() => {
    root.classList.remove(THEME_TRANSITION_CLASS)
    transitionTimer = null
  }, THEME_TRANSITION_MS)
}

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
      startThemeTransition()
      this.isDark = !this.isDark
      writePreferenceCookie(THEME_COOKIE_KEY, this.isDark ? 'dark' : 'light')
    }
  }
})

export default useThemeStore
