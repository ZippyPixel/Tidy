<template>
  <div
    class="pointer-events-none absolute inset-0 overflow-hidden"
    :style="{ background: sc.css }"
    aria-hidden="true"
  >
    <!-- design/TidyWearScene: one street, recoloured by time of day. Fixed colours: the scene
         ignores the theme (only the glass panels over it follow the card tokens). Anchored at
         the bottom so the road band (the scene's bottom tenth) is always where the feet go. -->
    <svg
      viewBox="0 0 400 300"
      :preserveAspectRatio="align === 'center' ? 'xMidYMid slice' : 'xMidYMax slice'"
      class="absolute inset-0 h-full w-full"
    >
      <path
        v-for="(l, i) in sc.layers"
        :key="i"
        :d="l.d"
        :fill="l.fill"
        :stroke="l.stroke"
        :stroke-width="l.stroke ? l.sw : undefined"
        :opacity="l.o"
      />
    </svg>
  </div>
</template>

<script>
import { scene } from '@/utils/wear'

export default {
  name: 'WearScene',
  props: {
    tod: { type: String, default: 'day' },
    cloudy: { type: Boolean, default: false },
    align: { type: String, default: 'bottom' }
  },
  computed: {
    sc() {
      return scene(this.tod, { cloudy: this.cloudy })
    }
  }
}
</script>
