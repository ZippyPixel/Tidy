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
                :title="$t('header.settings')"
                aria-label="Open settings menu"
              >
                <AppIcon name="settings" :size="24" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-60">
              <DropdownMenuLabel>{{ $t('header.settings') }}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                class="justify-between cursor-pointer"
                :title="isDark ? $t('header.switchToLight') : $t('header.switchToDark')"
                @select.prevent="toggleTheme"
              >
                <span>{{ isDark ? $t('header.darkMode') : $t('header.lightMode') }}</span>
                <AppIcon :name="isDark ? 'moon' : 'sun'" :size="18" />
              </DropdownMenuItem>
              <DropdownMenuItem
                class="justify-between cursor-pointer"
                :title="$t('header.switchToUnit', { unit: $t(unit === 'celsius' ? 'header.fahrenheit' : 'header.celsius') })"
                @select.prevent="toggleUnit"
              >
                <span>{{ $t('header.temperature') }}</span>
                <span @click.stop><UnitToggle /></span>
              </DropdownMenuItem>
              <DropdownMenuItem
                class="justify-between cursor-pointer"
                :title="$t('header.switchLanguage')"
                @select.prevent="toggleLocale"
              >
                <span>{{ $t('header.language') }}</span>
                <span class="flex items-center gap-2">
                  <AppIcon name="languages" :size="18" />
                  {{ $t('languageName') }}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <!-- search -->
      <div class="w-full md:max-w-md lg:max-w-2xl flex flex-row items-center md:order-2">
        <Combobox
          class="w-full"
          ignore-filter
          :open="showSuggestions"
          :reset-search-term-on-blur="false"
          @update:open="onSuggestionsOpenChange"
        >
          <ComboboxAnchor class="w-full bg-gray-200 dark:bg-night-surface p-2 rounded-lg">
            <form
              @submit.prevent="fetchCityWeather(cityName)"
              class="content-start flex items-stretch"
            >
              <ComboboxInput
                v-model="cityName"
                class="h-auto rounded-none border-0 py-0 pl-2 pr-0 text-lg shadow-none focus-visible:ring-0 md:text-xl dark:text-night-text dark:placeholder:text-night-muted"
                :placeholder="$t('header.searchPlaceholder')"
              />
              <button class="flex items-center justify-center dark:text-night-text" type="submit">
                <AppIcon name="chevron-right" :size="28" />
              </button>
            </form>
          </ComboboxAnchor>
          <ComboboxList
            align="start"
            :side-offset="6"
            class="w-[--reka-combobox-trigger-width] max-h-72 overflow-y-auto p-1 bg-white/30 dark:bg-night-surface/30 backdrop-blur-lg"
          >
            <ComboboxEmpty>{{ $t('header.noMatchingCities') }}</ComboboxEmpty>
            <ComboboxItem
              v-for="suggestion in suggestions"
              :key="suggestion.id"
              :value="suggestion"
              class="cursor-pointer"
              @select="selectSuggestion(suggestion)"
            >
              <span class="truncate">{{ suggestion.name }}</span>
              <span class="truncate text-xs text-muted-foreground">
                {{ suggestionDetail(suggestion) }}
              </span>
            </ComboboxItem>
          </ComboboxList>
        </Combobox>
        <button
          @click="handleLocationClick"
          :disabled="isLoading"
          :title="locationError ? $t(locationError) : $t('header.getCurrentLocation')"
          class="flex-shrink-0"
        >
          <img
            src="@/assets/icons/gps-location.svg"
            :alt="$t('header.getLocation')"
            class="p-2 w-10 md:w-12"
          />
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
import useLocaleStore from '@/stores/locale'
import AppIcon from '@/components/common/AppIcon.vue'
import UnitToggle from '@/components/ui/UnitToggle.vue'
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from '@/components/ui/combobox'
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
    Combobox,
    ComboboxAnchor,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
  },
  data() {
    return {
      cityName: '',
      suggestions: [],
      showSuggestions: false,
      searchTimer: null
    }
  },
  computed: {
    ...mapState(useWeatherStore, ['isLoading', 'locationError']),
    ...mapState(useThemeStore, ['isDark']),
    ...mapState(useUnitStore, ['unit'])
  },
  watch: {
    cityName(value) {
      clearTimeout(this.searchTimer)
      const query = value.trim()
      if (query.length < 3) {
        this.suggestions = []
        this.showSuggestions = false
        return
      }
      this.searchTimer = setTimeout(() => this.fetchSuggestions(query), 300)
    }
  },
  beforeUnmount() {
    clearTimeout(this.searchTimer)
  },
  methods: {
    ...mapActions(useWeatherStore, {
      getCityWeather: 'getCityWeather',
      searchLocations: 'searchLocations',
      detectUserLocation: 'detectUserLocation'
    }),
    ...mapActions(useThemeStore, ['toggleTheme']),
    ...mapActions(useUnitStore, ['setUnit']),
    ...mapActions(useLocaleStore, ['toggleLocale']),
    toggleUnit() {
      this.setUnit(this.unit === 'celsius' ? 'fahrenheit' : 'celsius')
    },
    async fetchSuggestions(query) {
      try {
        const results = await this.searchLocations(query)
        if (query !== this.cityName.trim()) return // input changed while fetching
        this.suggestions = results
        this.showSuggestions = true
      } catch (error) {
        console.error('City search failed:', error)
        this.suggestions = []
        this.showSuggestions = false
      }
    },
    onSuggestionsOpenChange(open) {
      // opening is driven by fetched results only; honor close requests (esc, outside click)
      if (!open) this.showSuggestions = false
    },
    suggestionDetail(suggestion) {
      return [suggestion.region, suggestion.country].filter(Boolean).join(', ')
    },
    async selectSuggestion(suggestion) {
      this.showSuggestions = false
      this.cityName = ''
      try {
        await this.getCityWeather(`id:${suggestion.id}`)
      } catch (error) {
        console.error('Failed to fetch city weather:', error)
      }
    },
    async fetchCityWeather(cityName) {
      if (!cityName.trim()) return
      this.showSuggestions = false
      clearTimeout(this.searchTimer)
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
