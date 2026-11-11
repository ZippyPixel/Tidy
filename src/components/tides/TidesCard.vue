<template>
  <NuxtLink
    to="/tides"
    :aria-label="ariaLabel"
    :aria-busy="loading ? 'true' : undefined"
    class="flex w-full min-w-0 flex-col gap-4 rounded-card border bg-card p-4 text-card-foreground outline-ring transition-[border-color] duration-[120ms] ease-linear hover:border-input focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:shadow-[inset_0_0_0_999px_hsl(var(--foreground)/0.03)] md:p-6"
  >
    <!-- design/TidyTidesCard: the whole card is one link, so nothing inside is interactive -->
    <div class="flex min-h-6 items-center justify-between gap-3">
      <h2 class="text-sm font-medium leading-6 text-muted-foreground">{{ $t('tides.title') }}</h2>
      <span class="flex min-w-0 items-center gap-0.5 text-[13px] font-medium leading-4 text-muted-foreground">
        <Skeleton v-if="loading" class="h-3 w-[150px]" />
        <span v-else data-station-line class="truncate" :class="fadeClass">{{ stationLine }}</span>
        <AppIcon name="chevron-right" :size="18" class="flex-none" />
      </span>
    </div>

    <template v-if="state === 'live'">
      <div :class="fadeClass" class="flex flex-col gap-5 md:grid md:grid-cols-[minmax(200px,248px)_minmax(0,1fr)] md:items-center md:gap-8">
        <div class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 md:flex md:flex-col md:items-stretch md:gap-5">
          <div class="flex min-w-0 items-center gap-4">
            <TideGauge :fraction="gauge" class="h-[92px] w-7 md:h-28" />
            <div class="flex min-w-0 flex-col gap-1">
              <TideTrend :rising="rising" class="text-sm leading-5" />
              <!-- prettier-ignore -->
              <span data-level class="whitespace-nowrap text-[40px] font-light leading-none tracking-[-0.03em] tabular-nums md:text-[44px]">{{ tideHeight(level) }}<span class="text-xl font-normal tracking-normal text-muted-foreground">{{ ' ' + tideUnit }}</span></span>
              <span class="whitespace-nowrap text-[13px] leading-4 tabular-nums text-muted-foreground">
                {{ $t('tides.nowAt', { time: tideClock(now, zone) }) }}
              </span>
            </div>
          </div>
          <div
            v-if="next"
            data-next
            class="flex flex-col items-end gap-0.5 text-right md:items-start md:border-t md:pt-4 md:text-left"
          >
            <span class="text-[13px] leading-4 text-muted-foreground">{{ $t(next.high ? 'tides.nextHigh' : 'tides.nextLow') }}</span>
            <span class="whitespace-nowrap text-xl font-semibold leading-7 tabular-nums">{{ tideClock(next.time, zone) }}</span>
            <span class="whitespace-nowrap text-[13px] leading-[18px] tabular-nums text-muted-foreground">
              {{ $t('tides.heightIn', { height: tideHeight(next.level), unit: tideUnit, duration: tideDuration(next.time - now) }) }}
            </span>
          </div>
        </div>
        <div class="min-w-0">
          <TideChart :tides="tides" view="card" :now="now" :interactive="false" />
        </div>
      </div>
      <div v-if="inland" data-inland class="flex items-start gap-2 text-[13px] leading-[18px] text-muted-foreground [text-wrap:pretty]">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          class="mt-px size-4 flex-none"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <span>{{ $t('tides.inland', { place: coords?.name, name: station.name, km: formatNumber(station.distanceKm) }) }}</span>
      </div>
    </template>

    <template v-else-if="state === 'none' || state === 'error'">
      <div class="flex items-center gap-4">
        <svg viewBox="0 0 48 48" aria-hidden="true" class="size-12 flex-none fill-none stroke-muted-foreground" stroke-width="2" stroke-linecap="round">
          <path d="M4 20c5 0 5-4 10-4s5 4 10 4 5-4 10-4 5 4 10 4" />
          <path d="M4 30c5 0 5-4 10-4s5 4 10 4 5-4 10-4 5 4 10 4" opacity="0.5" />
        </svg>
        <div class="flex min-w-0 flex-col gap-1">
          <span class="text-base font-semibold leading-6">{{ $t(state === 'none' ? 'tides.none.title' : 'tides.empty.errorTitle') }}</span>
          <span class="text-sm leading-5 text-muted-foreground [text-wrap:pretty]">{{ $t(state === 'none' ? 'tides.none.body' : 'tides.empty.errorBody') }}</span>
        </div>
      </div>
      <span v-if="state === 'none'" class="text-sm font-semibold leading-5 text-primary">{{ $t('tides.none.cta') }}</span>
    </template>

    <!-- skeleton (design/TidySkeleton tidescard): the live layout's grid and heights -->
    <div
      v-else
      data-loading
      data-skeleton
      class="flex flex-col gap-5 md:grid md:grid-cols-[minmax(200px,248px)_minmax(0,1fr)] md:items-center md:gap-8"
      aria-hidden="true"
    >
      <div class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 md:flex md:flex-col md:items-stretch md:gap-5">
        <div class="flex min-w-0 items-center gap-4">
          <Skeleton class="h-[92px] w-7 rounded-[14px] md:h-28" />
          <div class="flex min-w-0 flex-col gap-2.5">
            <Skeleton class="h-3 w-16" />
            <Skeleton class="h-[30px] w-24 rounded-md md:h-[34px] md:w-[110px]" />
            <Skeleton class="h-2.5 w-20 md:w-[84px]" />
          </div>
        </div>
        <div class="flex flex-col items-end gap-2 md:items-start md:border-t md:pt-4">
          <Skeleton class="h-2.5 w-[88px] md:w-24" />
          <Skeleton class="h-[18px] w-[72px] md:h-5 md:w-[76px]" />
          <Skeleton class="h-2.5 w-[104px] md:w-32" />
        </div>
      </div>
      <SkeletonWave :top="0.24" :bottom="0.75" class="h-[200px] md:h-[212px]" />
    </div>
  </NuxtLink>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import AppIcon from '@/components/common/AppIcon.vue'
import TideChart from '@/components/tides/TideChart.vue'
import TideGauge from '@/components/tides/TideGauge.vue'
import TideTrend from '@/components/tides/TideTrend.vue'
import tideMixin from '@/mixins/tideMixin'
import tideNow from '@/mixins/tideNow'
import weatherMixin from '@/mixins/weatherMixin'
import useTidesStore from '@/stores/tides'
import useWeatherStore from '@/stores/weather'
import { Skeleton } from '@/components/ui/skeleton'
import SkeletonWave from '@/components/skeletons/SkeletonWave.vue'
import { useSkeletonGate } from '@/composables/useSkeletonGate'
import { gaugeFraction, isInland, isRising, levelAt, nextExtreme } from '@/utils/tides'

export default {
  name: 'TidesCard',
  components: { AppIcon, Skeleton, SkeletonWave, TideChart, TideGauge, TideTrend },
  mixins: [weatherMixin, tideMixin, tideNow],
  setup() {
    const weather = useWeatherStore()
    const tides = useTidesStore()
    // the nearest station waits on the forecast's coordinates, then on its own request
    return useSkeletonGate(() => weather.weatherPending || (!tides.nearest.data && tides.nearest.status !== 'error'))
  },
  computed: {
    ...mapStores(useTidesStore),
    ...mapState(useWeatherStore, ['coords']),
    tides() {
      return this.tidesStore.nearest.data
    },
    station() {
      return this.tides?.station ?? null
    },
    state() {
      if (this.loading) return 'loading'
      if (this.station) return 'live'
      if (this.tides) return 'none'
      return 'error'
    },
    loading() {
      return this.showSkeleton
    },
    zone() {
      return this.station.timezone
    },
    level() {
      return levelAt(this.tides, this.now)
    },
    rising() {
      return isRising(this.tides, this.now)
    },
    next() {
      return nextExtreme(this.tides, this.now)
    },
    gauge() {
      return gaugeFraction(this.tides, this.now)
    },
    inland() {
      return isInland(this.station)
    },
    stationLine() {
      if (!this.station) return this.$t('tides.tideTimes')
      if (!this.inland) return this.station.name
      return this.$t('tides.stationLine', { name: this.station.name, km: this.formatNumber(this.station.distanceKm) })
    },
    ariaLabel() {
      if (this.state !== 'live') return this.$t('tides.openLabel')
      const next = this.next
        ? this.$t(this.next.high ? 'tides.nextHighAt' : 'tides.nextLowAt', { time: this.tideClock(this.next.time, this.zone) })
        : ''
      return this.$t('tides.cardLabel', {
        name: this.station.name,
        trend: this.$t(this.rising ? 'tides.rising' : 'tides.falling').toLocaleLowerCase(),
        level: this.tideHeight(this.level),
        unit: this.$t(this.unit === 'celsius' ? 'tides.metres' : 'tides.feet'),
        next
      })
    }
  },
  watch: {
    coords: {
      immediate: true,
      handler(coords) {
        this.tidesStore.loadNearest(coords)
      }
    }
  }
}
</script>
