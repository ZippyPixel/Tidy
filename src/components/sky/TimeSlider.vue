<template>
  <div class="px-3 pt-[22px]">
    <!-- design/TidySky slider: one 24-hour track for the chosen date, shaded night → twilight → day -->
    <div
      role="slider"
      tabindex="0"
      data-slider
      :aria-label="$t('sky.bar.slider')"
      aria-valuemin="0"
      aria-valuemax="1439"
      :aria-valuenow="minute"
      :aria-valuetext="timeText"
      class="relative h-11 cursor-pointer touch-none rounded-lg outline-ring focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      @pointerdown="scrubDown"
      @pointermove="scrubMove"
      @pointerup="scrubUp"
      @pointercancel="scrubUp"
      @keydown="onKey"
    >
      <span
        v-for="mark in marks"
        :key="mark.key"
        aria-hidden="true"
        class="pointer-events-none absolute bottom-[calc(50%+14px)] -translate-x-1/2 whitespace-nowrap text-[11px] leading-[14px] tabular-nums text-muted-foreground"
        :style="{ left: `${mark.at}%` }"
        >{{ mark.text }}</span
      >
      <div
        aria-hidden="true"
        class="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full shadow-[inset_0_0_0_1px_hsl(var(--border))]"
        :style="{ background: track }"
      />
      <span
        v-for="mark in marks"
        :key="`tick-${mark.key}`"
        aria-hidden="true"
        class="pointer-events-none absolute top-[calc(50%-11px)] -ml-px h-[22px] w-0.5 rounded-[1px] bg-sun-arc"
        :style="{ left: `${mark.at}%` }"
      />
      <div
        aria-hidden="true"
        class="pointer-events-none absolute top-1/2 size-7 rounded-full border-[3px] border-primary bg-card shadow-[0_2px_8px_hsl(220_30%_4%/0.25)] transition-transform duration-100 ease-out"
        :class="
          dragging
            ? '-translate-x-1/2 -translate-y-1/2 scale-[1.12]'
            : '-translate-x-1/2 -translate-y-1/2'
        "
        :style="{ left: `${at}%` }"
      />
      <div
        v-if="dragging"
        aria-hidden="true"
        data-bubble
        class="pointer-events-none absolute bottom-[calc(50%+22px)] z-[2] whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1 text-[13px] font-semibold leading-[18px] tabular-nums text-background"
        :style="{ left: `${at}%`, transform: `translateX(${at < 8 ? -20 : at > 92 ? -80 : -50}%)` }"
      >
        {{ timeText }}
      </div>
    </div>
    <div
      aria-hidden="true"
      class="relative mt-0.5 h-4 text-xs leading-4 tabular-nums text-muted-foreground"
    >
      <span
        v-for="h in hours"
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
  </div>
</template>

<script>
import skyMixin from '@/mixins/skyMixin'
import skyScrub from '@/mixins/skyScrub'
import weatherMixin from '@/mixins/weatherMixin'
import { minuteOfDay } from '@/utils/sky'

const NIGHT = 'hsl(var(--foreground) / 0.16)'
const DAY = 'hsl(var(--sun) / 0.55)'
const TWILIGHT_FALLBACK_MS = 25 * 60000
const KEY_STEPS = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }

export default {
  name: 'TimeSlider',
  mixins: [skyMixin, skyScrub, weatherMixin],
  props: {
    /** minute of the local day, 0–1439 */
    minute: { type: Number, required: true },
    /** the day's sun events (createSky().day(ds).sun) */
    sun: { type: Object, required: true },
    /** the sun is up at the chosen time (shades a day with no sunrise or sunset) */
    sunUp: { type: Boolean, default: false },
    tz: { type: String, required: true },
    timeText: { type: String, required: true }
  },
  data() {
    return { hours: [0, 3, 6, 9, 12, 15, 18, 21, 24] }
  },
  computed: {
    at() {
      return ((this.dragMinute ?? this.minute) / 1440) * 100
    },
    track() {
      const s = this.sun
      const pct = (t) => (minuteOfDay(t, this.tz) / 1440) * 100
      const stops =
        s.rise != null && s.set != null
          ? [
              [0, NIGHT],
              [pct(s.civilDawn ?? s.rise - TWILIGHT_FALLBACK_MS), NIGHT],
              [pct(s.rise) + 1, DAY],
              [pct(s.set) - 1, DAY],
              [pct(s.civilDusk ?? s.set + TWILIGHT_FALLBACK_MS), NIGHT],
              [100, NIGHT]
            ]
          : [
              [0, this.sunUp ? DAY : NIGHT],
              [100, this.sunUp ? DAY : NIGHT]
            ]
      return `linear-gradient(90deg, ${stops
        .map(([x, c]) => `${c} ${Math.max(0, Math.min(100, x)).toFixed(2)}%`)
        .join(', ')})`
    },
    marks() {
      const marks = []
      const add = (key, t, arrow) => {
        if (t != null)
          marks.push({
            key,
            at: (minuteOfDay(t, this.tz) / 1440) * 100,
            text: `${arrow} ${this.skyClock(t, this.tz)}`
          })
      }
      add('rise', this.sun.rise, '↑')
      add('set', this.sun.set, '↓')
      return marks
    }
  },
  methods: {
    onKey(event) {
      const step = KEY_STEPS[event.key]
      let to = null
      if (step) to = this.minute + step * (event.shiftKey ? 10 : 1)
      else if (event.key === 'PageUp') to = this.minute + 60
      else if (event.key === 'PageDown') to = this.minute - 60
      else if (event.key === 'Home') to = 0
      else if (event.key === 'End') to = 1439
      if (to == null) return
      event.preventDefault()
      this.$emit('commit', Math.max(0, Math.min(1439, to)))
    }
  }
}
</script>
