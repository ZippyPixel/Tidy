<template>
  <div class="flex-column w-full lg:max-w-[40rem]">
    <!-- location-time -->
    <div class="w-full flex flex-row justify-between items-end mb-2">
      <div class="w-fit">
        <p class="text-gray-500 dark:text-night-muted text-sm md:text-base">{{ $t('weather.currentLocation') }}</p>
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
        <AppIcon name="cloud-rain" :size="18" class="text-blue-500 dark:text-night-muted" />
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
                    <p>{{ temperature.maxTemp }}{{ unitLabel }}</p>
                  </div>
                  <div class="flex flex-row">
                    <img src="@/assets/icons/mdi_arrow-down.svg" alt="" class="w-4 md:w-5" />
                    <p>{{ temperature.minTemp }}{{ unitLabel }}</p>
                  </div>
                </div>
              </div>
              <div class="hidden sm:block">
                <p class="mb-1 md:mb-2 font-normal text-xl md:text-2xl">{{ condition }}</p>
                <p class="text-sm md:text-base text-gray-500">{{ $t('weather.feelsLike', { temp: temperature.feelsLike }) }}</p>
              </div>
            </div>
          </div>
          <div class="w-24 md:w-32 lg:w-40">
            <img class="w-full" :src="weatherIcon" :alt="condition" />
          </div>
        </div>
        <!-- condition for mobile only -->
        <div class="sm:hidden -mt-4">
          <p class="font-normal text-xl">{{ condition }}</p>
          <p class="text-sm text-gray-500">{{ $t('weather.feelsLike', { temp: temperature.feelsLike }) }}</p>
        </div>
        <!-- bottom -->
        <div class="grid grid-cols-3 md:flex md:flex-row justify-between gap-4">
          <div class="flex flex-col">
            <p class="text-[10px] md:text-xs font-regular text-gray-500 dark:text-night-muted">{{ $t('weather.humidity') }}</p>
            <p class="text-sm md:text-md font-regular text-black dark:text-night-text">
              {{ formatNumber(basicWeatherInfo.humidity) }}%
            </p>
          </div>
          <div class="flex flex-col">
            <p class="text-[10px] md:text-xs font-regular text-gray-500 dark:text-night-muted">{{ $t('weather.visibility') }}</p>
            <p class="text-sm md:text-md font-regular text-black dark:text-night-text">
              {{ formatNumber(basicWeatherInfo.visibility) }} {{ $t('weather.km') }}
            </p>
          </div>
          <div class="flex flex-col">
            <p class="text-[10px] md:text-xs font-regular text-gray-500 dark:text-night-muted">{{ $t('weather.pressure') }}</p>
            <p class="text-sm md:text-md font-regular text-black dark:text-night-text">
              {{ formatNumber(basicWeatherInfo.pressure) }} {{ $t('weather.hPa') }}
            </p>
          </div>
          <div class="flex flex-col">
            <p class="text-[10px] md:text-xs font-regular text-gray-500 dark:text-night-muted">{{ $t('weather.uv') }}</p>
            <p class="text-sm md:text-md font-regular text-black dark:text-night-text">
              {{ uvLabel }}
            </p>
          </div>
          <div class="flex flex-col col-span-2 md:col-span-1">
            <p class="text-[10px] md:text-xs font-regular text-gray-500 dark:text-night-muted">{{ $t('weather.airQuality') }}</p>
            <p class="text-sm md:text-md font-regular text-black dark:text-night-text">
              {{ airQualityLabel }}
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
import useUnitStore from '@/stores/unit'
import weatherMixin from '@/mixins/weatherMixin'
import AppIcon from '@/components/common/AppIcon.vue'
import { getWeatherIcon } from '@/constants/weatherIcons'

export default {
  name: 'BasicWeatherInfo',
  components: {
    AppIcon
  },
  mixins: [weatherMixin],
  computed: {
    ...mapState(useWeatherStore, [
      'location',
      'day',
      'chanceOfRain',
      'condition',
      'conditionCode',
      'isDay',
      'basicWeatherInfo',
      'temperature'
    ]),
    ...mapState(useUnitStore, ['unit']),
    unitLabel() {
      return this.unit === 'celsius' ? 'C' : 'F'
    },
    uvLabel() {
      return this.basicWeatherInfo.uv ? this.$t(`uvLevels.${this.basicWeatherInfo.uv}`) : ''
    },
    airQualityLabel() {
      return this.basicWeatherInfo.airQuality
        ? this.$t(`airQualityLevels.${this.basicWeatherInfo.airQuality}`)
        : ''
    },
    weatherIcon() {
      return getWeatherIcon(this.conditionCode, this.isDay === 1)
    }
  }
}
</script>
