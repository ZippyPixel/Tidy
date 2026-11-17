import { defineStore } from 'pinia'
import {
  formatWearCookie,
  WEAR_COOKIE_KEY,
  WEAR_DEFAULTS,
  writePreferenceCookie
} from '@/utils/preferences'

// What to wear settings (figure, "I usually feel", more coverage, dresses and skirts), shared by
// the dashboard card and /wear and remembered in a cookie like the theme. The outfit itself is
// derived from the weather store's forecast (mixins/wearMixin), never fetched.
export default defineStore('wear', {
  state: () => ({ ...WEAR_DEFAULTS }),
  getters: {
    prefs: (state) => ({
      figure: state.figure,
      feel: state.feel,
      coverage: state.coverage,
      skirts: state.skirts
    })
  },
  actions: {
    // called once by plugins/preferences.js
    setInitial(prefs) {
      Object.assign(this, prefs)
    },
    set(key, value) {
      if (!(key in WEAR_DEFAULTS) || this[key] === value) return
      this[key] = value
      writePreferenceCookie(WEAR_COOKIE_KEY, formatWearCookie(this.prefs))
    }
  }
})
