<template>
  <!-- header -->
  <div
    class="w-full fixed top-0 bg-white/30 dark:bg-night-surface/30 backdrop-blur-lg z-10 drop-shadow-lg"
  >
    <div class="container mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">
      <!-- on mobile: title + controls share one row via flex-row;
           on md+: md:contents dissolves this wrapper so children join the parent flex row directly -->
      <div class="w-full flex flex-row items-center justify-between md:contents">
        <!-- title -->
        <div class="flex-shrink-0 md:order-1">
          <p class="font-semibold text-2xl md:text-4xl text-slate-800 dark:text-night-text tracking-[0.2em] md:tracking-[0.5em]">
            TIDY
          </p>
        </div>
        <!-- controls -->
        <div class="flex flex-row items-center gap-3 md:order-3">
          <button
            @click="toggleTheme"
            class="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-night-bg transition-colors"
            :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <AppIcon :name="isDark ? 'light_mode' : 'dark_mode'" :size="24" />
          </button>
          <UnitToggle />
        </div>
      </div>

      <!-- search -->
      <div class="w-full md:max-w-md lg:max-w-2xl flex flex-row items-center md:order-2">
        <div class="w-full bg-gray-200 dark:bg-night-surface p-2 rounded-lg">
          <form
            @submit.prevent="fetchCityWeather(cityName)"
            class="content-start flex items-stretch"
          >
            <input
              v-model="cityName"
              type="text"
              class="bg-transparent w-full focus:outline-none text-lg md:text-xl pl-2 dark:text-night-text dark:placeholder-night-muted"
              placeholder="Search City"
            />
            <button class="flex items-center justify-center dark:text-night-text" type="submit">
              <AppIcon name="chevron_right" :size="28" />
            </button>
          </form>
        </div>
        <button
          @click="handleLocationClick"
          :disabled="isLoading"
          :title="locationError || 'Get current location'"
          class="flex-shrink-0"
        >
          <img src="@/assets/icons/gps-location.svg" alt="Get location" class="p-2 w-10 md:w-12" />
        </button>
      </div>
    </div>
  </div>
  <!-- spacer: matches header height (2-row on mobile ~128px, 1-row on md+ ~80px) -->
  <div class="h-32 md:h-20"></div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import useWeatherStore from '@/stores/weather'
import useThemeStore from '@/stores/theme'
import AppIcon from '@/components/common/AppIcon.vue'
import UnitToggle from '@/components/ui/UnitToggle.vue'

export default {
  name: 'AppHeader',
  components: {
    AppIcon,
    UnitToggle
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
