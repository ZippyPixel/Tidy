<template>
  <!-- header -->
  <div
    class="w-full h-20 fixed top-0 bg-white/30 backdrop-blur-lg z-10 flex flex-row justify-around items-center drop-shadow-lg"
  >
    <!-- title -->
    <div>
      <p class="font-semibold text-4xl text-slate-800 tracking-[0.5em]">TIDY</p>
    </div>

    <!-- search -->
    <div class="w-1/4 flex flex-row items-center">
      <div class="w-full bg-gray-200 p-2 rounded-lg">
        <form @submit.prevent='fetchCityWeather(cityName)' class="content-start flex items-stretch">
          <input
            v-model="cityName"
            type="text"
            class="bg-inherit w-full focus:outline-none text-xl pl-2"
            placeholder="Search City"
          />
          <button type="submit"><img src="@/assets/icons/arrow-right.svg" alt="" /></button>
        </form>
      </div>
      <button
        @click="handleLocationClick"
        :disabled="isLoading"
        :title="locationError || 'Get current location'"
      >
        <img src="@/assets/icons/gps-location.svg" alt="Get location" class="p-2" />
      </button>
    </div>

    <!-- unit select -->
    <div>
      <select name="unit" id="unit" class="p-2 rounded-md">
        <option value="celsius">Celsius</option>
        <option value="fahrenheit">Fahrenheit</option>
      </select>
    </div>
  </div>
  <div class="mt-20 pb-10"></div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import useWeatherStore from '@/stores/weather'

export default {
  name: 'AppHeader',
  data() {
    return {
      cityName: ''
    }
  },
  computed: {
    ...mapState(useWeatherStore, ['isLoading', 'locationError'])
  },
  methods: {
    ...mapActions(useWeatherStore, {
      getCityWeather: 'getCityWeather',
      detectUserLocation: 'detectUserLocation'
    }),
    async fetchCityWeather(cityName) {
      if (!cityName.trim()) return
      try {
        await this.getCityWeather(cityName)
        this.cityName = '' // Clear input after successful fetch
      } catch (error) {
        console.error('Failed to fetch city weather:', error)
      }
    },
    async handleLocationClick() {
      try {
        await this.detectUserLocation()
      } catch (error) {
        console.error('Location detection failed:', error)
      }
    }
  }
}
</script> 