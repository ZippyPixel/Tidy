<template>
  <DashboardCard :title="$t('weather.currentConditions')" :busy="showSkeleton">
    <div class="flex flex-col gap-4 md:gap-6">
      <!-- one markup, two arrangements:
           phone  temp+condition beside a 128×96 icon, then feels/rain, then the range bar
           md+    every line in a left column beside a 256×192 icon -->
      <div
        :class="fadeClass"
        class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 [grid-template-areas:'temp_media'_'cond_media'_'feels_feels'_'range_range'] md:gap-x-6 md:[grid-template-areas:'temp_media'_'cond_media'_'feels_media'_'range_media']"
      >
        <!-- skeleton: the same grid areas, each block on the loaded line's height -->
        <template v-if="showSkeleton">
          <div
            data-skeleton
            class="text-[clamp(4rem,2.75rem+5vw,5.75rem)] leading-[0.87] [grid-area:temp]"
          >
            <Skeleton class="h-[0.87em] w-[1.25em] rounded-xl" />
          </div>
          <div class="py-1 [grid-area:cond] md:py-1.5">
            <Skeleton class="h-4 w-[150px] max-w-full md:w-[190px]" />
          </div>
          <div class="mt-2 py-1 [grid-area:feels] md:mt-0">
            <Skeleton class="h-3 w-[200px] max-w-full md:w-[230px]" />
          </div>
          <div class="mt-2 flex h-5 items-center [grid-area:range] md:max-w-[360px]">
            <Skeleton class="h-1.5 w-full rounded-[3px]" />
          </div>
          <div
            class="flex h-24 w-32 items-center justify-center self-center [grid-area:media] md:h-48 md:w-64"
          >
            <Skeleton
              class="h-24 w-32 rounded-[28px] md:h-[150px] md:w-[200px] md:rounded-[40px] lg:h-48 lg:w-64"
            />
          </div>
        </template>
        <template v-else>
          <p
            class="-ml-[0.055em] text-[clamp(4rem,2.75rem+5vw,5.75rem)] font-light leading-[0.87] tracking-[-0.04em] tabular-nums [grid-area:temp]"
          >
            {{ temperature.avgTemp }}
          </p>
          <p class="text-lg font-medium leading-6 [grid-area:cond] md:text-xl md:leading-7">
            {{ condition }}
          </p>

          <div
            class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] leading-5 tabular-nums [grid-area:feels] md:mt-0"
          >
            <span class="text-muted-foreground">{{
              $t('weather.feelsLike', { temp: temperature.feelsLike })
            }}</span>
            <span
              v-if="chanceOfRain"
              class="flex items-center gap-1 font-semibold text-rain"
              :title="$t('weather.chanceOfRain')"
            >
              <AppIcon name="droplet" :size="15" />
              <span class="sr-only">{{ $t('weather.chanceOfRain') }}</span>
              <span>{{ chanceOfRain }}</span>
            </span>
          </div>

          <div
            class="mt-2 flex items-center gap-2 text-[15px] font-medium leading-5 tabular-nums [grid-area:range] md:max-w-[360px]"
          >
            <span class="flex items-center gap-1">
              <AppIcon name="arrow-down" :size="14" class="text-muted-foreground" />
              <span class="sr-only">{{ $t('weather.low') }}</span>
              <span>{{ temperature.minTemp }}</span>
            </span>
            <div
              class="relative h-1.5 min-w-12 flex-1 rounded-full bg-primary"
              role="img"
              :aria-label="nowPosition === null ? undefined : $t('weather.nowBetween')"
            >
              <span
                v-if="nowPosition !== null"
                class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-primary bg-card"
                :style="{ left: `${nowPosition}%` }"
              />
            </div>
            <span class="flex items-center gap-1">
              <AppIcon name="arrow-up" :size="14" class="text-muted-foreground" />
              <span class="sr-only">{{ $t('weather.high') }}</span>
              <span>{{ temperature.maxTemp }}</span>
            </span>
          </div>

          <!-- illustration slot: 128×96 phone, 256×192 md+ (4:3) -->
          <div
            class="flex h-24 w-32 items-center justify-center self-center [grid-area:media] md:h-48 md:w-64"
          >
            <img
              v-if="conditionCode"
              class="max-h-full max-w-full object-contain"
              :src="weatherIcon"
              :alt="condition"
            />
          </div>
        </template>
      </div>

      <WeatherDetails variant="row" class="hidden md:grid" />
    </div>
  </DashboardCard>
</template>

<script>
import { mapState } from 'pinia'
import useWeatherStore from '@/stores/weather'
import AppIcon from '@/components/common/AppIcon.vue'
import DashboardCard from '@/components/common/DashboardCard.vue'
import WeatherDetails from '@/components/weather/WeatherDetails.vue'
import { getWeatherIcon } from '@/constants/weatherIcons'
import { Skeleton } from '@/components/ui/skeleton'
import { useWeatherSkeleton } from '@/composables/useSkeletonGate'

export default {
  name: 'BasicWeatherInfo',
  components: {
    AppIcon,
    DashboardCard,
    WeatherDetails,
    Skeleton
  },
  setup() {
    return useWeatherSkeleton()
  },
  computed: {
    ...mapState(useWeatherStore, [
      'chanceOfRain',
      'condition',
      'conditionCode',
      'isDay',
      'temperature',
      'rawTemperature',
      'date',
      'today'
    ]),
    weatherIcon() {
      return getWeatherIcon(this.conditionCode, this.isDay === 1)
    },
    // where the current reading sits between the day's low and high (0–100), only
    // meaningful for today; unit-independent because it uses the raw °C values
    nowPosition() {
      const { avgTemp_c: now, minTemp_c: lo, maxTemp_c: hi } = this.rawTemperature || {}
      if (this.date !== this.today || [now, lo, hi].some((v) => typeof v !== 'number')) return null
      if (hi <= lo) return 50
      return Math.max(0, Math.min(100, ((now - lo) / (hi - lo)) * 100))
    }
  }
}
</script>
