import { mapState } from 'pinia'
import { DATE_FORMATS } from '@/constants/weather'
import { currentIntlTag } from '@/i18n'
import useUnitStore from '@/stores/unit'
import { durationParts, roundToMinute } from '@/utils/sky'

const KM_PER_MILE = 1.609344

// Times in the chosen place's zone, rounded to the minute like the rest of the app, and
// distances in km or miles from the unit setting. Every Sun & Moon component uses it.
export default {
  computed: {
    ...mapState(useUnitStore, ['unit']),
    skyMiles() {
      return this.unit === 'fahrenheit'
    }
  },
  methods: {
    /** "3:48 PM", or "—" when there is no such time (the sun never rises, …) */
    skyClock(t, tz) {
      if (t == null) return '—'
      return new Intl.DateTimeFormat(currentIntlTag(), {
        ...DATE_FORMATS.CLOCK,
        timeZone: tz
      }).format(roundToMinute(t))
    },
    skyDate(t, tz, options) {
      return new Intl.DateTimeFormat(currentIntlTag(), { ...options, timeZone: tz }).format(t)
    },
    skyNumber(value, digits = 0) {
      return new Intl.NumberFormat(currentIntlTag(), {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      }).format(value)
    },
    /** "10h 59m" / "42m" */
    skyDuration(ms) {
      const { h, m } = durationParts(ms)
      if (!h) return this.$t('sky.minutes', { m: this.skyNumber(m) })
      return this.$t('sky.hoursMinutes', {
        h: this.skyNumber(h),
        m: new Intl.NumberFormat(currentIntlTag(), { minimumIntegerDigits: 2 }).format(m)
      })
    },
    /** "384,400 km" / "238,855 mi" */
    skyDistance(km) {
      const value = this.skyMiles ? km / KM_PER_MILE : km
      return this.$t(this.skyMiles ? 'sky.mi' : 'sky.km', { n: this.skyNumber(Math.round(value)) })
    },
    skyDegrees(value, digits = 0) {
      return this.$t('sky.degrees', { n: this.skyNumber(value, digits) })
    },
    /** "rises 6:13 AM (in 2h 25m)", "up all day", "stays below the horizon" */
    skyNextText(event, up, t, tz) {
      if (!event) return this.$t(up ? 'sky.upAllDay' : 'sky.downAllDay')
      return this.$t(event[0] === 'rise' ? 'sky.risesIn' : 'sky.setsIn', {
        time: this.skyClock(event[1], tz),
        in: this.skyDuration(event[1] - t)
      })
    },
    /** a compass point's name, translated ("WSW") */
    skyPoint(key) {
      return this.$t(`sky.points.${key}`)
    }
  }
}
