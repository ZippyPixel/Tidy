<template>
  <CelestialArc
    :title="$t('planetary.moonriseMoonset')"
    :rise-time="riseTime"
    :set-time="setTime"
    :progress="progress"
  >
    <defs>
      <radialGradient id="grad-moon" cx="35%" cy="28%" r="85%">
        <stop offset="0" stop-color="#94a3b4" />
        <stop offset="1" stop-color="#5b6b7a" />
      </radialGradient>
    </defs>
    <g class="moon-body">
      <circle r="7.5" fill="url(#grad-moon)" />
      <circle cx="2.5" cy="-1.6" r="1.5" fill="#46545f" opacity="0.5" />
      <circle cx="-1.6" cy="2.1" r="1.05" fill="#46545f" opacity="0.45" />
      <circle cx="1.15" cy="3" r="0.8" fill="#46545f" opacity="0.4" />
    </g>
  </CelestialArc>
</template>

<script>
import { mapState } from 'pinia'
import useWeatherStore from '@/stores/weather'
import { currentIntlTag } from '@/i18n'
import { progressBetween, formatAstroTime } from '@/utils/astro'
import CelestialArc from './CelestialArc.vue'

export default {
  name: 'MoonArc',
  components: { CelestialArc },
  computed: {
    ...mapState(useWeatherStore, ['astro']),
    progress() {
      const a = this.astro || {}
      return progressBetween(a.moonrise, a.moonset)
    },
    riseTime() {
      return formatAstroTime((this.astro || {}).moonrise, currentIntlTag())
    },
    setTime() {
      return formatAstroTime((this.astro || {}).moonset, currentIntlTag())
    }
  }
}
</script>

<style scoped>
.moon-body {
  transform-box: fill-box;
  transform-origin: center;
}

@media (prefers-reduced-motion: no-preference) {
  .moon-body {
    animation: float 4.5s ease-in-out infinite;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-1.5px);
  }
}
</style>
