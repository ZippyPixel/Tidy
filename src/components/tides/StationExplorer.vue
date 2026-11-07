<template>
  <DialogRoot :open="open" @update:open="onOpenChange">
    <DialogPortal>
      <DialogContent
        data-explorer
        class="fixed inset-0 z-[60] flex flex-col bg-background text-foreground outline-none duration-[160ms] ease-out data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:!animate-none"
        @close-auto-focus.prevent="opener?.focus({ preventScroll: true })"
      >
        <!-- design/TidyTideExplorer. Below md the panel dissolves, so the order is search → globe → list -->
        <header
          class="flex h-[calc(56px+env(safe-area-inset-top))] flex-none items-center gap-2 border-b pl-1 pr-4 pt-[env(safe-area-inset-top)] md:h-[68px] md:pl-3 md:pr-6 md:pt-0"
        >
          <button
            type="button"
            data-close
            :aria-label="$t('tides.explorer.close')"
            class="flex size-11 flex-none items-center justify-center rounded-full outline-ring hover:bg-foreground/[0.06] focus-visible:outline focus-visible:outline-2"
            @click="requestClose"
          >
            <AppIcon name="chevron-left" :size="22" :stroke-width="2" class="md:hidden" />
            <AppIcon name="x" :size="20" :stroke-width="2" class="hidden md:block" />
          </button>
          <div class="flex min-w-0 flex-col">
            <DialogTitle as="h1" class="whitespace-nowrap text-lg font-semibold leading-6 tracking-[-0.01em]">
              {{ $t('tides.explorer.title') }}
            </DialogTitle>
            <DialogDescription as="span" data-count class="whitespace-nowrap text-[13px] leading-4 tabular-nums text-muted-foreground">
              {{ countLine }}
            </DialogDescription>
          </div>
        </header>

        <div class="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside class="contents md:flex md:min-h-0 md:w-80 md:flex-none md:flex-col md:border-r lg:w-[380px]">
            <div class="order-1 flex flex-none items-center gap-2 px-4 py-3 md:px-6 md:pb-3 md:pt-5">
              <div class="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-muted pl-4 pr-1 text-muted-foreground">
                <AppIcon name="search" :size="18" class="flex-none" />
                <input
                  v-model="query"
                  data-search
                  type="text"
                  :placeholder="$t('tides.explorer.search')"
                  :aria-label="$t('tides.explorer.searchLabel')"
                  autocomplete="off"
                  spellcheck="false"
                  class="h-10 min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none"
                />
                <button
                  v-if="query"
                  type="button"
                  data-clear
                  :aria-label="$t('tides.explorer.clear')"
                  class="flex size-9 flex-none items-center justify-center rounded-full text-foreground"
                  @click="query = ''"
                >
                  <AppIcon name="x" :size="16" :stroke-width="2" />
                </button>
              </div>
              <button
                type="button"
                data-near
                :aria-pressed="String(near)"
                class="flex h-11 flex-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-semibold outline-ring hover:bg-foreground/5 focus-visible:outline focus-visible:outline-2"
                :class="near ? 'bg-accent text-accent-foreground' : 'text-foreground'"
                @click="nearMe"
              >
                <AppIcon name="locate-fixed" :size="18" />
                <span>{{ $t('tides.explorer.nearMe') }}</span>
              </button>
            </div>

            <div
              role="region"
              :aria-label="$t('tides.explorer.listLabel')"
              class="order-3 min-h-60 flex-1 overflow-y-auto overscroll-contain px-1 pb-[calc(24px+env(safe-area-inset-bottom))] pt-2 md:min-h-0 md:px-3 md:pb-6 md:pt-1"
            >
              <div v-if="!index && !loadFailed" data-list-loading class="flex flex-col gap-3 px-3 py-2">
                <div class="h-3 w-2/5 rounded bg-muted" />
                <div class="h-4 w-4/5 rounded bg-muted" />
                <div class="h-4 w-[70%] rounded bg-muted" />
              </div>
              <p v-if="message" data-message class="px-3 py-4 text-sm leading-5 text-muted-foreground">{{ message }}</p>
              <div v-for="section in sections" :key="section.title" data-section class="flex flex-col gap-0.5 pb-3">
                <div class="flex min-h-8 items-center justify-between gap-2 px-3">
                  <span class="truncate text-xs font-semibold uppercase leading-4 tracking-[0.06em] text-muted-foreground">{{ section.title }}</span>
                  <button
                    v-if="section.back"
                    type="button"
                    data-all-countries
                    class="h-8 whitespace-nowrap rounded-full px-2 text-[13px] font-semibold text-primary"
                    @click="backToAll"
                  >
                    {{ $t('tides.explorer.allCountries') }}
                  </button>
                </div>
                <button
                  v-for="row in section.rows"
                  :key="row.key"
                  type="button"
                  data-row
                  :aria-label="row.aria"
                  class="flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2 text-left outline-ring [outline-offset:-2px] hover:bg-foreground/5 focus-visible:outline focus-visible:outline-2 active:bg-foreground/[0.09]"
                  :class="{ 'bg-accent text-accent-foreground': row.active }"
                  @click="row.onClick"
                >
                  <span class="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                    <span class="max-w-full truncate text-[15px] font-medium leading-5">{{ row.title }}</span>
                    <span class="max-w-full truncate text-[13px] leading-4 text-muted-foreground">{{ row.sub }}</span>
                  </span>
                  <span class="flex-none whitespace-nowrap text-[13px] leading-4 tabular-nums text-muted-foreground">{{ row.right }}</span>
                  <AppIcon name="chevron-right" :size="16" :stroke-width="2" class="flex-none text-muted-foreground" />
                </button>
                <p v-if="section.more" class="mx-3 mt-1 text-[13px] leading-[18px] text-muted-foreground">{{ section.more }}</p>
              </div>
            </div>
          </aside>

          <TideGlobe
            ref="globe"
            :stations="stations"
            :land="land"
            :selected="selected"
            :home="home"
            :pick="pick"
            :pick-sub="pickSub"
            :is-md="isMd"
            :aria-label="globeLabel"
            :credit="creditLine"
            class="order-2 h-[min(46vh,380px)] flex-none border-b md:h-auto md:flex-1 md:border-b-0"
            @update:pick="pick = $event"
            @view="view"
          />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script>
import { mapStores } from 'pinia'
import { useMediaQuery } from '@vueuse/core'
import { DialogContent, DialogDescription, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import AppIcon from '@/components/common/AppIcon.vue'
import TideGlobe from '@/components/tides/TideGlobe.vue'
import { API_ENDPOINTS } from '@/constants/api'
import backToClose from '@/mixins/backToClose'
import tideMixin from '@/mixins/tideMixin'
import weatherMixin from '@/mixins/weatherMixin'
import useTidesStore from '@/stores/tides'
import { normalizeName } from '@/utils/globe'
import { haversineKm } from '@/utils/tides'

const SEARCH_DELAY_MS = 200
const COUNTRY_RESULTS = 6
const COUNTRY_ROWS = 200

export default {
  name: 'StationExplorer',
  components: { AppIcon, DialogContent, DialogDescription, DialogPortal, DialogRoot, DialogTitle, TideGlobe },
  mixins: [weatherMixin, tideMixin, backToClose],
  props: {
    open: { type: Boolean, default: false },
    /** gets focus back on close */
    opener: { type: Object, default: null },
    /** the station on the page */
    selected: { type: Object, default: null },
    /** weather store coords */
    home: { type: Object, default: null }
  },
  emits: ['pick', 'close'],
  setup() {
    return { isMd: useMediaQuery('(min-width: 768px)') }
  },
  data() {
    return {
      historyKey: 'tidyExplorer',
      index: null,
      stations: [],
      land: null,
      loadFailed: false,
      query: '',
      results: null,
      near: false,
      nearResults: null,
      nearFailed: false,
      country: null,
      pick: null
    }
  },
  computed: {
    ...mapStores(useTidesStore),
    countLine() {
      if (!this.index) return this.$t('tides.explorer.loading')
      return this.$t('tides.explorer.count', {
        count: this.tideGrouped(this.index.count),
        countries: this.formatNumber(this.index.countries.length)
      })
    },
    globeLabel() {
      if (!this.index) return this.$t('tides.explorer.globeLoading')
      return this.$t('tides.explorer.globe', { count: this.tideGrouped(this.index.count) })
    },
    creditLine() {
      const project = this.index?.credit?.project
      return project ? this.$t('tides.explorer.credit', { project }) : ''
    },
    pickSub() {
      if (!this.pick) return ''
      if (!this.home) return this.pick.country
      return this.$t('tides.explorer.pickSub', {
        country: this.pick.country,
        km: this.kmText(haversineKm(this.home, this.pick)),
        place: this.home.name
      })
    },
    trimmedQuery() {
      return this.query.trim()
    },
    matchingCountries() {
      if (!this.index || !this.trimmedQuery) return []
      const wanted = normalizeName(this.trimmedQuery)
      return this.index.countries.filter((c) => normalizeName(c.name).includes(wanted)).slice(0, COUNTRY_RESULTS)
    },
    message() {
      if (this.loadFailed) return this.$t('tides.explorer.loadFailed')
      if (this.near && this.nearFailed) return this.$t('errors.locationFailed')
      if (this.trimmedQuery && this.results && !this.results.length && !this.matchingCountries.length) {
        return this.$t('tides.explorer.noMatch', { query: this.trimmedQuery })
      }
      return ''
    },
    sections() {
      if (!this.index) return []
      if (this.trimmedQuery) {
        const sections = []
        if (this.matchingCountries.length) {
          sections.push({ title: this.$t('tides.explorer.countries'), rows: this.matchingCountries.map(this.countryRow) })
        }
        if (this.results?.length) {
          sections.push({
            title: this.$t('tides.explorer.stations', { count: this.formatNumber(this.results.length) }),
            rows: this.results.map((s) => this.stationRow(s))
          })
        }
        return sections
      }
      if (this.near) {
        if (!this.nearResults?.length) return []
        return [
          {
            title: this.home ? this.$t('tides.explorer.nearestTo', { place: this.home.name }) : this.$t('tides.explorer.nearest'),
            rows: this.nearResults.map((s) => this.stationRow(s, this.kmText(s.km)))
          }
        ]
      }
      if (this.country) {
        const country = this.index.countries.find((c) => c.name === this.country)
        if (!country) return []
        const rows = country.s
          .slice(0, COUNTRY_ROWS)
          .map(([id, name, lat, lon]) => this.stationRow({ id, name, country: country.name, lat, lon }))
        return [
          {
            title: this.$t('tides.explorer.countryHeading', { name: country.name, count: this.formatNumber(country.s.length) }),
            back: true,
            rows,
            more:
              country.s.length > COUNTRY_ROWS
                ? this.$t('tides.explorer.showing', { shown: this.formatNumber(COUNTRY_ROWS), total: this.formatNumber(country.s.length) })
                : ''
          }
        ]
      }
      const sections = []
      const suggested = this.index.countries.find((c) => c.name === this.home?.country)
      if (suggested) sections.push({ title: this.$t('tides.explorer.suggested'), rows: [this.countryRow(suggested)] })
      sections.push({ title: this.$t('tides.explorer.allCountries'), rows: this.index.countries.map(this.countryRow) })
      return sections
    }
  },
  watch: {
    trimmedQuery(text) {
      clearTimeout(this.searchTimer)
      this.results = null
      if (!text) return
      this.near = false
      this.country = null
      this.searchTimer = setTimeout(() => this.search(text), SEARCH_DELAY_MS)
    }
  },
  created() {
    this.searchTimer = null
    this.loadData()
  },
  beforeUnmount() {
    clearTimeout(this.searchTimer)
  },
  methods: {
    async loadData() {
      try {
        const { index, land, stations } = await this.tidesStore.loadExplorerData()
        this.index = index
        this.land = land
        this.stations = stations
      } catch {
        this.loadFailed = true
      }
    },
    async search(text) {
      try {
        const { stations } = await $fetch(API_ENDPOINTS.TIDE_STATIONS, { query: { q: text } })
        if (text === this.trimmedQuery) this.results = stations
      } catch {
        if (text === this.trimmedQuery) this.results = []
      }
    },
    position() {
      if (this.home) return Promise.resolve(this.home)
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error('unsupported'))
        else {
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => resolve({ lat: coords.latitude, lon: coords.longitude }),
            reject
          )
        }
      })
    },
    async nearMe() {
      this.near = true
      this.nearFailed = false
      this.nearResults = null
      this.query = ''
      this.country = null
      try {
        const { lat, lon } = await this.position()
        this.$refs.globe?.flyTo(lon, lat, 2.2)
        const { stations } = await $fetch(API_ENDPOINTS.TIDE_STATIONS, { query: { near: `${lat},${lon}` } })
        this.nearResults = stations
      } catch {
        this.nearFailed = true
      }
    },
    backToAll() {
      this.country = null
      this.near = false
    },
    kmText(km) {
      return this.$t('tides.explorer.km', { km: km < 10 ? this.formatNumber(Math.round(km * 10) / 10) : this.tideGrouped(Math.round(km)) })
    },
    stationRow(station, right) {
      const distance = right ?? (this.home ? this.kmText(haversineKm(this.home, station)) : '')
      return {
        key: station.id,
        title: station.name,
        sub: station.country,
        right: distance,
        aria: `${station.name}, ${station.country}`,
        active: this.pick?.id === station.id,
        onClick: () => this.chooseStation(station)
      }
    },
    countryRow(country) {
      const count = country.s.length
      const stations = this.$t('tides.explorer.stationCount', { count: this.formatNumber(count) }, count)
      return {
        key: country.name,
        title: country.name,
        sub: stations,
        right: '',
        aria: `${country.name}, ${stations}`,
        active: false,
        onClick: () => this.chooseCountry(country)
      }
    },
    chooseStation(station) {
      this.pick = station
      this.$refs.globe?.flyTo(station.lon, station.lat, Math.max(2.4, this.$refs.globe?.view?.zoom ?? 1))
    },
    chooseCountry(country) {
      this.country = country.name
      this.query = ''
      this.near = false
      this.pick = null
      this.$refs.globe?.flyTo(country.center[0], country.center[1], country.s.length > 300 ? 1.6 : 2.4)
    },
    view(station) {
      this.$emit('pick', station.id)
      this.requestClose()
    },
    onOpenChange(open) {
      if (!open && this.open) this.requestClose()
    }
  }
}
</script>
