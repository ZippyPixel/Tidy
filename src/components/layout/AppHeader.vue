<template>
  <!-- header -->
  <div
    class="w-full h-20 fixed top-0 bg-white/30 dark:bg-night-surface/30 backdrop-blur-lg z-10 flex flex-row justify-around items-center drop-shadow-lg"
  >
    <!-- title -->
    <div>
      <p class="font-semibold text-4xl text-slate-800 dark:text-night-text tracking-[0.5em]">TIDY</p>
    </div>

    <!-- search -->
    <div class="w-1/4 flex flex-row items-center">
      <div class="w-full bg-gray-200 dark:bg-night-surface p-2 rounded-lg">
        <form @submit.prevent="fetchCityWeather(cityName)" class="content-start flex items-stretch">
          <input
            v-model="cityName"
            type="text"
            class="bg-transparent w-full focus:outline-none text-xl pl-2 dark:text-night-text dark:placeholder-night-muted"
            placeholder="Search City"
          />
          <button class="flex items-center justify-center dark:text-night-text" type="submit">
            <AppIcon name="chevron_right" :size="32" />
          </button>
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

    <!-- controls -->
    <div class="flex flex-row items-center gap-3">
      <!-- theme toggle -->
      <button
        @click="toggleTheme"
        class="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-night-bg transition-colors"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <AppIcon :name="isDark ? 'light_mode' : 'dark_mode'" :size="24" />
      </button>

      <!-- unit select -->
      <select name="unit" id="unit" class="p-2 rounded-md dark:bg-night-surface dark:text-night-text dark:border-night-muted">
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
import useThemeStore from '@/stores/theme'
import AppIcon from '@/components/common/AppIcon.vue'

export default {
  name: 'AppHeader',
  components: {
    AppIcon
  },
  data() {
    return {
      cityName: ''
    }
  },
  computed: {
    ...mapState(useWeatherStore, ['isLoading', 'locationError']),
    ...mapState(useThemeStore, ['isDark'])
  },
  methods: {
    ...mapActions(useWeatherStore, {
      getCityWeather: 'getCityWeather',
      detectUserLocation: 'detectUserLocation'
    }),
    ...mapActions(useThemeStore, ['toggleTheme']),
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
