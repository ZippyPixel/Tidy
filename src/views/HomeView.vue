<template>
  <!-- home -->
  <div
    class="container w-full h-max mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 px-4 pt-4"
  >
    <!-- weather-info -->
    <div class="w-full lg:flex-1 h-auto flex flex-col items-center lg:items-end justify-between">
      <div class="w-full flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
        <BasicWeatherInfo />
        <PlanetaryInfo />
      </div>
      <DailyChart />
    </div>
    <WeatherForecast />
  </div>
</template>

<script>
import DailyChart from '@/components/weather/DailyChart.vue'
import BasicWeatherInfo from '@/components/weather/BasicWeatherInfo.vue'
import WeatherForecast from '@/components/weather/WeatherForecast.vue'
import PlanetaryInfo from '@/components/weather/PlanetaryInfo.vue'

export default {
  name: 'HomeView',
  components: { DailyChart, BasicWeatherInfo, WeatherForecast, PlanetaryInfo }
}
</script>
