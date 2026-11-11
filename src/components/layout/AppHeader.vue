<template>
  <header
    class="sticky top-0 z-30 border-b bg-background pt-[env(safe-area-inset-top)] [@media(max-height:500px)]:static"
  >
    <!-- V3 header. Phone: wordmark + search / locate / settings icon buttons (56px bar).
         md+: wordmark · search pill + locate · settings on a 68px grid, search column
         capped at 600px from xl. Sticky, except on short (landscape phone) screens. -->
    <div
      class="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(4px,env(safe-area-inset-right))] md:grid md:h-[68px] md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-6 md:page-gutter xl:grid-cols-[1fr_minmax(0,600px)_1fr]"
    >
      <NuxtLink
        to="/"
        class="whitespace-nowrap rounded-sm text-xl font-semibold tracking-[0.45em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-2xl md:tracking-[0.5em]"
        :aria-label="$t('header.home')"
      >
        TIDY
      </NuxtLink>

      <!-- md+: inline search and locate -->
      <div class="hidden min-w-0 items-center gap-2 md:flex">
        <CitySearch class="flex-1" />
        <button
          type="button"
          :class="iconButton"
          :disabled="locating"
          :title="locationError ? $t(locationError) : $t('header.getCurrentLocation')"
          :aria-label="$t('header.getCurrentLocation')"
          @click="handleLocationClick"
        >
          <AppIcon name="locate-fixed" :size="22" :stroke-width="1.75" />
        </button>
      </div>

      <div class="flex items-center md:justify-self-end">
        <button
          type="button"
          :class="[iconButton, 'md:hidden']"
          :aria-label="$t('header.searchCity')"
          aria-haspopup="dialog"
          :aria-expanded="String(searchOpen)"
          @click="searchOpen = true"
        >
          <AppIcon name="search" :size="21" :stroke-width="1.8" />
        </button>
        <button
          type="button"
          :class="[iconButton, 'md:hidden']"
          :disabled="locating"
          :title="locationError ? $t(locationError) : $t('header.getCurrentLocation')"
          :aria-label="$t('header.getCurrentLocation')"
          @click="handleLocationClick"
        >
          <AppIcon name="locate-fixed" :size="21" :stroke-width="1.75" />
        </button>
        <SettingsMenu />
      </div>
    </div>

    <!-- phone: full-screen search -->
    <DialogRoot :open="searchOpen" @update:open="searchOpen = $event">
      <DialogPortal>
        <DialogContent
          class="fixed inset-0 z-50 flex flex-col bg-background text-foreground outline-none"
          @open-auto-focus.prevent="$refs.screenSearch?.focus()"
        >
          <DialogTitle class="sr-only">{{ $t('header.searchCity') }}</DialogTitle>
          <DialogDescription class="sr-only">{{ $t('header.searchPlaceholder') }}</DialogDescription>
          <CitySearch ref="screenSearch" variant="screen" @close="searchOpen = false" />
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </header>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { DialogContent, DialogDescription, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import useWeatherStore from '@/stores/weather'
import AppIcon from '@/components/common/AppIcon.vue'
import CitySearch from '@/components/layout/CitySearch.vue'
import SettingsMenu from '@/components/layout/SettingsMenu.vue'
import { showWeather } from '@/utils/navigation'

export default {
  name: 'AppHeader',
  components: {
    AppIcon,
    CitySearch,
    SettingsMenu,
    DialogContent,
    DialogDescription,
    DialogPortal,
    DialogRoot,
    DialogTitle
  },
  data() {
    return {
      searchOpen: false,
      // 44px icon buttons (design tap-target rule)
      iconButton:
        'flex size-11 flex-none items-center justify-center rounded-full hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
    }
  },
  computed: {
    // the header is real from the first frame; only locate waits, and only on its own
    // request (a refresh or a city search leaves it alone)
    ...mapState(useWeatherStore, ['locating', 'locationError'])
  },
  methods: {
    ...mapActions(useWeatherStore, ['detectUserLocation']),
    async handleLocationClick() {
      try {
        await this.detectUserLocation()
        showWeather(this.$router)
      } catch (error) {
        console.error('Location detection failed:', error)
      }
    }
  }
}
</script>
