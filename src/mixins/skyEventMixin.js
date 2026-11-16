import { daysBetween } from '@/utils/sky'

const KINDS = ['penumbral', 'partial', 'total', 'annular']

// Wording for a "Coming up" event (utils/sky events()), shared by the list and its detail.
// The component provides `tz`, `now` (the real clock), `placeName` and, for seasons, `lat`.
export default {
  methods: {
    eclipseKind(kind) {
      return KINDS.includes(kind) ? this.$t(`sky.ahead.kinds.${kind}`) : ''
    },
    /** { label, sub } for the list row and the detail's heading */
    describe(event) {
      const place = this.placeName
      switch (event.kind) {
        case 'lunar':
          return {
            label: this.$t('sky.ahead.lunar', { kind: this.eclipseKind(event.eclipse) }).trim(),
            sub: event.up
              ? this.$t('sky.ahead.visibleAt', { place, time: this.skyClock(event.t, this.tz) })
              : this.$t('sky.ahead.lunarHidden', { place })
          }
        case 'solar': {
          const cover = event.cover
            ? this.$t('sky.ahead.covered', { n: this.skyNumber(Math.round(event.cover * 100)) })
            : ''
          return {
            label: this.$t('sky.ahead.solar', { kind: this.eclipseKind(event.eclipse) }).trim(),
            sub:
              event.alt > 0
                ? this.$t('sky.ahead.visibleAt', { place, time: this.skyClock(event.t, this.tz) }) +
                  cover
                : this.$t('sky.ahead.solarHidden', { place })
          }
        }
        case 'season': {
          let sub = this.$t('sky.ahead.equal')
          if (event.key.endsWith('Solstice')) {
            sub = this.$t(
              (event.key === 'decemberSolstice') === this.lat >= 0
                ? 'sky.ahead.shortest'
                : 'sky.ahead.longest'
            )
          }
          return { label: this.$t(`sky.ahead.seasons.${event.key}`), sub }
        }
        case 'perigee':
        case 'apogee':
          return {
            label: this.$t(`sky.ahead.${event.kind}`),
            sub: this.$t('sky.ahead.away', { d: this.skyDistance(event.km) })
          }
        case 'shower': {
          const lit = Math.round(event.moon * 100)
          const sky = lit < 30 ? 'dark' : lit < 70 ? 'some' : 'bright'
          return {
            label: this.$t('sky.ahead.shower', { name: this.$t(`sky.ahead.showers.${event.key}`) }),
            sub: this.$t(`sky.ahead.showerMoon.${sky}`, {
              zhr: this.skyNumber(event.zhr),
              lit: this.skyNumber(lit)
            })
          }
        }
        default:
          return { label: '', sub: '' }
      }
    },
    /** "Thu, Nov 26, 2026": always with the year */
    eventDate(t) {
      return this.skyDate(t, this.tz, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    },
    /** counted from today's real date in the place's zone, not from the chosen day */
    eventIn(t) {
      const n = daysBetween(this.now, t, this.tz)
      if (n === 0) return this.$t('sky.ahead.today')
      if (n === 1) return this.$t('sky.ahead.tomorrow')
      if (n === -1) return this.$t('sky.ahead.yesterday')
      const count = this.skyNumber(Math.abs(n))
      return n > 0
        ? this.$t('sky.ahead.inDays', { n: count }, n)
        : this.$t('sky.ahead.daysAgo', { n: count }, -n)
    }
  }
}
