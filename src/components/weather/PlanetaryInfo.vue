<template>
  <!-- planetary info -->
  <div class="bg-white w-[23rem] h-80 rounded-3xl p-3">
    <div class="w-[22rem] h-full mx-auto flex flex-col justify-between">
      <!-- sunrise & sunset -->
      <div class="">
        <p class="text-gray-500">Sunrise & Sunset</p>
        <div class="w-full flex flex-row justify-around my-3">
          <!-- sunrise -->
          <div class="flex flex-col items-center">
            <img class="w-[3rem] mb-1" src="@/assets/icons/sunrise.png" alt="" />
            <p class="text-lg font-regular">{{ astro.sunrise }}</p>
          </div>
          <!-- sunset -->
          <div class="flex flex-col items-center">
            <img class="w-[3rem] mb-1" src="@/assets/icons/sunset.png" alt="" />
            <p class="text-lg font-regular">{{ astro.sunset }}</p>
          </div>
        </div>
      </div>
      <!-- moonrise & moonset -->
      <div class="">
        <p class="text-gray-500">Moonrise & Moonset</p>
        <div class="w-full flex flex-row justify-around my-3">
          <!-- moonrise -->
          <div class="flex flex-col items-center">
            <img class="w-[3rem]" src="@/assets/icons/moonrise.png" alt="" />
            <p class="text-lg font-regular">{{ astro.moonrise }}</p>
          </div>
          <!-- moonset -->
          <div class="flex flex-col items-center">
            <img class="w-[3rem]" src="@/assets/icons/moonset.png" alt="" />
            <p class="text-lg font-regular">{{ astro.moonset }}</p>
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
  },
}
</script> 