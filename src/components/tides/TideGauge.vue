<template>
  <div aria-hidden="true" class="relative flex-none overflow-hidden rounded-full bg-surface-raised">
    <!-- A pill sized in CSS; the water stretches to fit it. Decorative: the level and the
         trend are in text beside it. -->
    <svg viewBox="0 0 32 100" preserveAspectRatio="none" class="absolute inset-0 block size-full">
      <defs>
        <linearGradient :id="waterId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style="stop-color: hsl(var(--tide)); stop-opacity: 0.95" />
          <stop offset="1" style="stop-color: hsl(var(--tide)); stop-opacity: 0.55" />
        </linearGradient>
      </defs>
      <path data-water :d="water" :fill="`url(#${waterId})`" />
    </svg>
    <span class="absolute inset-0 rounded-full shadow-[inset_0_0_0_1.5px_hsl(var(--border))]" />
  </div>
</template>

<script>
import { useId } from 'vue'
import { gaugeWaterPath } from '@/utils/tides'

export default {
  name: 'TideGauge',
  props: {
    /** gaugeFraction(), 0..1 */
    fraction: { type: Number, required: true }
  },
  setup() {
    return { waterId: useId() }
  },
  computed: {
    water() {
      return gaugeWaterPath(this.fraction, 32, 100)
    }
  }
}
</script>
