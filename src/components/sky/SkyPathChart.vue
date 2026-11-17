<template>
  <DashboardCard :title="$t('sky.chart.title')">
    <template #actions>
      <div
        class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-4 text-muted-foreground"
      >
        <span class="flex items-center gap-1.5"
          ><span class="h-[3px] w-3.5 rounded-sm bg-sun-arc" />{{ $t('sky.sun.title') }}</span
        >
        <span class="flex items-center gap-1.5"
          ><span class="h-[3px] w-3.5 rounded-sm bg-moon-arc" />{{ $t('sky.moon.title') }}</span
        >
        <span class="flex items-center gap-1.5">
          <span
            class="h-[9px] w-3.5 rounded-sm bg-chart-night shadow-[inset_0_0_0_1px_hsl(var(--border))]"
          />{{ $t('sky.chart.night') }}
        </span>
      </div>
    </template>

    <!-- design/TidySky sky path: height −45° … 90° across the local day, every 10 minutes.
         Strokes scale with the box; markers and labels are HTML placed in % -->
    <div data-plot class="relative ml-9 h-[190px] md:h-[250px]">
      <span
        v-for="a in [60, 30, 0, -30]"
        :key="a"
        aria-hidden="true"
        class="absolute right-[calc(100%+8px)] whitespace-nowrap text-xs leading-4 tabular-nums text-muted-foreground"
        :style="{ top: `calc(${yPct(a)}% - 8px)` }"
        >{{ skyDegrees(a) }}</span
      >
      <svg
        :viewBox="`0 0 1000 ${SPAN}`"
        preserveAspectRatio="none"
        role="img"
        :aria-label="aria"
        class="absolute inset-0 block size-full overflow-hidden rounded-lg"
      >
        <rect
          v-for="(n, i) in nights"
          :key="i"
          :x="n.x"
          y="0"
          :width="n.w"
          :height="SPAN"
          class="fill-chart-night"
        />
        <rect x="0" :y="y(0)" width="1000" :height="SPAN - y(0)" class="fill-foreground/5" />
        <line
          v-for="a in [60, 30, -30]"
          :key="a"
          x1="0"
          :y1="y(a)"
          x2="1000"
          :y2="y(a)"
          class="stroke-chart-grid"
          stroke-width="1"
          vector-effect="non-scaling-stroke"
        />
        <line
          x1="0"
          :y1="y(0)"
          x2="1000"
          :y2="y(0)"
          class="stroke-horizon"
          stroke-width="1.5"
          vector-effect="non-scaling-stroke"
        />
        <path
          :d="path(2)"
          fill="none"
          class="stroke-moon-arc"
          stroke-width="2"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />
        <path
          :d="path(0)"
          fill="none"
          class="stroke-sun-arc"
          stroke-width="2.5"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />
      </svg>
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 border-l-[1.5px] border-dashed border-foreground"
        :style="{ left: `${at}%` }"
      />
      <svg
        aria-hidden="true"
        data-moon-marker
        viewBox="-10 -10 20 20"
        width="20"
        height="20"
        class="pointer-events-none absolute block -translate-x-1/2 -translate-y-1/2"
        :class="{ 'opacity-0': now.moon.alt < BOTTOM }"
        :style="mark(now.moon.alt)"
      >
        <circle r="9" class="fill-card" />
        <MoonGlyph :r="7" :k="now.lit" :tilt="now.tilt" />
        <circle r="7" fill="none" class="stroke-moon-arc" stroke-width="1" />
      </svg>
      <div
        aria-hidden="true"
        data-sun-marker
        class="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-card bg-sun shadow-[0_0_0_5px_hsl(var(--sun)/0.25)]"
        :class="{ 'opacity-0': now.sun.alt < BOTTOM }"
        :style="mark(now.sun.alt)"
      />
      <span
        aria-hidden="true"
        class="pointer-events-none absolute right-2 text-[11px] leading-[14px] text-muted-foreground"
        :style="{ top: `calc(${yPct(0)}% - 18px)` }"
        >{{ $t('sky.chart.horizon') }}</span
      >
      <div
        aria-hidden="true"
        class="absolute inset-x-0 top-[calc(100%+8px)] h-4 text-xs leading-4 tabular-nums text-muted-foreground"
      >
        <span
          v-for="h in [0, 3, 6, 9, 12, 15, 18, 21, 24]"
          :key="h"
          class="absolute whitespace-nowrap"
          :class="{ 'max-md:hidden': h % 6 !== 0 }"
          :style="{
            left: `${(h / 24) * 100}%`,
            transform: h === 0 ? 'none' : h === 24 ? 'translateX(-100%)' : 'translateX(-50%)'
          }"
          >{{ formatHour(h % 24) }}</span
        >
      </div>
      <!-- dragging across the chart sets the time like the slider; pan-y keeps the page scrolling -->
      <div
        aria-hidden="true"
        data-scrub
        class="absolute inset-0 cursor-ew-resize touch-pan-y"
        @pointerdown="scrubDown"
        @pointermove="scrubMove"
        @pointerup="scrubUp"
        @pointercancel="scrubUp"
      />
    </div>
    <div class="h-6" />
    <div class="grid gap-2 md:grid-cols-2">
      <div
        v-for="r in reads"
        :key="r.key"
        data-read
        class="flex min-w-0 items-center gap-3 rounded-lg bg-surface-raised px-3.5 py-3"
      >
        <span class="size-3.5 flex-none rounded-full" :class="r.dot" />
        <span class="flex min-w-0 flex-col gap-0.5">
          <span class="text-xs font-medium leading-4 text-muted-foreground">{{ r.label }}</span>
          <span class="text-base font-semibold leading-[22px] tabular-nums">{{ r.value }}</span>
          <span class="text-xs leading-4 tabular-nums text-muted-foreground">{{ r.sub }}</span>
        </span>
      </div>
    </div>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import skyMixin from '@/mixins/skyMixin'
import skyScrub from '@/mixins/skyScrub'
import weatherMixin from '@/mixins/weatherMixin'
import { compassPoint, lightKey, minuteOfDay, nextEvent, phaseKey } from '@/utils/sky'
import MoonGlyph from './MoonGlyph.vue'

const TOP = 90
const BOTTOM = -45
const SPAN = TOP - BOTTOM

export default {
  name: 'SkyPathChart',
  components: { DashboardCard, MoonGlyph },
  mixins: [skyMixin, skyScrub, weatherMixin],
  props: {
    t: { type: Number, required: true },
    tz: { type: String, required: true },
    /** sky.day() for the chosen day and the next, sky.instant(t) */
    day: { type: Object, required: true },
    nextDay: { type: Object, required: true },
    now: { type: Object, required: true }
  },
  data() {
    return { SPAN, BOTTOM }
  },
  computed: {
    at() {
      return ((this.dragMinute ?? minuteOfDay(this.t, this.tz)) / 1440) * 100
    },
    sunUp() {
      return this.now.sun.alt > -0.833
    },
    moonUp() {
      return this.now.moon.alt > 0
    },
    nights() {
      const { sun } = this.day
      const x = (t) => (minuteOfDay(t, this.tz) / 1440) * 1000
      const out = []
      const band = (a, b) => {
        if (b > a) out.push({ x: a.toFixed(1), w: (b - a).toFixed(1) })
      }
      if (sun.rise != null && sun.set != null) {
        band(0, x(sun.civilDawn ?? sun.rise))
        band(x(sun.civilDusk ?? sun.set), 1000)
      } else if (this.day.pts[72][0] < -0.833) band(0, 1000) // polar night: the sun is down at noon
      return out
    },
    reads() {
      const n = this.now
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
      const height = (o, up) =>
        this.$t(up ? 'sky.chart.above' : 'sky.chart.below', {
          n: this.skyNumber(Math.abs(Math.round(o.alt)))
        })
      const where = (o, e, up) =>
        `${this.skyPoint(compassPoint(o.az))} (${this.skyDegrees(
          Math.round(o.az)
        )}) · ${this.skyNextText(e, up, this.t, this.tz)}`
      return [
        {
          key: 'sun',
          dot: 'bg-sun shadow-[0_0_0_4px_hsl(var(--sun)/0.2)]',
          label: this.$t('sky.chart.sunLabel', {
            light: this.$t(`sky.light.${lightKey(n.sun.alt)}`)
          }),
          value: height(n.sun, this.sunUp),
          sub: where(n.sun, sunNext, this.sunUp)
        },
        {
          key: 'moon',
          dot: 'bg-moon-lit shadow-[inset_0_0_0_1.5px_hsl(var(--moon-arc))]',
          label: this.$t('sky.chart.moonLabel', {
            phase: this.$t(`sky.phases.${phaseKey(n.phase)}`),
            lit: this.skyNumber(Math.round(n.lit * 100))
          }),
          value: height(n.moon, this.moonUp),
          sub: where(n.moon, moonNext, this.moonUp)
        }
      ]
    },
    aria() {
      const { sun, moon } = this.day
      return this.$t('sky.chart.aria', {
        date: this.skyDate(this.t, this.tz, { weekday: 'long', month: 'long', day: 'numeric' }),
        sunrise: this.skyClock(sun.rise, this.tz),
        sunset: this.skyClock(sun.set, this.tz),
        moonrise: this.skyClock(moon.rise, this.tz),
        moonset: this.skyClock(moon.set, this.tz)
      })
    }
  },
  methods: {
    y(alt) {
      return TOP - alt
    },
    yPct(alt) {
      return ((TOP - alt) / SPAN) * 100
    },
    path(col) {
      return this.day.pts
        .map(
          (q, i) =>
            `${i ? 'L' : 'M'}${((i / 144) * 1000).toFixed(1)},${this.y(
              Math.max(BOTTOM - 5, q[col])
            ).toFixed(1)}`
        )
        .join(' ')
    },
    mark(alt) {
      return { left: `${this.at}%`, top: `${Math.max(0, Math.min(100, this.yPct(alt)))}%` }
    }
  }
}
</script>
