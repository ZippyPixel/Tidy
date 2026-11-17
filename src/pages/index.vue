<template>
  <!-- home: V3 12-column grid. Source order is the phone order; md+ re-places cards.
       base  Current → Hourly → Forecast → Sun & Moon → What to wear → Details → Tides
       md    Current → Forecast → Hourly → Sun & Moon → What to wear → Tides (details move
             into Current)
       lg    Current / Forecast in cols 1–7, Sun & Moon cols 8–12 over both rows; row 3 is
             Hourly (cols 1–7) and What to wear under Sun & Moon, at Hourly's height; Tides
             full width below. xl is the same on an 8 / 4 split -->
  <div>
    <!-- one announcement for the whole dashboard; each card marks itself aria-busy -->
    <p role="status" class="sr-only">{{ showSkeleton ? $t('loading.weather') : '' }}</p>
    <LocationHeading />
    <div class="grid grid-cols-12 items-stretch gap-4 md:gap-6">
      <BasicWeatherInfo class="col-span-12 row-start-1 lg:col-span-7 xl:col-span-8" />
      <DailyChart class="col-span-12 row-start-2 md:row-start-3 lg:col-span-7 xl:col-span-8" />
      <WeatherForecast class="col-span-12 row-start-3 md:row-start-2 lg:col-span-7 xl:col-span-8" />
      <PlanetaryInfo
        class="col-span-12 row-start-4 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 xl:col-span-4 xl:col-start-9"
      />
      <WearCard
        class="col-span-12 row-start-5 h-[300px] md:h-[340px] lg:col-span-5 lg:col-start-8 lg:row-start-3 lg:h-auto xl:col-span-4 xl:col-start-9"
      />
      <DashboardCard
        :title="$t('weather.details')"
        :busy="showSkeleton"
        class="col-span-12 row-start-6 md:hidden"
      >
        <WeatherDetails variant="tiles" />
      </DashboardCard>
      <TidesCard class="col-span-12 row-start-7 md:row-start-6 lg:row-start-4" />
    </div>
  </div>
</template>

<script>
import DailyChart from '@/components/weather/DailyChart.vue'
import BasicWeatherInfo from '@/components/weather/BasicWeatherInfo.vue'
import WeatherForecast from '@/components/weather/WeatherForecast.vue'
import PlanetaryInfo from '@/components/weather/PlanetaryInfo.vue'
import LocationHeading from '@/components/weather/LocationHeading.vue'
import WeatherDetails from '@/components/weather/WeatherDetails.vue'
import DashboardCard from '@/components/common/DashboardCard.vue'
import TidesCard from '@/components/tides/TidesCard.vue'
import WearCard from '@/components/wear/WearCard.vue'
import { useWeatherSkeleton } from '@/composables/useSkeletonGate'

export default {
  name: 'HomeView',
  components: {
    DailyChart,
    BasicWeatherInfo,
    WeatherForecast,
    PlanetaryInfo,
    LocationHeading,
    WeatherDetails,
    DashboardCard,
    TidesCard,
    WearCard
  },
  setup() {
    return useWeatherSkeleton()
  }
}
</script>
