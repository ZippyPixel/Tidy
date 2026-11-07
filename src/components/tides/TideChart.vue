<template>
  <div class="relative w-full min-w-0 pb-6 text-card-foreground">
    <!-- design/TidyTideChart. The curve is an SVG stretched to the box; anything that must
         keep its shape (dots, labels, the readout) is HTML placed in %. -->
    <div class="relative" :class="[card ? 'h-[176px] md:h-[188px]' : 'ml-10 h-[216px] md:h-[268px]']">
      <template v-if="model">
        <span
          v-for="g in model.grid"
          :key="g.value"
          data-level
          class="pointer-events-none absolute right-[calc(100%+8px)] -translate-y-1/2 whitespace-nowrap text-xs leading-4 tabular-nums text-muted-foreground"
          :style="{ top: `${g.y}%` }"
        >
          {{ levelLabel(g) }}
        </span>

        <svg
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          :role="card ? undefined : 'img'"
          :aria-hidden="card ? 'true' : undefined"
          :aria-label="card ? undefined : ariaLabel"
          class="absolute inset-0 block size-full overflow-visible"
          :class="interactive ? 'cursor-crosshair' : ''"
          :style="interactive ? { touchAction: 'pan-y' } : undefined"
          @pointermove="scrub"
          @pointerdown="scrub"
          @pointerleave="leave"
        >
          <defs>
            <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style="stop-color: hsl(var(--tide)); stop-opacity: 0.32" />
              <stop offset="1" style="stop-color: hsl(var(--tide)); stop-opacity: 0.03" />
            </linearGradient>
          </defs>
          <rect v-for="n in model.nights" :key="n.x" data-night :x="n.x" y="0" :width="n.width" height="100" class="fill-chart-night" />
          <line
            v-for="g in model.grid"
            :key="g.value"
            x1="0"
            x2="1000"
            :y1="g.y"
            :y2="g.y"
            class="stroke-chart-grid"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
          <template v-if="view !== 'day'">
            <line
              v-for="x in model.separators"
              :key="x"
              :x1="x"
              :x2="x"
              y1="0"
              y2="100"
              class="stroke-border"
              stroke-width="1"
              vector-effect="non-scaling-stroke"
            />
          </template>
          <path :d="model.area" :fill="`url(#${gradientId})`" />
          <path
            data-curve
            :d="model.line"
            fill="none"
            class="stroke-tide"
            stroke-width="2.5"
            stroke-linejoin="round"
            stroke-linecap="round"
            vector-effect="non-scaling-stroke"
          />
          <template v-if="model.now">
            <!-- the past, dimmed -->
            <rect data-past x="0" y="0" :width="model.now.x * 10" height="100" class="fill-card opacity-50" />
            <line
              data-now
              :x1="model.now.x * 10"
              :x2="model.now.x * 10"
              y1="0"
              y2="100"
              class="stroke-foreground"
              stroke-width="1.5"
              stroke-dasharray="4 3"
              vector-effect="non-scaling-stroke"
            />
          </template>
          <line
            v-if="reading"
            :x1="reading.x * 10"
            :x2="reading.x * 10"
            y1="0"
            y2="100"
            class="stroke-muted-foreground"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
        </svg>

        <div
          v-for="mark in marks"
          :key="mark.time"
          data-mark
          :data-high="mark.high"
          aria-hidden="true"
          class="pointer-events-none absolute"
          :class="{ 'opacity-50': mark.past }"
          :style="{ left: `${mark.x}%`, top: `${mark.y}%` }"
        >
          <span
            class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            :class="[view === 'week' ? 'size-2' : 'size-[11px]', mark.high ? 'border-card bg-tide' : 'border-tide bg-card']"
          />
          <span
            v-if="view !== 'week'"
            class="absolute flex flex-col whitespace-nowrap"
            :class="[anchorClass(mark.anchor), mark.high ? 'bottom-[7px]' : 'top-[9px]']"
          >
            <span class="text-[13px] font-semibold leading-[14px] tabular-nums text-foreground">{{ mark.clock }}</span>
            <span class="text-xs leading-[14px] tabular-nums text-muted-foreground">{{ mark.height }}</span>
          </span>
        </div>

        <div v-if="model.now" aria-hidden="true" class="pointer-events-none absolute" :style="{ left: `${model.now.x}%`, top: `${model.now.y}%` }">
          <span
            class="absolute size-9 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style="background: radial-gradient(closest-side, hsl(var(--tide) / 0.45), hsl(var(--tide) / 0))"
          />
          <span data-now-dot class="absolute size-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-card bg-tide" />
        </div>

        <template v-if="reading">
          <span
            aria-hidden="true"
            class="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-tide bg-card"
            :style="{ left: `${reading.x}%`, top: `${reading.y}%` }"
          />
          <div
            data-readout
            class="pointer-events-none absolute top-0 flex items-baseline gap-2 whitespace-nowrap rounded-lg border bg-popover text-popover-foreground shadow-[0_4px_12px_hsl(220_30%_4%/0.14)]"
            :class="[
              reading.x > 62 ? '-translate-x-[calc(100%+12px)]' : 'translate-x-3',
              touch ? 'px-3 py-2 text-sm leading-5' : 'px-2 py-1 text-[13px] leading-5'
            ]"
            :style="{ left: `${reading.x}%` }"
          >
            <span class="text-muted-foreground">{{ reading.clock }}</span>
            <span class="font-semibold tabular-nums">{{ reading.height }}</span>
            <span class="font-medium text-tide">{{ reading.trend }}</span>
          </div>
        </template>

        <div class="pointer-events-none absolute inset-x-0 top-[calc(100%+8px)] h-4 text-xs leading-4 tabular-nums text-muted-foreground">
          <span
            v-for="tick in ticks"
            :key="tick.time"
            data-tick
            class="absolute whitespace-nowrap"
            :class="[tickAnchor(tick.x), { 'font-semibold text-foreground': tick.strong, 'hidden md:inline': tick.minor }]"
            :style="{ left: `${tick.x}%` }"
          >
            {{ tick.label }}
          </span>
        </div>
      </template>

      <svg v-else data-skeleton viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true" class="absolute inset-0 block size-full">
        <path
          :d="skeletonPath"
          fill="none"
          class="stroke-muted"
          stroke-width="3"
          stroke-dasharray="6 6"
          stroke-linecap="round"
          vector-effect="non-scaling-stroke"
        />
      </svg>
    </div>
  </div>
</template>

<script>
import { useId } from 'vue'
import weatherMixin from '@/mixins/weatherMixin'
import tideMixin from '@/mixins/tideMixin'
import { dateInZone, hourTicks } from '@/utils/tideTime'
import { chartModel, isRising, levelAt } from '@/utils/tides'

export default {
  name: 'TideChart',
  mixins: [weatherMixin, tideMixin],
  props: {
    /** /api/tides payload; null draws the loading state */
    tides: { type: Object, default: null },
    /** day | week | card */
    view: { type: String, default: 'day' },
    /** Day view: -1 (yesterday) to 6 */
    day: { type: Number, default: 0 },
    /** epoch seconds */
    now: { type: Number, required: true },
    interactive: { type: Boolean, default: true }
  },
  setup() {
    return { gradientId: useId() }
  },
  data() {
    return {
      scrubAt: null,
      touch: false
    }
  },
  computed: {
    card() {
      return this.view === 'card'
    },
    zone() {
      return this.tides?.station?.timezone
    },
    model() {
      if (!this.tides?.station) return null
      return chartModel(this.tides, { view: this.view, day: this.day, now: this.now, unit: this.unit })
    },
    marks() {
      if (!this.model) return []
      return this.model.marks.map((mark) => ({
        ...mark,
        past: mark.time < this.now,
        clock: this.tideClock(mark.time, this.zone),
        height: this.heightText(mark.level)
      }))
    },
    ticks() {
      if (!this.model) return []
      const { from, to } = this.model
      const x = (time) => ((time - from) / (to - from)) * 100
      if (this.view === 'week') {
        const today = dateInZone(this.now, this.zone)
        return this.tides.days
          .filter((d) => d.start + 43200 > from && d.start + 43200 < to)
          .map((d) => ({
            time: d.start,
            x: x(d.start + 43200),
            strong: d.date === today,
            label: this.dayShort(d.date)
          }))
      }
      if (this.card) {
        return hourTicks(from, to, this.zone, 6).map(({ time, hour }) => ({
          time,
          x: x(time),
          strong: hour === 0,
          label: hour === 0 ? this.dayShort(dateInZone(time, this.zone)) : this.formatHour(hour)
        }))
      }
      // every 6 h on a phone, every 3 h from md, chosen in CSS
      return hourTicks(from, to, this.zone, 3)
        .filter(({ time }) => x(time) < 99.9)
        .map(({ time, hour }) => ({ time, x: x(time), minor: hour % 6 !== 0, label: this.formatHour(hour) }))
    },
    reading() {
      if (this.scrubAt === null || !this.model || !this.interactive) return null
      const { from, to } = this.model
      if (this.scrubAt < from || this.scrubAt > to) return null
      return {
        ...this.model.at(this.scrubAt),
        clock: this.tideClock(this.scrubAt, this.zone),
        height: this.heightText(levelAt(this.tides, this.scrubAt)),
        trend: `${isRising(this.tides, this.scrubAt) ? '▲' : '▼'} ${this.$t(
          isRising(this.tides, this.scrubAt) ? 'tides.rising' : 'tides.falling'
        )}`
      }
    },
    ariaLabel() {
      if (!this.model) return this.$t('tides.chart.ariaNone')
      const list = this.marks
        .slice(0, 8)
        .map((m) => this.$t(m.high ? 'tides.chart.ariaHigh' : 'tides.chart.ariaLow', { time: m.clock, height: m.height }))
        .join('; ')
      if (this.view === 'week') return this.$t('tides.chart.ariaWeek', { list })
      if (this.card) return this.$t('tides.chart.ariaCard', { list })
      return this.$t('tides.chart.ariaDay', { day: this.dayShort(dateInZone(this.model.from, this.zone)), list })
    },
    skeletonPath() {
      let path = ''
      for (let i = 0; i <= 64; i++) {
        path += `${i ? ' L' : 'M'}${(i / 64) * 1000},${(50 + Math.sin((i / 64) * Math.PI * 4) * 20).toFixed(1)}`
      }
      return path
    }
  },
  watch: {
    view() {
      this.scrubAt = null
    },
    day() {
      this.scrubAt = null
    }
  },
  methods: {
    heightText(metres) {
      return `${this.tideHeight(metres)} ${this.tideUnit}`
    },
    dayShort(date) {
      const day = Number(date.split('-')[2])
      return `${this.tideDate(date, { weekday: 'short' })} ${this.formatNumber(day)}`
    },
    levelLabel(g) {
      const text = this.tideDecimal(g.value, Number.isInteger(g.value) ? 0 : 1)
      // only the top label names the unit
      return g === this.model.grid[0] ? `${text} ${this.tideUnit}` : text
    },
    anchorClass(anchor) {
      if (anchor === 'start') return 'left-0 items-start'
      if (anchor === 'end') return 'right-0 items-end'
      return 'left-0 -translate-x-1/2 items-center'
    },
    tickAnchor(x) {
      if (x < 2) return ''
      if (x > 98) return '-translate-x-full'
      return '-translate-x-1/2'
    },
    // touch keeps the last reading after the finger lifts; a mouse hides it on leaving
    scrub(event) {
      if (!this.interactive || !this.model) return
      const box = event.currentTarget.getBoundingClientRect()
      const fraction = Math.max(0, Math.min(1, (event.clientX - box.left) / Math.max(1, box.width)))
      this.scrubAt = this.model.from + fraction * (this.model.to - this.model.from)
      this.touch = event.pointerType === 'touch'
    },
    leave(event) {
      if ((event.pointerType || 'mouse') === 'mouse') this.scrubAt = null
    }
  }
}
</script>
