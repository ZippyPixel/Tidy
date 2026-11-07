import { mapState } from 'pinia'
import { DATE_FORMATS } from '@/constants/weather'
import { currentIntlTag } from '@/i18n'
import useUnitStore from '@/stores/unit'
import { durationParts, heroDigits, metresToUnit, unitKey } from '@/utils/tides'

// Times in the station's zone and heights in the chosen unit, for every tides component.
export default {
  computed: {
    ...mapState(useUnitStore, ['unit']),
    tideUnit() {
      return this.$t(`tides.${unitKey(this.unit)}`)
    }
  },
  methods: {
    // to the minute, the way a tide table prints it: 6:39:40 reads 6:40
    tideClock(epoch, timeZone) {
      return new Intl.DateTimeFormat(currentIntlTag(), { ...DATE_FORMATS.CLOCK, timeZone }).format(
        Math.round(epoch / 60) * 60 * 1000
      )
    },
    tideDecimal(value, digits) {
      return new Intl.NumberFormat(currentIntlTag(), {
        useGrouping: false,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      }).format(value)
    },
    // distances and counts: "8,649"
    tideGrouped(value) {
      return new Intl.NumberFormat(currentIntlTag()).format(value)
    },
    // hero values: 2 decimals in metres, 1 in feet
    tideHeight(metres) {
      return this.tideDecimal(metresToUnit(metres, this.unit), heroDigits(this.unit))
    },
    // lists: 1 decimal in both
    tideShort(metres) {
      return this.tideDecimal(metresToUnit(metres, this.unit), 1)
    },
    tideDuration(seconds) {
      const { hours, minutes } = durationParts(seconds)
      if (!hours) return this.$t('tides.minutesOnly', { minutes: this.tideDecimal(minutes, 0) })
      return this.$t('tides.hoursMinutes', {
        hours: this.tideDecimal(hours, 0),
        minutes: new Intl.NumberFormat(currentIntlTag(), { minimumIntegerDigits: 2 }).format(minutes)
      })
    },
    // a 'YYYY-MM-DD' from the data, formatted as written: it is already the station's date
    tideDate(date, options) {
      const [y, m, d] = date.split('-').map(Number)
      return new Intl.DateTimeFormat(currentIntlTag(), { ...options, timeZone: 'UTC' }).format(Date.UTC(y, m - 1, d, 12))
    }
  }
}
