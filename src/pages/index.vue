<template>
  <!-- home: V3 12-column grid. Source order is the phone order; md+ re-places cards.
       base  Current → Hourly → Forecast → Sun & Moon → Details
       md    Current → Forecast → Hourly → Sun & Moon (details move into Current)
       lg    Current / Forecast in cols 1–7, Sun & Moon cols 8–12 over both rows,
             Hourly full width below; xl is the same on an 8 / 4 split -->
  <div>
    <LocationHeading />
    <div class="grid grid-cols-12 items-stretch gap-4 md:gap-6">
      <BasicWeatherInfo class="col-span-12 row-start-1 lg:col-span-7 xl:col-span-8" />
      <DailyChart class="col-span-12 row-start-2 md:row-start-3" />
      <WeatherForecast
        class="col-span-12 row-start-3 md:row-start-2 lg:col-span-7 xl:col-span-8"
      />
      <PlanetaryInfo
        class="col-span-12 row-start-4 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 xl:col-span-4 xl:col-start-9"
      />
    </div>
  </div>
</template>

<script>
import DailyChart from '@/components/weather/DailyChart.vue'
import BasicWeatherInfo from '@/components/weather/BasicWeatherInfo.vue'
import WeatherForecast from '@/components/weather/WeatherForecast.vue'
import PlanetaryInfo from '@/components/weather/PlanetaryInfo.vue'
import LocationHeading from '@/components/weather/LocationHeading.vue'

export default {
  name: 'HomeView',
  components: { DailyChart, BasicWeatherInfo, WeatherForecast, PlanetaryInfo, LocationHeading }
}
</script>
