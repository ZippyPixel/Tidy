<template>
  <NuxtLink
    to="/sun-moon"
    data-sun-moon-link
    :aria-busy="loading ? 'true' : undefined"
    class="flex w-full min-w-0 flex-col gap-4 rounded-card border bg-card p-4 text-card-foreground outline-ring transition-[border-color] duration-[120ms] ease-linear hover:border-input focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:shadow-[inset_0_0_0_999px_hsl(var(--foreground)/0.03)] md:p-6 lg:h-full"
  >
    <!-- design/TidySunMoon: the whole card is one link to /sun-moon, with the Tides card's hover.
         Groups stack on phones, sit side by side on md (all four times on one row), and stack
         again in the lg+ right column, where the arcs grow to fill the card. -->
    <div class="flex min-h-6 items-center justify-between gap-3">
      <h2 class="text-sm font-medium leading-6 text-muted-foreground">{{ $t('astro.title') }}</h2>
      <span
        class="flex flex-none items-center gap-0.5 text-[13px] font-medium leading-4 text-muted-foreground"
      >
        <span>{{ $t('astro.details') }}</span>
        <AppIcon name="chevron-right" :size="18" class="flex-none" />
      </span>
    </div>
    <div
      class="flex flex-col gap-6 md:flex-row md:gap-8 lg:flex-1 lg:flex-col lg:gap-6"
      :class="fadeClass"
    >
      <SunArc :astro="astro" :next-astro="nextAstro" :now="now" :loading="loading" />
      <MoonArc :astro="astro" :next-astro="nextAstro" :now="now" :loading="loading" />
    </div>
  </NuxtLink>
</template>

<script>
import { mapState } from 'pinia'
import useWeatherStore from '@/stores/weather'
import AppIcon from '@/components/common/AppIcon.vue'
import { locationClock } from '@/utils/astro'
import SunArc from './SunArc.vue'
import MoonArc from './MoonArc.vue'
import { useWeatherSkeleton } from '@/composables/useSkeletonGate'

export default {
  name: 'PlanetaryInfo',
  components: { AppIcon, SunArc, MoonArc },
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
