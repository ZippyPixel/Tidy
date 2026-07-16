<template>
  <!-- planetary info -->
  <div
    class="bg-white dark:bg-night-surface w-full md:w-auto md:min-w-[15rem] lg:w-full h-auto min-h-[20rem] rounded-3xl p-4 flex flex-col justify-center"
  >
    <div class="w-full h-full mx-auto flex flex-col justify-between gap-6">
      <!-- sunrise & sunset -->
      <div class="">
        <p class="text-gray-500 dark:text-night-muted text-sm mb-2">{{ $t('planetary.sunriseSunset') }}</p>
        <div class="w-full flex flex-row justify-around py-2">
          <!-- sunrise -->
          <div class="flex flex-col items-center">
            <img class="w-10 md:w-12 mb-2" src="@/assets/icons/sunrise.png" alt="" />
            <p class="text-base md:text-lg font-regular dark:text-night-text">
              {{ astro.sunrise }}
            </p>
          </div>
          <!-- sunset -->
          <div class="flex flex-col items-center">
            <img class="w-10 md:w-12 mb-2" src="@/assets/icons/sunset.png" alt="" />
            <p class="text-base md:text-lg font-regular dark:text-night-text">{{ astro.sunset }}</p>
          </div>
        </div>
      </div>
      <!-- moonrise & moonset -->
      <div class="">
        <p class="text-gray-500 dark:text-night-muted text-sm mb-2">{{ $t('planetary.moonriseMoonset') }}</p>
        <div class="w-full flex flex-row justify-around py-2">
          <!-- moonrise -->
          <div class="flex flex-col items-center">
            <img class="w-10 md:w-12 mb-2" src="@/assets/icons/moonrise.png" alt="" />
            <p class="text-base md:text-lg font-regular dark:text-night-text">
              {{ astro.moonrise }}
            </p>
          </div>
          <!-- moonset -->
          <div class="flex flex-col items-center">
            <img class="w-10 md:w-12 mb-2" src="@/assets/icons/moonset.png" alt="" />
            <p class="text-base md:text-lg font-regular dark:text-night-text">
              {{ astro.moonset }}
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

export default {
  name: 'PlanetaryInfo',
  computed: {
    ...mapState(useWeatherStore, ['astro'])
  }
}
</script>
