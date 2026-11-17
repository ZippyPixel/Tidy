import { defineStore } from 'pinia'
import {
  formatWearCookie,
  WEAR_COOKIE_KEY,
  WEAR_DEFAULTS,
  writePreferenceCookie
} from '@/utils/preferences'

// What to wear settings (figure, "I usually feel", more coverage, dresses and skirts, style and the
// pieces switched off in "Your wardrobe"), shared by the dashboard card and /wear and remembered in
// a cookie like the theme. The outfit itself is derived from the weather store's forecast
// (mixins/wearMixin), never fetched.
export default defineStore('wear', {
  state: () => ({ ...WEAR_DEFAULTS, exclude: [] }),
  getters: {
    prefs: (state) => ({
      figure: state.figure,
      feel: state.feel,
      coverage: state.coverage,
      skirts: state.skirts,
      style: state.style,
      exclude: state.exclude
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
      this.save()
    },
    // switch one piece of the wardrobe on or off
    toggle(id) {
      const off = new Set(this.exclude)
      if (off.has(id)) off.delete(id)
      else off.add(id)
      this.exclude = [...off].sort()
      this.save()
    },
    allOn() {
      if (!this.exclude.length) return
      this.exclude = []
      this.save()
    },
    save() {
      writePreferenceCookie(WEAR_COOKIE_KEY, formatWearCookie(this.prefs))
    }
  }
})
