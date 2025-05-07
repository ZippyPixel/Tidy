<template>
  <!-- home -->
  <div class="w-[92rem] h-max mx-auto flex flex-row items-baseline justify-between">
    <!-- weather-info -->
    <div class="w-[65rem] h-auto flex flex-col items-end justify-between">
      <div class="w-full flex flex-row items-end justify-between">
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
  components: { DailyChart, BasicWeatherInfo, WeatherForecast, PlanetaryInfo },
}
</script>
