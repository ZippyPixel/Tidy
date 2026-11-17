<template>
  <DashboardCard :title="$t('sky.look.title')">
    <!-- design/TidySky compass: north up, the rim is the horizon, the centre is overhead;
         below the horizon a body sits just outside the rim, hollow -->
    <svg
      viewBox="0 0 240 240"
      role="img"
      :aria-label="aria"
      class="mx-auto block w-full max-w-[280px]"
    >
      <circle
        cx="120"
        cy="120"
        :r="R"
        class="fill-surface-raised stroke-horizon"
        stroke-width="1.5"
      />
      <circle cx="120" cy="120" r="61.3" fill="none" class="stroke-chart-grid" stroke-width="1" />
      <circle cx="120" cy="120" r="30.7" fill="none" class="stroke-chart-grid" stroke-width="1" />
      <line x1="120" y1="28" x2="120" y2="212" class="stroke-chart-grid" stroke-width="1" />
      <line x1="28" y1="120" x2="212" y2="120" class="stroke-chart-grid" stroke-width="1" />
      <text x="120" y="17" text-anchor="middle" class="fill-foreground text-[13px] font-semibold">
        {{ $t('sky.look.n') }}
      </text>
      <text
        x="229"
        y="124.5"
        text-anchor="middle"
        class="fill-muted-foreground text-xs font-medium"
      >
        {{ $t('sky.look.e') }}
      </text>
      <text x="120" y="233" text-anchor="middle" class="fill-muted-foreground text-xs font-medium">
        {{ $t('sky.look.s') }}
      </text>
      <text x="11" y="124.5" text-anchor="middle" class="fill-muted-foreground text-xs font-medium">
        {{ $t('sky.look.w') }}
      </text>
      <text x="124" y="87" class="fill-muted-foreground text-[9px]">{{ skyDegrees(60) }}</text>
      <text x="124" y="56" class="fill-muted-foreground text-[9px]">{{ skyDegrees(30) }}</text>
      <path
        :d="track(2, 3)"
        fill="none"
        class="stroke-moon-arc-ahead"
        stroke-width="1.5"
        stroke-dasharray="2 3"
        stroke-linecap="round"
      />
      <path
        :d="track(0, 1)"
        fill="none"
        class="stroke-sun-arc-ahead"
        stroke-width="1.5"
        stroke-dasharray="2 3"
        stroke-linecap="round"
      />
      <g
        data-moon
        :transform="`translate(${moonAt[0].toFixed(1)},${moonAt[1].toFixed(1)})`"
        :opacity="moonUp ? 1 : 0.45"
      >
        <circle r="10" class="fill-card" />
        <MoonGlyph :r="8" :k="now.lit" :tilt="now.tilt" />
        <circle r="8" fill="none" class="stroke-moon-arc" stroke-width="1" />
      </g>
      <circle
        data-sun
        :cx="sunAt[0].toFixed(1)"
        :cy="sunAt[1].toFixed(1)"
        r="9"
        :class="sunUp ? 'fill-sun stroke-card' : 'fill-card stroke-sun-arc'"
        :stroke-width="sunUp ? 2.5 : 2"
        :stroke-dasharray="sunUp ? undefined : '3 2'"
      />
    </svg>
    <div class="flex flex-col gap-2">
      <div
        v-for="r in looks"
        :key="r.key"
        data-look
        class="grid grid-cols-[52px_minmax(0,1fr)] gap-3 text-sm leading-5"
      >
        <span class="font-semibold">{{ r.label }}</span>
        <span class="tabular-nums text-muted-foreground [text-wrap:pretty]">{{ r.text }}</span>
      </div>
    </div>
    <p class="text-xs leading-[17px] text-muted-foreground [text-wrap:pretty]">
      {{ $t('sky.look.note') }}
    </p>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import skyMixin from '@/mixins/skyMixin'
import { COMPASS_R as R, compassPoint, compassXY, nextEvent } from '@/utils/sky'
import MoonGlyph from './MoonGlyph.vue'

export default {
  name: 'WhereToLook',
  components: { DashboardCard, MoonGlyph },
  mixins: [skyMixin],
  props: {
    t: { type: Number, required: true },
    tz: { type: String, required: true },
    day: { type: Object, required: true },
    nextDay: { type: Object, required: true },
    now: { type: Object, required: true }
  },
  data() {
    return { R }
  },
  computed: {
    sunUp() {
      return this.now.sun.alt > -0.833
    },
    moonUp() {
      return this.now.moon.alt > 0
    },
    sunAt() {
      return compassXY(this.now.sun.alt, this.now.sun.az)
    },
    moonAt() {
      return compassXY(this.now.moon.alt, this.now.moon.az)
    },
    looks() {
      const { sun, moon } = this.day
      const next = this.nextDay
      const sunNext = nextEvent(
        [
          ['rise', sun.rise],
          ['set', sun.set],
          ['rise', next.sun.rise],
          ['set', next.sun.set]
        ],
        this.t
      )
      const moonNext = nextEvent(
        [
          ['rise', moon.rise],
          ['set', moon.set],
          ['rise', next.moon.rise],
          ['set', next.moon.set]
        ],
        this.t
      )
      return [
        {
          key: 'sun',
          label: this.$t('sky.sun.title'),
          text: this.lookText(this.now.sun, this.sunUp, sunNext)
        },
        {
          key: 'moon',
          label: this.$t('sky.moon.title'),
          text: this.lookText(this.now.moon, this.moonUp, moonNext)
        }
      ]
    },
    aria() {
      return this.$t('sky.look.aria', { sun: this.looks[0].text, moon: this.looks[1].text })
    }
  },
  methods: {
    lookText(o, up, next) {
      const point = this.skyPoint(compassPoint(o.az))
      if (up)
        return this.$t('sky.look.up', {
          n: this.skyNumber(Math.round(o.alt)),
          point,
          az: this.skyDegrees(Math.round(o.az))
        })
      if (!next) return this.$t('sky.look.down', { point })
      return this.$t(next[0] === 'rise' ? 'sky.look.downRises' : 'sky.look.downSets', {
        point,
        time: this.skyClock(next[1], this.tz)
      })
    },
    // the day's path above the horizon, dotted
    track(ia, iz) {
      let d = ''
      let pen = false
      for (const q of this.day.pts) {
        if (q[ia] > 0) {
          const [x, y] = compassXY(q[ia], q[iz])
          d += `${pen ? ' L' : ' M'}${x.toFixed(1)},${y.toFixed(1)}`
          pen = true
        } else pen = false
      }
      return d.trim() || 'M0,0'
    }
  }
}
</script>
