<template>
  <svg
    :viewBox="viewBox"
    :preserveAspectRatio="sliced ? 'xMidYMid slice' : 'xMidYMid meet'"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
    class="block h-full w-full"
    :class="sliced ? 'overflow-hidden' : 'overflow-visible'"
  >
    <!-- design/TidyWearFigure: the outfit as flat layers, back to front. crop="slot" frames one
         slot (the list thumbnails). -->
    <ellipse
      v-if="shadow && !sliced"
      cx="120"
      :cy="fig.ground"
      rx="60"
      ry="7"
      fill="rgba(10,20,40,0.16)"
    />
    <path
      v-for="(l, i) in fig.layers"
      :key="i"
      :d="l.d"
      :fill="l.fill"
      :stroke="l.stroke"
      :stroke-width="l.stroke ? l.sw : undefined"
      :stroke-linecap="l.cap || (l.stroke ? 'round' : undefined)"
      stroke-linejoin="round"
      :stroke-dasharray="l.dash"
      :fill-rule="l.rule"
      :opacity="l.o"
    />
  </svg>
</template>

<script>
import { figure } from '@/utils/wear'

// square windows onto one slot, for the list thumbnails
const CROP = {
  head: '56 -2 128 128',
  eyes: '72 46 96 96',
  top: '52 104 136 136',
  outer: '44 100 152 152',
  neck: '64 82 112 112',
  hands: '134 226 72 72',
  bottom: '56 222 128 128',
  feet: '66 350 108 108',
  held: '16 -44 208 208'
}
const PLAIN = { top: 'tee', bottom: 'trousers', feet: 'sneakers', tone: 'mid' }

export default {
  name: 'WearFigure',
  props: {
    outfit: { type: Object, default: null },
    figure: { type: String, default: 'man' },
    // one slot to draw on its own
    only: { type: String, default: '' },
    crop: { type: String, default: 'full' },
    shadow: { type: Boolean, default: true },
    // set to make the figure an img with this name; otherwise it is decorative
    label: { type: String, default: '' }
  },
  computed: {
    fig() {
      return figure(this.outfit || PLAIN, {
        figure: this.figure === 'woman' ? 'woman' : 'man',
        only: this.only || null
      })
    },
    sliced() {
      return this.crop === 'slot' && !!this.only
    },
    viewBox() {
      return this.sliced ? CROP[this.only] || this.fig.viewBox : this.fig.viewBox
    }
  }
}
</script>
