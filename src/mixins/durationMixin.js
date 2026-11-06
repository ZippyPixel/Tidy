import { currentIntlTag } from '@/i18n'
import { splitDuration } from '@/utils/astro'

// "2h 14m" / "12h 03m" / "21m", in the active locale's digits
export default {
  methods: {
    duration(totalMinutes) {
      const { hours, minutes } = splitDuration(totalMinutes)
      const tag = currentIntlTag()
      const h = new Intl.NumberFormat(tag, { useGrouping: false }).format(hours)
      if (!hours) return this.$t('astro.durationMinutes', { m: new Intl.NumberFormat(tag).format(minutes) })
      const m = new Intl.NumberFormat(tag, { minimumIntegerDigits: 2 }).format(minutes)
      return this.$t('astro.duration', { h, m })
    }
  }
}
