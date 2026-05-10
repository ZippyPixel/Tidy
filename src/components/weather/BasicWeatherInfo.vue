<template>
  <div class="flex-column w-[40rem]">
    <!-- location-time -->
    <div class="w-full flex flex-row justify-between items-end">
      <div class="w-fit">
        <p class="text-gray-500 dark:text-night-muted">Current Location</p>
        <p class="text-slate-800 dark:text-night-text font-medium text-2xl">{{ location }}</p>
      </div>
      <div class="w-fit">
        <p class="text-gray-500 dark:text-night-muted">{{ day }}</p>
      </div>
    </div>
    <!-- info -->
    <div
      class="w-full h-80 mt-3 drop-shadow-xl bg-white dark:bg-night-surface rounded-3xl flex flex-col justify-around relative"
    >
      <!-- chance of rain -->
      <div
        class="w-24 absolute top-2.5 right-2.5 py-1 px-3 bg-gray-50 dark:bg-night-bg drop-shadow-sm rounded-3xl flex flex-row justify-between items-center"
      >
        <AppIcon name="rainy" :size="20" class="text-blue-500 dark:text-night-muted" />
        <p class="float-right">{{ chanceOfRain }}</p>
      </div>
      <div class="w-[90%] h-full mx-auto flex flex-col justify-around">
        <!-- top -->
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="flex flex-row items-center mr-5">
              <div class="pr-5 flex flex-col">
                <p class="text-8xl font-black">{{ temperature.avgTemp }}</p>
                <div class="flex flex-row justify-between">
                  <div class="flex flex-row">
                    <img src="@/assets/icons/mdi_arrow-up.svg" alt="" />
                    <p>{{ temperature.maxTemp }}C</p>
                  </div>
                  <div class="flex flex-row">
                    <img src="@/assets/icons/mdi_arrow-down.svg" alt="" />
                    <p>{{ temperature.minTemp }}C</p>
                  </div>
                </div>
              </div>
              <div>
                <p class="mb-2 font-normal text-2xl">{{ condition }}</p>
                <p>Feels like {{ temperature.feelsLike }}</p>
              </div>
            </div>
          </div>
          <div>
            <img class="w-[80%] float-right" src="@/assets/icons/weather-icon.svg" alt="" />
          </div>
        </div>
        <!-- bottom -->
        <div class="flex flex-row justify-between">
          <div class="flex flex-col">
            <p class="text-xs font-regular text-gray-500 dark:text-night-muted">Humidity</p>
            <p class="text-md font-regular text-black dark:text-night-text">
              {{ basicWeatherInfo.humidity }}%
            </p>
          </div>
          <div class="flex flex-col">
            <p class="text-xs font-regular text-gray-500 dark:text-night-muted">Visibility</p>
            <p class="text-md font-regular text-black dark:text-night-text">
              {{ basicWeatherInfo.visibility }} km
            </p>
          </div>
          <div class="flex flex-col">
            <p class="text-xs font-regular text-gray-500 dark:text-night-muted">Pressure</p>
            <p class="text-md font-regular text-black dark:text-night-text">
              {{ basicWeatherInfo.pressure }} hPa
            </p>
          </div>
          <div class="flex flex-col">
            <p class="text-xs font-regular text-gray-500 dark:text-night-muted">UV</p>
            <p class="text-md font-regular text-black dark:text-night-text">
              {{ basicWeatherInfo.uv }}
            </p>
          </div>
          <div class="flex flex-col">
            <p class="text-xs font-regular text-gray-500 dark:text-night-muted">Air Quality</p>
            <p class="text-md font-regular text-black dark:text-night-text">
              {{ basicWeatherInfo.airQuality }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import useWeatherStore from '@/stores/weather'
import AppIcon from '@/components/common/AppIcon.vue'

export default {
  name: 'BasicWeatherInfo',
  components: {
    AppIcon
  },
  computed: {
    ...mapState(useWeatherStore, [
      'location',
      'day',
      'chanceOfRain',
      'condition',
      'basicWeatherInfo',
      'temperature'
    ])
  }
}
</script>
