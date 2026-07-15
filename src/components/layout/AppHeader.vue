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
        <div class="flex flex-row items-center md:order-3">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button
                class="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-night-bg transition-colors dark:text-night-text"
                title="Settings"
                aria-label="Open settings menu"
              >
                <AppIcon name="settings" :size="24" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-60">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                class="justify-between cursor-pointer"
                :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
                @select.prevent="toggleTheme"
              >
                <span>{{ isDark ? 'Dark mode' : 'Light mode' }}</span>
                <AppIcon :name="isDark ? 'dark_mode' : 'light_mode'" :size="18" />
              </DropdownMenuItem>
              <DropdownMenuItem
                class="justify-between cursor-pointer"
                :title="`Switch to ${unit === 'celsius' ? 'Fahrenheit' : 'Celsius'}`"
                @select.prevent="toggleUnit"
              >
                <span>Temperature</span>
                <span @click.stop><UnitToggle /></span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <!-- search -->
      <div class="w-full md:max-w-md lg:max-w-2xl flex flex-row items-center md:order-2">
        <div class="w-full bg-gray-200 dark:bg-night-surface p-2 rounded-lg">
          <form
            @submit.prevent="fetchCityWeather(cityName)"
            class="content-start flex items-stretch"
          >
            <UiInput
              v-model="cityName"
              type="text"
              class="h-auto rounded-none border-0 py-0 pl-2 pr-0 text-lg shadow-none focus-visible:ring-0 md:text-xl dark:text-night-text dark:placeholder:text-night-muted"
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
import useUnitStore from '@/stores/unit'
import AppIcon from '@/components/common/AppIcon.vue'
import UnitToggle from '@/components/ui/UnitToggle.vue'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export default {
  name: 'AppHeader',
  components: {
    AppIcon,
    UnitToggle,
    UiInput: Input,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
  },
  data() {
    return {
      cityName: ''
    }
  },
  computed: {
    ...mapState(useWeatherStore, ['isLoading', 'locationError']),
    ...mapState(useThemeStore, ['isDark']),
    ...mapState(useUnitStore, ['unit'])
  },
  methods: {
    ...mapActions(useWeatherStore, {
      getCityWeather: 'getCityWeather',
      detectUserLocation: 'detectUserLocation'
    }),
    ...mapActions(useThemeStore, ['toggleTheme']),
    ...mapActions(useUnitStore, ['setUnit']),
    toggleUnit() {
      this.setUnit(this.unit === 'celsius' ? 'fahrenheit' : 'celsius')
    },
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
