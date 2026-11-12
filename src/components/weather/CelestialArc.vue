<template>
  <div class="flex min-h-0 flex-col gap-2 lg:flex-1">
    <!-- 24-hour day curve: faded full curve, the rise→set stretch lit, marker in the slot.
         The SVG stretches to its box (fixed height below lg, fills the card from lg);
         the marker and labels are HTML so they keep their shape. -->
    <div class="relative h-[110px] md:h-[126px] lg:h-auto lg:min-h-[126px] lg:flex-1">
      <svg
        class="absolute inset-0 size-full overflow-visible"
        :viewBox="`0 0 ${W} ${H}`"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient :id="fadeId" gradientUnits="userSpaceOnUse" x1="0" y1="0" :x2="W" y2="0">
            <stop offset="0" class="[stop-color:hsl(var(--horizon))]" stop-opacity="0" />
            <stop offset="0.1" class="[stop-color:hsl(var(--horizon))]" stop-opacity="1" />
            <stop offset="0.9" class="[stop-color:hsl(var(--horizon))]" stop-opacity="1" />
            <stop offset="1" class="[stop-color:hsl(var(--horizon))]" stop-opacity="0" />
          </linearGradient>
        </defs>
        <template v-if="loading">
          <path :d="fullPath" fill="none" class="tidy-skeleton-line" stroke-width="3" stroke-dasharray="6 6" stroke-linecap="round" vector-effect="non-scaling-stroke" />
        </template>
        <template v-else>
          <path :d="fullPath" fill="none" :stroke="`url(#${fadeId})`" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke" />
          <path v-if="window" :d="litPath" fill="none" :class="litClass" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke" />
        </template>
      </svg>
      <div
        v-if="window && showMarker && !loading"
        class="marker absolute -translate-x-1/2 -translate-y-1/2"
        :style="{ left: `${window.now * 100}%`, top: `${(markerY / H) * 100}%` }"
      >
        <slot name="marker" :up="window.up" />
      </div>
    </div>

    <div class="relative h-10">
      <template v-if="loading">
        <div class="flex h-full items-end justify-around" aria-hidden="true">
          <div v-for="n in 2" :key="n" class="flex flex-col items-center gap-2">
            <Skeleton class="h-2.5 w-14" />
            <Skeleton class="h-4 w-[76px]" />
          </div>
        </div>
      </template>
      <template v-else-if="window">
        <div
          v-for="edge in edges"
          :key="edge.key"
          class="absolute top-0 flex w-[136px] flex-col items-center text-center"
          :style="{ left: `clamp(0px, calc(${edge.at * 100}% - 68px), calc(100% - 136px))` }"
        >
          <span class="whitespace-nowrap text-[13px] leading-4 text-muted-foreground">{{ edge.label }}</span>
          <span class="whitespace-nowrap text-xl font-semibold leading-6 tabular-nums">{{ edge.time }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { Skeleton } from '@/components/ui/skeleton'
import { useId } from 'vue'
import { curveDepth, curvePath } from '@/utils/astro'

// viewBox units; the curve runs from TOP (peak) to H - BOTTOM (troughs)
const W = 1000
const H = 126
const TOP = 22
const BOTTOM = 8

export default {
  name: 'CelestialArc',
  components: { Skeleton },
  props: {
    /** celestialWindow() result: { rise, set, now, up } as 0..1 fractions; null hides the arc */
    window: { type: Object, default: null },
    /** rise / set labels and display times */
    riseLabel: { type: String, default: '' },
    riseTime: { type: String, default: '—' },
    setLabel: { type: String, default: '' },
    setTime: { type: String, default: '—' },
    /** marker only for today (a picked day has no "now") */
    showMarker: { type: Boolean, default: true },
    /** Tailwind stroke class for the lit stretch */
    litClass: { type: String, default: 'stroke-sun-arc' },
    loading: { type: Boolean, default: false }
  },
  setup() {
    return { fadeId: useId() }
  },
  data() {
    return { W, H }
  },
  computed: {
    box() {
      return { width: W, height: H, top: TOP, bottom: BOTTOM }
    },
    fullPath() {
      return curvePath(0, 1, this.box)
    },
    litPath() {
      return curvePath(this.window.rise, this.window.set, this.box)
    },
    markerY() {
      return TOP + (H - TOP - BOTTOM) * curveDepth(this.window.now)
    },
    edges() {
      return [
        { key: 'rise', at: this.window.rise, label: this.riseLabel, time: this.riseTime },
        { key: 'set', at: this.window.set, label: this.setLabel, time: this.setTime }
      ]
    }
  }
}
</script>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .marker {
    animation: marker-in 0.6s ease-out both;
  }
}

@keyframes marker-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
