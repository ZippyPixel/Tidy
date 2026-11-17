<template>
  <!-- an SVG fragment: the moon's phase lit on the right, turned so the lit edge faces the
       sun as seen from here (utils/sky moonTilt). Put it inside an <svg>. -->
  <g :transform="`rotate(${(tilt - 90).toFixed(1)})`">
    <circle :r="r" class="fill-moon-shadow" />
    <path :d="lit" class="fill-moon-lit" />
  </g>
</template>

<script>
import { moonLitPath } from '@/utils/astro'

export default {
  name: 'MoonGlyph',
  props: {
    r: { type: Number, required: true },
    /** lit fraction 0–1 */
    k: { type: Number, required: true },
    /** bearing of the lit edge, clockwise from straight up */
    tilt: { type: Number, default: 90 },
    /** a sliver is always drawn so a new moon still reads as a moon */
    min: { type: Number, default: 0.03 }
  },
  computed: {
    lit() {
      return moonLitPath(this.r, Math.max(this.min, this.k), true)
    }
  }
}
</script>
