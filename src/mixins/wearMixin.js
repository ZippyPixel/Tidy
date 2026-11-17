import { mapState } from 'pinia'
import useWeatherStore from '@/stores/weather'
import useUnitStore from '@/stores/unit'
import useWearStore from '@/stores/wear'
import weatherMixin from '@/mixins/weatherMixin'
import { locationClock } from '@/utils/astro'
import { recommend, wearText, windows } from '@/utils/wear'

const { formatHour, formatNumber, formatTemp } = weatherMixin.methods

// Shared by the What to wear card and /wear: the windows of the forecast the weather store
// already has (no new request), the settings, and formatters in the chosen unit and language.
// `nowMs` ticks every minute so "Rest of today" moves on with the clock.
export default {
  data() {
    return { nowMs: Date.now(), wearTimer: null }
  },
  computed: {
    ...mapState(useWeatherStore, ['forecast', 'zoneOffsetMs']),
    ...mapState(useUnitStore, ['unit']),
    ...mapState(useWearStore, { wearPrefs: 'prefs' }),
    wearWindows() {
      return windows(this.forecast, Math.floor(this.nowMs / 1000))
    },
    // the location's hour (fractional), for the scene's light
    wearNowHour() {
      return locationClock(this.zoneOffsetMs, this.nowMs).minutes / 60
    },
    wearFmt() {
      const f = this.unit === 'fahrenheit'
      const speedUnit = this.$t(f ? 'hourly.mph' : 'hourly.kmh')
      return {
        temp: (c) => formatTemp(f ? (c * 9) / 5 + 32 : c),
        delta: (c) => formatTemp(f ? (c * 9) / 5 : c),
        hour: (h) => formatHour(h),
        speed: (k) => `${formatNumber(Math.round(f ? k / 1.609 : k))} ${speedUnit}`,
        num: (n) => formatNumber(Math.round(n))
      }
    }
  },
  methods: {
    wearRecommend(win) {
      return recommend(win.summary, this.wearPrefs, this.wearFmt)
    },
    wearT(msg) {
      return wearText(this.$t, msg)
    },
    wearSpan(summary) {
      return this.$t('wear.span', {
        from: this.wearFmt.hour(summary.fromH),
        to: this.wearFmt.hour(summary.toH)
      })
    }
  },
  mounted() {
    this.wearTimer = setInterval(() => (this.nowMs = Date.now()), 60000)
  },
  beforeUnmount() {
    clearInterval(this.wearTimer)
  }
}
