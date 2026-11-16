<template>
  <DashboardCard :title="$t('sky.ahead.title')">
    <div class="-mx-3 flex flex-col">
      <button
        v-for="row in rows"
        :key="row.key"
        type="button"
        data-ahead
        class="grid min-h-[60px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg px-3 py-2 text-left outline-ring hover:bg-foreground/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
        @click="$emit('commit', row.t)"
      >
        <span class="flex min-w-0 flex-col gap-0.5">
          <span class="text-[15px] font-semibold leading-5">{{ row.label }}</span>
          <span class="text-[13px] leading-[18px] text-muted-foreground [text-wrap:pretty]">{{
            row.sub
          }}</span>
        </span>
        <span
          class="flex flex-col items-end gap-0.5 whitespace-nowrap text-[13px] leading-[18px] tabular-nums"
        >
          <span class="font-semibold">{{ row.date }}</span>
          <span class="text-muted-foreground">{{ row.in }}</span>
        </span>
      </button>
    </div>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import skyMixin from '@/mixins/skyMixin'
import { daysBetween } from '@/utils/sky'

const KINDS = ['penumbral', 'partial', 'total', 'annular']

export default {
  name: 'ComingUp',
  components: { DashboardCard },
  mixins: [skyMixin],
  props: {
    t: { type: Number, required: true },
    tz: { type: String, required: true },
    /** where we are, for "visible from …" */
    placeName: { type: String, required: true },
    lat: { type: Number, required: true },
    /** start of the chosen local day, sky.ahead(ds) and sky.showers(ds) */
    ds: { type: Number, required: true },
    ahead: { type: Object, required: true },
    showers: { type: Array, required: true }
  },
  emits: ['commit'],
  computed: {
    rows() {
      const a = this.ahead
      const place = this.placeName
      const kind = (k, fallback) => (KINDS.includes(k) ? this.$t(`sky.ahead.kinds.${k}`) : fallback)
      const rows = []
      if (a.lunar) {
        rows.push({
          key: 'lunar',
          t: a.lunar.t,
          label: this.$t('sky.ahead.lunar', { kind: kind(a.lunar.kind, '') }).trim(),
          sub: a.lunar.up
            ? this.$t('sky.ahead.visibleAt', { place, time: this.skyClock(a.lunar.t, this.tz) })
            : this.$t('sky.ahead.lunarHidden', { place })
        })
      }
      if (a.solar) {
        const cover = a.solar.cover
          ? this.$t('sky.ahead.covered', { n: this.skyNumber(Math.round(a.solar.cover * 100)) })
          : ''
        rows.push({
          key: 'solar',
          t: a.solar.t,
          label: this.$t('sky.ahead.solar', { kind: kind(a.solar.kind, '') }).trim(),
          sub:
            a.solar.alt > 0
              ? this.$t('sky.ahead.visibleAt', { place, time: this.skyClock(a.solar.t, this.tz) }) +
                cover
              : this.$t('sky.ahead.solarHidden', { place })
        })
      }
      if (a.season) {
        const { key } = a.season
        const north = this.lat >= 0
        let sub = this.$t('sky.ahead.equal')
        if (key.endsWith('Solstice'))
          sub = this.$t(
            (key === 'decemberSolstice') === north ? 'sky.ahead.shortest' : 'sky.ahead.longest'
          )
        rows.push({ key: 'season', t: a.season.t, label: this.$t(`sky.ahead.seasons.${key}`), sub })
      }
      if (a.perigee) {
        rows.push({
          key: 'perigee',
          t: a.perigee.t,
          label: this.$t('sky.ahead.perigee'),
          sub: this.$t('sky.ahead.away', { d: this.skyDistance(a.perigee.km) })
        })
      }
      if (a.apogee) {
        rows.push({
          key: 'apogee',
          t: a.apogee.t,
          label: this.$t('sky.ahead.apogee'),
          sub: this.$t('sky.ahead.away', { d: this.skyDistance(a.apogee.km) })
        })
      }
      // meteor showers: fixed yearly peaks (give or take a day), with the moon's brightness that night
      for (const s of this.showers) {
        const lit = Math.round(s.moon * 100)
        const sky = lit < 30 ? 'dark' : lit < 70 ? 'some' : 'bright'
        rows.push({
          key: `shower-${s.key}-${s.t}`,
          t: s.t,
          label: this.$t('sky.ahead.shower', { name: this.$t(`sky.ahead.showers.${s.key}`) }),
          sub: this.$t(`sky.ahead.showerMoon.${sky}`, {
            zhr: this.skyNumber(s.zhr),
            lit: this.skyNumber(lit)
          })
        })
      }
      return rows
        .sort((x, y) => x.t - y.t)
        .map((row) => ({ ...row, date: this.dateText(row.t), in: this.inText(row.t) }))
    }
  },
  methods: {
    dateText(t) {
      const far = daysBetween(this.ds, t, this.tz) > 300
      return this.skyDate(t, this.tz, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        ...(far ? { year: 'numeric' } : {})
      })
    },
    inText(t) {
      const n = daysBetween(this.ds, t, this.tz)
      if (n === 0) return this.$t('sky.ahead.thisDay')
      if (n === 1) return this.$t('sky.ahead.nextDay')
      return this.$t('sky.ahead.inDays', { n: this.skyNumber(n) }, n)
    }
  }
}
</script>
