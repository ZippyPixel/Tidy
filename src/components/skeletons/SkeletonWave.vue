<template>
  <svg
    data-skeleton
    class="block w-full overflow-visible"
    viewBox="0 0 1000 100"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      :d="path"
      fill="none"
      class="tidy-skeleton-line"
      stroke-width="2"
      stroke-dasharray="6 6"
      stroke-linecap="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>

<script>
// A chart's placeholder: a dashed curve that pulses on the skeleton clock, stretched
// to its box like the real charts while the stroke keeps its width.
export default {
  name: 'SkeletonWave',
  props: {
    /** full waves across the width */
    cycles: { type: Number, default: 2 },
    /** crest and trough as fractions of the height (0 = top) */
    top: { type: Number, default: 0.24 },
    bottom: { type: Number, default: 0.76 }
  },
  computed: {
    path() {
      const mid = ((this.top + this.bottom) / 2) * 100
      const amp = ((this.bottom - this.top) / 2) * 100
      let d = ''
      for (let i = 0; i <= 96; i++) {
        const f = i / 96
        const y = mid - Math.cos(f * Math.PI * 2 * this.cycles + 0.6) * amp
        d += `${i ? ' L' : 'M'}${(f * 1000).toFixed(1)},${y.toFixed(1)}`
      }
      return d
    }
  }
}
</script>
