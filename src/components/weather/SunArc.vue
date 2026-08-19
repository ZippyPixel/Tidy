<template>
  <CelestialArc
    :title="$t('planetary.sunriseSunset')"
    :rise-time="riseTime"
    :set-time="setTime"
    :progress="progress"
  >
    <defs>
      <radialGradient id="grad-sun" cx="35%" cy="30%" r="75%">
        <stop offset="0" stop-color="#ffe08a" />
        <stop offset="1" stop-color="#f5a623" />
      </radialGradient>
    </defs>
    <circle class="glow" r="7" fill="#f5a623" opacity="0.25" />
    <g class="rays">
      <line
        v-for="n in 8"
        :key="n"
        x1="0"
        y1="-7.5"
        x2="0"
        y2="-10"
        :transform="`rotate(${n * 45})`"
        stroke="#f5a623"
        stroke-width="1.4"
        stroke-linecap="round"
      />
    </g>
    <circle r="5" fill="url(#grad-sun)" />
  </CelestialArc>
</template>

<script>
import { mapState } from 'pinia'
import useWeatherStore from '@/stores/weather'
import { currentIntlTag } from '@/i18n'
import { progressBetween, formatAstroTime } from '@/utils/astro'
import CelestialArc from './CelestialArc.vue'

export default {
  name: 'SunArc',
  components: { CelestialArc },
  computed: {
    ...mapState(useWeatherStore, ['astro']),
    progress() {
      const a = this.astro || {}
      return progressBetween(a.sunrise, a.sunset)
    },
    riseTime() {
      return formatAstroTime((this.astro || {}).sunrise, currentIntlTag())
    },
    setTime() {
      return formatAstroTime((this.astro || {}).sunset, currentIntlTag())
    }
  }
}
</script>

<style scoped>
.glow,
.rays {
  transform-box: fill-box;
  transform-origin: center;
}

@media (prefers-reduced-motion: no-preference) {
  .rays {
    animation: spin 26s linear infinite;
  }
  .glow {
    animation: glow 3.2s ease-in-out infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes glow {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.22;
  }
  50% {
    transform: scale(1.28);
    opacity: 0.4;
  }
}
</style>
