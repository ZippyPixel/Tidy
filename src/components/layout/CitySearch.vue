<template>
  <Combobox
    class="w-full min-w-0"
    ignore-filter
    :open="showSuggestions"
    :reset-search-term-on-blur="false"
    @update:open="onSuggestionsOpenChange"
  >
    <!-- md+: muted pill in the header; suggestions in a popover under it -->
    <template v-if="variant === 'inline'">
      <ComboboxAnchor
        class="flex h-11 w-full min-w-0 items-center gap-2 rounded-full bg-muted pl-4 pr-1 text-muted-foreground focus-within:ring-2 focus-within:ring-ring"
      >
        <form class="flex min-w-0 flex-1 items-center gap-2" @submit.prevent="submit">
          <AppIcon name="search" :size="18" :stroke-width="1.8" class="flex-none" />
          <ComboboxInput
            v-model="cityName"
            class="h-auto min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-[15px] text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
            :placeholder="$t('header.searchPlaceholder')"
          />
          <button
            type="submit"
            class="flex size-9 flex-none items-center justify-center rounded-full text-foreground hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :aria-label="$t('header.submitSearch')"
          >
            <AppIcon name="chevron-right" :size="18" :stroke-width="1.8" />
          </button>
        </form>
      </ComboboxAnchor>
      <ComboboxList
        align="start"
        :side-offset="8"
        class="max-h-80 w-[--reka-combobox-trigger-width] overflow-y-auto rounded-tile p-1"
      >
        <ComboboxEmpty class="px-3 py-4 text-sm text-muted-foreground">{{ $t('header.noMatchingCities') }}</ComboboxEmpty>
        <ComboboxItem
          v-for="suggestion in suggestions"
          :key="suggestion.id"
          :value="suggestion"
          class="flex min-h-14 cursor-pointer flex-col items-start justify-center gap-0.5 rounded-[var(--radius)] px-3 py-2 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
          @select="selectSuggestion(suggestion)"
        >
          <span class="w-full truncate text-[15px]">{{ suggestion.name }}</span>
          <span class="w-full truncate text-[13px] opacity-80">{{ suggestionDetail(suggestion) }}</span>
        </ComboboxItem>
      </ComboboxList>
    </template>

    <!-- phone: full-screen search (rendered inside a Dialog by AppHeader) -->
    <template v-else>
      <div
        class="flex h-[calc(56px+env(safe-area-inset-top))] items-center gap-1 border-b bg-background pl-[max(4px,env(safe-area-inset-left))] pr-[max(12px,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)]"
      >
        <button
          type="button"
          class="flex size-11 flex-none items-center justify-center rounded-full hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :aria-label="$t('header.closeSearch')"
          @click="$emit('close')"
        >
          <AppIcon name="arrow-left" :size="22" :stroke-width="1.75" />
        </button>
        <ComboboxAnchor
          class="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-popover pl-3.5 pr-1 shadow-[0_0_0_2px_hsl(var(--ring))]"
        >
          <form class="flex min-w-0 flex-1 items-center gap-2" @submit.prevent="submit">
            <AppIcon name="search" :size="18" :stroke-width="1.8" class="flex-none text-muted-foreground" />
            <ComboboxInput
              ref="input"
              v-model="cityName"
              enterkeyhint="search"
              class="h-auto min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-base shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
              :placeholder="$t('header.searchPlaceholder')"
            />
            <button
              v-if="cityName"
              type="button"
              class="flex size-9 flex-none items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :aria-label="$t('header.clearSearch')"
              @click="clear"
            >
              <AppIcon name="x" :size="18" :stroke-width="1.8" />
            </button>
          </form>
        </ComboboxAnchor>
      </div>
      <div class="pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] pt-2">
        <ComboboxContent position="inline" class="outline-none">
          <ComboboxViewport>
            <p class="px-3 pb-2 pt-2.5 text-[13px] font-medium text-muted-foreground">{{ $t('header.suggestions') }}</p>
            <ComboboxEmpty class="px-3 py-4 text-[15px] text-muted-foreground">{{ $t('header.noMatchingCities') }}</ComboboxEmpty>
            <ComboboxItem
              v-for="suggestion in suggestions"
              :key="suggestion.id"
              :value="suggestion"
              class="flex min-h-16 cursor-pointer flex-col justify-center gap-0.5 rounded-[var(--radius)] px-3.5 py-2.5 outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
              @select="selectSuggestion(suggestion)"
            >
              <span class="truncate text-base">{{ suggestion.name }}</span>
              <span class="truncate text-[13px] opacity-80">{{ suggestionDetail(suggestion) }}</span>
            </ComboboxItem>
          </ComboboxViewport>
        </ComboboxContent>
      </div>
    </template>
  </Combobox>
</template>

<script>
import { mapActions } from 'pinia'
import { ComboboxContent, ComboboxViewport } from 'reka-ui'
import useWeatherStore from '@/stores/weather'
import AppIcon from '@/components/common/AppIcon.vue'
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from '@/components/ui/combobox'

export default {
  name: 'CitySearch',
  components: {
    AppIcon,
    Combobox,
    ComboboxAnchor,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxViewport
  },
  props: {
    /** 'inline' — header pill with popover list (md+); 'screen' — full-screen layout (phone) */
    variant: { type: String, default: 'inline', validator: (v) => ['inline', 'screen'].includes(v) }
  },
  // close: the user went back, or a search was sent (screen variant closes its dialog)
  emits: ['close'],
  data() {
    return {
      cityName: '',
      suggestions: [],
      showSuggestions: false,
      searchTimer: null
    }
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
    ...mapActions(useWeatherStore, ['getCityWeather', 'searchLocations']),
    focus() {
      this.$refs.input?.$el?.focus()
    },
    clear() {
      this.cityName = ''
      this.focus()
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
      this.$emit('close')
      try {
        await this.getCityWeather(`id:${suggestion.id}`)
      } catch (error) {
        console.error('Failed to fetch city weather:', error)
      }
    },
    async submit() {
      const cityName = this.cityName
      if (!cityName.trim()) return
      this.showSuggestions = false
      clearTimeout(this.searchTimer)
      this.$emit('close')
      try {
        await this.getCityWeather(cityName)
        this.cityName = '' // Clear input after successful fetch
      } catch (error) {
        console.error('Failed to fetch city weather:', error)
      }
    }
  }
}
</script>
