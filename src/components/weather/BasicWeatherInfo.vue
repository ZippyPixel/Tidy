<template>
  <div class="flex-column w-full lg:max-w-[40rem]">
    <!-- location-time -->
    <div class="w-full flex flex-row justify-between items-end mb-2">
      <div class="w-fit">
        <p class="text-gray-500 dark:text-night-muted text-sm md:text-base">Current Location</p>
        <p class="text-slate-800 dark:text-night-text font-medium text-xl md:text-2xl">{{ location }}</p>
      </div>
      <div class="w-fit">
        <p class="text-gray-500 dark:text-night-muted text-sm md:text-base">{{ day }}</p>
      </div>
    </div>
    <!-- info -->
    <div
      class="w-full h-auto min-h-[20rem] py-6 drop-shadow-xl bg-white dark:bg-night-surface rounded-3xl flex flex-col justify-around relative"
    >
      <!-- chance of rain -->
      <div
        class="w-20 md:w-24 absolute top-2.5 right-2.5 py-1 px-3 bg-gray-50 dark:bg-night-bg drop-shadow-sm rounded-3xl flex flex-row justify-between items-center"
      >
        <AppIcon name="rainy" :size="18" class="text-blue-500 dark:text-night-muted" />
        <p class="text-sm md:text-base">{{ chanceOfRain }}</p>
      </div>
      <div class="w-[90%] h-full mx-auto flex flex-col justify-around gap-6">
        <!-- top -->
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="flex flex-row items-center">
              <div class="pr-4 md:pr-5 flex flex-col">
                <p class="text-6xl md:text-8xl font-black">{{ temperature.avgTemp }}</p>
                <div class="flex flex-row justify-between text-sm md:text-base">
                  <div class="flex flex-row mr-2">
                    <img src="@/assets/icons/mdi_arrow-up.svg" alt="" class="w-4 md:w-5" />
                    <p>{{ temperature.maxTemp }}C</p>
                  </div>
                  <div class="flex flex-row">
                    <img src="@/assets/icons/mdi_arrow-down.svg" alt="" class="w-4 md:w-5" />
                    <p>{{ temperature.minTemp }}C</p>
                  </div>
                </div>
              </div>
              <div class="hidden sm:block">
                <p class="mb-1 md:mb-2 font-normal text-xl md:text-2xl">{{ condition }}</p>
                <p class="text-sm md:text-base text-gray-500">Feels like {{ temperature.feelsLike }}</p>
              </div>
            </div>
          </div>
          <div class="w-24 md:w-32 lg:w-40">
            <img class="w-full" src="@/assets/icons/weather-icon.svg" alt="" />
          </div>
        </div>
        <!-- condition for mobile only -->
        <div class="sm:hidden -mt-4">
          <p class="font-normal text-xl">{{ condition }}</p>
          <p class="text-sm text-gray-500">Feels like {{ temperature.feelsLike }}</p>
        </div>
        <!-- bottom -->
        <div class="grid grid-cols-3 md:flex md:flex-row justify-between gap-4">
          <div class="flex flex-col">
            <p class="text-[10px] md:text-xs font-regular text-gray-500 dark:text-night-muted">Humidity</p>
            <p class="text-sm md:text-md font-regular text-black dark:text-night-text">
              {{ basicWeatherInfo.humidity }}%
            </p>
          </div>
          <div class="flex flex-col">
            <p class="text-[10px] md:text-xs font-regular text-gray-500 dark:text-night-muted">Visibility</p>
            <p class="text-sm md:text-md font-regular text-black dark:text-night-text">
              {{ basicWeatherInfo.visibility }} km
            </p>
          </div>
          <div class="flex flex-col">
            <p class="text-[10px] md:text-xs font-regular text-gray-500 dark:text-night-muted">Pressure</p>
            <p class="text-sm md:text-md font-regular text-black dark:text-night-text">
              {{ basicWeatherInfo.pressure }} hPa
            </p>
          </div>
          <div class="flex flex-col">
            <p class="text-[10px] md:text-xs font-regular text-gray-500 dark:text-night-muted">UV</p>
            <p class="text-sm md:text-md font-regular text-black dark:text-night-text">
              {{ basicWeatherInfo.uv }}
            </p>
          </div>
          <div class="flex flex-col col-span-2 md:col-span-1">
            <p class="text-[10px] md:text-xs font-regular text-gray-500 dark:text-night-muted">Air Quality</p>
            <p class="text-sm md:text-md font-regular text-black dark:text-night-text">
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
