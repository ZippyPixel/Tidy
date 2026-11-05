<template>
  <div class="flex h-full flex-col">
    <template v-if="!loading">
      <!-- metric chips -->
      <div
        role="radiogroup"
        :aria-label="$t('hourly.metric')"
        class="chip-row -mx-4 flex h-8 flex-none gap-2 overflow-x-auto overflow-y-hidden px-4 scrollbar-hide md:-mx-6 md:px-6"
      >
        <button
          v-for="chip in chips"
          :key="chip.value"
          type="button"
          role="radio"
          :aria-checked="String(chip.value === metric)"
          class="flex h-8 flex-none items-center gap-2 whitespace-nowrap rounded-lg border text-sm font-medium leading-5 hover:shadow-[inset_0_0_0_999px_hsl(var(--foreground)/0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:shadow-[inset_0_0_0_999px_hsl(var(--foreground)/0.12)]"
          :class="
            chip.value === metric
              ? 'border-transparent bg-accent pl-2 pr-4 text-accent-foreground'
              : 'border-input px-4 text-foreground'
          "
          @click="$emit('update:metric', chip.value)"
        >
          <AppIcon v-if="chip.value === metric" name="check" :size="18" :stroke-width="2.2" />
          <span>{{ chip.label }}</span>
        </button>
      </div>

      <!-- plot: SVG for strokes/fills (stretched to the box), HTML for anything that
           must keep its shape (labels, arrows, dot, tooltip), positioned in % -->
      <div class="relative ml-8 mt-4 h-40">
        <span
          v-for="tick in yTicks"
          :key="`y${tick.value}`"
          class="absolute right-[calc(100%+8px)] whitespace-nowrap text-xs leading-4 tabular-nums text-muted-foreground"
          :style="{ top: `calc(${tick.top}% - 8px)` }"
          >{{ tick.label }}</span
        >

        <svg
          class="absolute inset-0 size-full overflow-visible"
          :viewBox="`0 0 ${W} ${H}`"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" :style="{ stopColor: color, stopOpacity: 0.2 }" />
              <stop offset="1" :style="{ stopColor: color, stopOpacity: 0 }" />
            </linearGradient>
          </defs>
          <line
            v-for="tick in yTicks"
            :key="`g${tick.value}`"
            x1="0"
            :x2="W"
            :y1="tick.y"
            :y2="tick.y"
            class="stroke-chart-grid"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
          <line
            v-if="midnight !== null"
            :x1="X(midnight)"
            :x2="X(midnight)"
            y1="0"
            :y2="H"
            class="stroke-muted-foreground/50"
            stroke-width="1"
            stroke-dasharray="2 3"
            vector-effect="non-scaling-stroke"
          />
          <path v-for="(d, i) in areas" :key="`a${i}`" :d="d" :fill="`url(#${gradientId})`" />
          <rect
            v-for="bar in bars"
            :key="`b${bar.i}`"
            :x="bar.x"
            :y="bar.y"
            :width="bar.w"
            :height="bar.h"
            rx="2"
            :style="{ fill: color }"
          />
          <path
            v-for="(d, i) in lines"
            :key="`l${i}`"
            :d="d"
            fill="none"
            :style="{ stroke: color }"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          />
          <line
            v-if="live"
            :x1="X(0)"
            :x2="X(0)"
            y1="0"
            :y2="H"
            class="stroke-foreground"
            stroke-width="1.5"
            stroke-dasharray="4 3"
            vector-effect="non-scaling-stroke"
          />
          <line
            v-if="scrub"
            :x1="X(scrub.i)"
            :x2="X(scrub.i)"
            y1="0"
            :y2="H"
            class="stroke-muted-foreground"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
        </svg>

        <!-- wind direction arrows: every 3 h on phones, every 2 h from md -->
        <template v-if="metric === 'wind'">
          <svg
            v-for="arrow in arrows"
            :key="`w${arrow.i}`"
            viewBox="-6 -6 12 12"
            aria-hidden="true"
            class="absolute size-3 -translate-x-1/2 -translate-y-1/2"
            :class="arrow.cls"
            :style="{ left: `${arrow.left}%`, top: `${arrow.top}%`, color }"
          >
            <path d="M0,-6 L4.5,5 L0,2.5 L-4.5,5 Z" fill="currentColor" :transform="`rotate(${arrow.deg})`" />
          </svg>
        </template>

        <span
          v-if="midnight !== null"
          class="pointer-events-none absolute top-0 rounded bg-card px-1 text-xs font-semibold leading-4 text-primary"
          :style="{ left: `calc(${pct(midnight)}% + 4px)` }"
          >{{ relativeDay(points[midnight].date, today) }}</span
        >

        <template v-if="scrub">
          <span
            v-if="scrub.value !== null"
            class="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] bg-card"
            :style="{ left: `${pct(scrub.i)}%`, top: `${(Y(scrub.value) / H) * 100}%`, borderColor: color }"
          />
          <span
            v-if="scrub.touch"
            class="pointer-events-none absolute size-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/[0.08] shadow-[inset_0_0_0_1px_hsl(var(--foreground)/0.16)]"
            :style="{ left: `${pct(scrub.i)}%`, top: `${((scrub.value === null ? H / 2 : Y(scrub.value)) / H) * 100}%` }"
          />
          <div
            role="status"
            class="pointer-events-none absolute top-0 z-[3] flex items-baseline gap-2 whitespace-nowrap rounded-lg border bg-popover text-popover-foreground shadow-[0_4px_12px_hsl(220_30%_4%/0.14)]"
            :class="scrub.touch ? 'px-3 py-2 text-sm leading-5' : 'px-2 py-1 text-[13px] leading-5'"
            :style="{
              left: `${pct(scrub.i)}%`,
              transform: scrub.i > points.length * 0.58 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)'
            }"
          >
            <span class="text-muted-foreground">{{ scrub.time }}</span>
            <span class="font-semibold tabular-nums">{{ scrub.label }}</span>
            <span v-if="scrub.extra" class="text-muted-foreground">{{ scrub.extra }}</span>
          </div>
        </template>

        <!-- x axis -->
        <div class="absolute inset-x-0 top-[calc(100%+8px)] h-4 text-xs leading-4 text-muted-foreground">
          <span class="absolute right-[calc(100%+8px)] top-0 whitespace-nowrap">{{ unitCaption }}</span>
          <span
            v-for="tick in xTicks"
            :key="`x${tick.i}`"
            class="absolute top-0 whitespace-nowrap"
            :class="tick.cls"
            :style="{ left: `${pct(tick.i)}%`, transform: tick.transform }"
            >{{ tick.label }}</span
          >
        </div>

        <!-- pointer layer: hover, tap or drag reads a value; vertical page scroll still works -->
        <div
          class="absolute inset-x-0 -bottom-6 -top-2 cursor-crosshair touch-pan-y"
          :aria-label="$t('hourly.chartHint')"
          @pointerdown="onScrub"
          @pointermove="onScrub"
          @pointerleave="onLeave"
        />
      </div>
    </template>

    <!-- skeleton -->
    <template v-else>
      <div class="flex h-8 gap-2 overflow-hidden" aria-hidden="true">
        <div v-for="w in [120, 96, 132, 68, 96]" :key="w" class="h-8 flex-none rounded-lg bg-muted" :style="{ width: `${w}px` }" />
      </div>
      <div class="relative ml-8 mt-4 h-40 rounded-lg bg-gradient-to-b from-muted/0 to-muted" aria-hidden="true">
        <div class="absolute inset-x-0 top-0 border-t border-chart-grid" />
        <div class="absolute inset-x-0 top-1/2 border-t border-chart-grid" />
        <div class="absolute inset-x-0 bottom-0 border-t border-chart-grid" />
        <div class="absolute inset-x-0 top-[calc(100%+12px)] h-2 rounded bg-muted" />
      </div>
    </template>
  </div>
</template>

<script>
import { useId } from 'vue'
import { mapState } from 'pinia'
import useUnitStore from '@/stores/unit'
import weatherMixin from '@/mixins/weatherMixin'
import AppIcon from '@/components/common/AppIcon.vue'
import { compassPoint, smoothPath, temperatureScale } from '@/utils/hourly'

// plot box in viewBox units; X keeps an 8-unit inset so end dots are not clipped
const W = 1000
const H = 160
const INSET = 8

const COLORS = {
  temp: 'hsl(var(--chart-temperature))',
  feels: 'hsl(var(--chart-feels))',
  rain: 'hsl(var(--chart-rain))',
  wind: 'hsl(var(--chart-wind))',
  hum: 'hsl(var(--chart-humidity))'
}

export default {
  name: 'HourlyTrends',
  components: { AppIcon },
  mixins: [weatherMixin],
  props: {
    /** hourlyWindow() output */
    points: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    live: { type: Boolean, default: false },
    today: { type: String, default: '' },
    metric: { type: String, default: 'temp' }
  },
  emits: ['update:metric'],
  setup() {
    return { gradientId: useId() }
  },
  data() {
    return { W, H, scrubIndex: null, scrubTouch: false }
  },
  computed: {
    ...mapState(useUnitStore, ['unit']),
    celsius() {
      return this.unit === 'celsius'
    },
    windUnit() {
      return this.$t(this.celsius ? 'hourly.kmh' : 'hourly.mph')
    },
    chips() {
      return [
        { value: 'temp', label: this.$t('hourly.metrics.temp') },
        { value: 'feels', label: this.$t('hourly.metrics.feels') },
        { value: 'rain', label: this.$t('hourly.metrics.rain') },
        { value: 'wind', label: this.$t('hourly.metrics.wind') },
        { value: 'hum', label: this.$t('hourly.metrics.hum') }
      ]
    },
    color() {
      return COLORS[this.metric]
    },
    series() {
      const pick = (c, f) => (p) => (this.celsius ? p[c] : p[f])
      const get = {
        temp: pick('tempC', 'tempF'),
        feels: pick('feelsC', 'feelsF'),
        rain: (p) => p.rain,
        wind: pick('windKph', 'windMph'),
        hum: (p) => p.humidity
      }[this.metric]
      return this.points.map((p) => {
        const v = get(p)
        return typeof v === 'number' ? v : null
      })
    },
    // value domain, ticks and the vertical band the series is drawn in
    scale() {
      if (this.metric === 'temp' || this.metric === 'feels') {
        return { ...temperatureScale(this.series), top: 8, bottom: H }
      }
      if (this.metric === 'rain' || this.metric === 'hum') {
        return { min: 0, max: 100, ticks: [0, 50, 100], top: 0, bottom: H }
      }
      const step = this.celsius ? 10 : 5
      const peak = Math.max(0, ...this.series.filter((v) => v !== null))
      const max = Math.max(step, Math.ceil((peak * 1.15) / step) * step)
      const ticks = []
      for (let t = 0; t <= max; t += step) ticks.push(t)
      // leave room under the line for the direction arrows
      return { min: 0, max, ticks, top: 8, bottom: H - 24 }
    },
    segments() {
      const segs = []
      let current = []
      this.series.forEach((v, i) => {
        if (v === null) {
          if (current.length) segs.push(current)
          current = []
        } else current.push([this.X(i), this.Y(v)])
      })
      if (current.length) segs.push(current)
      return segs
    },
    lines() {
      return this.metric === 'rain' ? [] : this.segments.map(smoothPath)
    },
    areas() {
      if (this.metric !== 'temp' && this.metric !== 'feels') return []
      return this.segments.map(
        (s) => `${smoothPath(s)} L${s[s.length - 1][0].toFixed(1)},${H} L${s[0][0].toFixed(1)},${H} Z`
      )
    },
    bars() {
      if (this.metric !== 'rain') return []
      const w = Math.min(16, this.step * 0.56)
      return this.series
        .map((v, i) => ({ v, i }))
        .filter(({ v }) => v !== null)
        .map(({ v, i }) => ({ i, x: (this.X(i) - w / 2).toFixed(1), y: this.Y(v).toFixed(1), w: w.toFixed(1), h: Math.max(0, H - this.Y(v)).toFixed(1) }))
    },
    arrows() {
      return this.points
        .map((p, i) => ({ i, deg: p.windDegree + 180 }))
        .filter(({ i }) => i % 2 === 0 || i % 3 === 0)
        .map((a) => ({
          ...a,
          left: this.pct(a.i),
          top: ((H - 12) / H) * 100,
          cls: a.i % 3 === 0 ? (a.i % 2 === 0 ? '' : 'md:hidden') : 'hidden md:block'
        }))
    },
    yTicks() {
      const label = (t) =>
        this.metric === 'temp' || this.metric === 'feels'
          ? `${this.formatNumber(t)}°`
          : this.metric === 'wind'
          ? this.formatNumber(t)
          : `${this.formatNumber(t)}%`
      return this.scale.ticks.map((t) => ({ value: t, y: this.Y(t), top: (this.Y(t) / H) * 100, label: label(t) }))
    },
    // labels every 6 h below md, every 3 h from md
    xTicks() {
      const last = this.points.length - 1
      const ticks = []
      for (let i = 0; i <= last; i += 3) {
        ticks.push({
          i,
          label: i === 0 && this.live ? this.$t('hourly.now') : this.formatHour(this.points[i].hour),
          cls: [i % 6 === 0 ? '' : 'hidden md:block', i === 0 && this.live ? 'font-semibold text-foreground' : ''],
          transform: i === 0 ? 'translateX(-8px)' : i === last ? 'translateX(calc(-100% + 8px))' : 'translateX(-50%)'
        })
      }
      return ticks
    },
    unitCaption() {
      if (this.metric === 'temp' || this.metric === 'feels') return this.celsius ? '°C' : '°F'
      return this.metric === 'wind' ? this.windUnit : '%'
    },
    // index of the first hour of the next day, for the dashed day boundary
    midnight() {
      const i = this.points.findIndex((p, idx) => idx > 0 && p.date !== this.points[0].date)
      return i > 0 ? i : null
    },
    step() {
      return this.points.length > 1 ? (W - 2 * INSET) / (this.points.length - 1) : 0
    },
    scrub() {
      if (this.scrubIndex === null || !this.points[this.scrubIndex]) return null
      const i = this.scrubIndex
      const p = this.points[i]
      const value = this.series[i]
      let time = this.formatHour(p.hour)
      if (i === 0 && this.live) time = this.$t('hourly.now')
      else if (p.date !== this.points[0].date) time = this.$t('hourly.onDay', { day: this.relativeDay(p.date, this.today), time })
      return {
        i,
        value,
        time,
        touch: this.scrubTouch,
        label: value === null ? '—' : this.formatValue(value),
        extra: this.metric === 'wind' ? this.$t('hourly.windFrom', { dir: compassPoint(p.windDegree) }) : ''
      }
    }
  },
  watch: {
    points() {
      this.scrubIndex = null
    }
  },
  methods: {
    X(i) {
      return INSET + i * this.step
    },
    Y(v) {
      const { min, max, top, bottom } = this.scale
      return bottom - ((v - min) / (max - min || 1)) * (bottom - top)
    },
    pct(i) {
      return (this.X(i) / W) * 100
    },
    formatValue(v) {
      if (this.metric === 'temp' || this.metric === 'feels') return `${this.formatNumber(Math.round(v))}°`
      if (this.metric === 'wind') return `${this.formatNumber(Math.round(v))} ${this.windUnit}`
      return `${this.formatNumber(Math.round(v))}%`
    },
    onScrub(event) {
      if (!this.points.length) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (!rect.width) return
      const units = ((event.clientX - rect.left) / rect.width) * W
      const i = Math.round((units - INSET) / (this.step || 1))
      this.scrubIndex = Math.max(0, Math.min(this.points.length - 1, i))
      this.scrubTouch = event.pointerType === 'touch'
    },
    // mouse hides the readout on leave; touch keeps the last value until the next tap
    onLeave(event) {
      if (event.pointerType === 'mouse') this.scrubIndex = null
    }
  }
}
</script>

<style scoped>
/* phones: hint that the chip row scrolls */
@media (max-width: 767px) {
  .chip-row {
    mask-image: linear-gradient(to right, #000 calc(100% - 32px), transparent);
    -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 32px), transparent);
  }
}
</style>
