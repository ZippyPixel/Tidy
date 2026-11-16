<template>
  <DashboardCard :title="$t('sky.moon.title')">
    <div class="flex items-center gap-5">
      <svg
        viewBox="-52 -52 104 104"
        width="104"
        height="104"
        role="img"
        :aria-label="`${phaseName}, ${litText}`"
        class="block flex-none"
      >
        <MoonGlyph :r="46" :k="now.lit" :tilt="now.tilt" :min="0.02" />
        <circle r="46" fill="none" class="stroke-moon-arc-ahead" stroke-width="1" />
      </svg>
      <div class="flex min-w-0 flex-col gap-0.5">
        <span data-phase class="text-xl font-semibold leading-[26px]">{{ phaseName }}</span>
        <span data-phase-line class="text-sm leading-5 tabular-nums text-muted-foreground">{{
          phaseLine
        }}</span>
        <span class="text-xs leading-[17px] text-muted-foreground [text-wrap:pretty]">{{
          $t(moonUp ? 'sky.moon.tiltUp' : 'sky.moon.tiltDown')
        }}</span>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-2">
      <div
        v-for="tile in tiles"
        :key="tile.key"
        data-tile
        class="flex min-w-0 flex-col gap-1 rounded-lg bg-surface-raised px-3.5 py-3"
      >
        <span class="whitespace-nowrap text-xs font-medium leading-4 text-muted-foreground">{{
          tile.label
        }}</span>
        <span class="whitespace-nowrap text-lg font-medium leading-6 tabular-nums">{{
          tile.value
        }}</span>
        <span class="text-xs leading-4 tabular-nums text-muted-foreground [text-wrap:pretty]">{{
          tile.sub
        }}</span>
      </div>
    </div>
    <div class="grid grid-cols-4 gap-2 border-t pt-4">
      <button
        v-for="q in quarters"
        :key="q.t"
        type="button"
        data-quarter
        :aria-label="q.aria"
        class="flex min-w-0 flex-col items-center gap-1.5 rounded-lg px-0.5 py-2 outline-ring hover:bg-foreground/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        @click="$emit('commit', q.t)"
      >
        <svg viewBox="-13 -13 26 26" width="26" height="26" aria-hidden="true" class="block">
          <circle r="12" class="fill-moon-shadow" />
          <path :d="q.glyph" class="fill-moon-lit" />
          <circle r="12" fill="none" class="stroke-moon-arc-ahead" stroke-width="1" />
        </svg>
        <span class="text-center text-xs font-semibold leading-4">{{ q.name }}</span>
        <span class="whitespace-nowrap text-xs leading-4 tabular-nums text-muted-foreground">{{
          q.date
        }}</span>
      </button>
    </div>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import skyMixin from '@/mixins/skyMixin'
import { moonLitPath } from '@/utils/astro'
import { compassPoint, phaseKey } from '@/utils/sky'
import MoonGlyph from './MoonGlyph.vue'

const SYNODIC_DAYS = 29.53
const MEAN_KM = 384400
const QUARTERS = ['newMoon', 'firstQuarter', 'fullMoon', 'lastQuarter']

export default {
  name: 'MoonCard',
  components: { DashboardCard, MoonGlyph },
  mixins: [skyMixin],
  props: {
    t: { type: Number, required: true },
    tz: { type: String, required: true },
    /** createSky(), for the moon's direction at rise and set */
    sky: { type: Object, required: true },
    day: { type: Object, required: true },
    ahead: { type: Object, required: true },
    now: { type: Object, required: true }
  },
  emits: ['commit'],
  computed: {
    moonUp() {
      return this.now.moon.alt > 0
    },
    phaseName() {
      return this.$t(`sky.phases.${phaseKey(this.now.phase)}`)
    },
    litText() {
      return this.$t('sky.moon.lit', { n: this.skyNumber(Math.round(this.now.lit * 100)) })
    },
    phaseLine() {
      return this.$t('sky.moon.phaseLine', {
        lit: this.litText,
        age: this.skyNumber((this.now.phase / 360) * SYNODIC_DAYS, 1)
      })
    },
    tiles() {
      const { rise, set, high } = this.day.moon
      const dir = (t) =>
        this.$t('sky.moon.inThe', {
          point: this.skyPoint(compassPoint(this.sky.hor('Moon', t).az))
        })
      const size = Math.round((MEAN_KM / this.now.moonKm - 1) * 100)
      return [
        {
          key: 'rise',
          label: this.$t('sky.moon.rise'),
          value: this.skyClock(rise, this.tz),
          sub: rise == null ? this.$t('sky.moon.noRise') : dir(rise)
        },
        {
          key: 'set',
          label: this.$t('sky.moon.set'),
          value: this.skyClock(set, this.tz),
          sub: set == null ? this.$t('sky.moon.noSet') : dir(set)
        },
        {
          key: 'high',
          label: this.$t('sky.moon.highest'),
          value: high ? this.skyClock(high.t, this.tz) : '—',
          sub: high
            ? this.$t('sky.chart.above', { n: this.skyNumber(Math.round(high.alt)) })
            : this.$t('sky.moon.notThisDay')
        },
        {
          key: 'distance',
          label: this.$t('sky.moon.distance'),
          value: this.skyDistance(this.now.moonKm),
          sub:
            size === 0
              ? this.$t('sky.moon.average')
              : this.$t(size > 0 ? 'sky.moon.bigger' : 'sky.moon.smaller', {
                  n: this.skyNumber(Math.abs(size))
                })
        }
      ]
    },
    quarters() {
      const k = [0.02, 0.5, 1, 0.5]
      return this.ahead.quarters.map((q) => {
        const name = this.$t(`sky.phases.${QUARTERS[q.quarter]}`)
        return {
          t: q.t,
          name,
          date: this.skyDate(q.t, this.tz, { month: 'short', day: 'numeric' }),
          glyph: moonLitPath(12, k[q.quarter], q.quarter <= 2),
          aria: this.$t('sky.moon.quarterAria', {
            name,
            date: this.skyDate(q.t, this.tz, { weekday: 'long', month: 'long', day: 'numeric' })
          })
        }
      })
    }
  }
}
</script>
