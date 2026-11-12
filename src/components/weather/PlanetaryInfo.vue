<template>
  <DashboardCard :title="$t('astro.title')" :busy="loading" class="lg:h-full">
    <!-- design/TidySunMoon. Groups stack on phones, sit side by side on md (all four
         times on one row), and stack again in the lg+ right column, where the arcs
         grow to fill the card. -->
    <div class="flex flex-col gap-6 md:flex-row md:gap-8 lg:flex-1 lg:flex-col lg:gap-6" :class="fadeClass">
      <SunArc :astro="astro" :next-astro="nextAstro" :now="now" :loading="loading" />
      <MoonArc :astro="astro" :next-astro="nextAstro" :now="now" :loading="loading" />
    </div>
  </DashboardCard>
</template>

<script>
import { mapState } from 'pinia'
import useWeatherStore from '@/stores/weather'
import DashboardCard from '@/components/common/DashboardCard.vue'
import { locationClock } from '@/utils/astro'
import SunArc from './SunArc.vue'
import MoonArc from './MoonArc.vue'
import { useWeatherSkeleton } from '@/composables/useSkeletonGate'

export default {
  name: 'PlanetaryInfo',
  components: { DashboardCard, SunArc, MoonArc },
  setup() {
    return useWeatherSkeleton()
  },
  data() {
    return { nowMs: Date.now(), clockTimer: null }
  },
  computed: {
    ...mapState(useWeatherStore, ['astro', 'forecast', 'date', 'today', 'zoneOffsetMs']),
    loading() {
      return this.showSkeleton
    },
    nextAstro() {
      const i = this.forecast.findIndex((d) => d.date === this.date)
      return i === -1 ? null : this.forecast[i + 1]?.astro ?? null
    },
    // minutes since the city's midnight, only when looking at today; past the
    // city's midnight (stale data) it keeps counting from today's start
    now() {
      if (!this.date || this.date !== this.today) return null
      const clock = locationClock(this.zoneOffsetMs, this.nowMs)
      return clock.date > this.today ? clock.minutes + 1440 : clock.minutes
    }
  },
  mounted() {
    this.clockTimer = setInterval(() => (this.nowMs = Date.now()), 60000)
  },
  beforeUnmount() {
    clearInterval(this.clockTimer)
  }
}
</script>
