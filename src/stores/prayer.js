import { defineStore } from 'pinia'
import { METHODS } from '@/utils/sky'
import { formatPrayerCookie, PRAYER_COOKIE_KEY, writePreferenceCookie } from '@/utils/preferences'

// The prayer-time method (index into utils/sky METHODS; Karachi by default) and the Asr
// shadow rule (Hanafi by default), remembered in a cookie like the theme and language.
export default defineStore('prayer', {
  state: () => ({ method: 0, hanafi: true }),
  actions: {
    // called once by plugins/preferences.js
    setInitial({ method, hanafi }) {
      this.method = method
      this.hanafi = hanafi
    },
    cycleMethod() {
      this.method = (this.method + 1) % METHODS.length
      this.save()
    },
    setHanafi(hanafi) {
      if (hanafi === this.hanafi) return
      this.hanafi = hanafi
      this.save()
    },
    save() {
      writePreferenceCookie(
        PRAYER_COOKIE_KEY,
        formatPrayerCookie(METHODS[this.method].key, this.hanafi)
      )
    }
  }
})
