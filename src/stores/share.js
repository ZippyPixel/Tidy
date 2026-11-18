import { defineStore } from 'pinia'
import { ORIGINS } from '@/utils/share/shareContent'

// The share composer: open or not, and where it was opened from (which picks its moment:
// dashboard → Today, tides → Beach day, sky → Sky watch, wear → Outfit). `everOpened` lets
// the layout mount the lazy composer only once someone asks for it.
export default defineStore('share', {
  state: () => ({ open: false, origin: 'dashboard', everOpened: false }),
  actions: {
    openShare(origin = 'dashboard') {
      this.origin = origin in ORIGINS ? origin : 'dashboard'
      this.everOpened = true
      this.open = true
    },
    closeShare() {
      this.open = false
    }
  }
})
