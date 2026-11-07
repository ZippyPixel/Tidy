<template>
  <div class="-mt-2 xl:-mt-3">
    <!-- design/TidyTides; breakpoints and placement from "Tidy Tides Responsive" section 04 -->
    <NuxtLink
      to="/"
      class="-ml-2 mb-1 inline-flex h-11 items-center gap-0.5 rounded-full pl-1 pr-3 text-sm font-medium text-muted-foreground outline-ring hover:text-foreground focus-visible:outline focus-visible:outline-2"
    >
      <AppIcon name="chevron-left" :size="18" :stroke-width="2" />
      <span>{{ $t('tides.page.back') }}</span>
    </NuxtLink>

    <div class="mb-4 flex flex-col items-start gap-3 md:mb-6 md:flex-row md:items-end md:justify-between md:gap-6">
      <div class="min-w-0">
        <div class="mb-1 text-[13px] font-medium leading-4 text-muted-foreground">{{ $t('tides.title') }}</div>
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 class="text-[clamp(1.25rem,1rem+1vw,1.625rem)] font-semibold leading-[1.2] tracking-[-0.01em]">
            {{ station?.name || $t('tides.tideTimes') }}
          </h1>
          <span v-if="meta" data-meta class="text-[15px] text-muted-foreground">{{ meta }}</span>
        </div>
        <div v-if="distanceLine" data-distance class="mt-1 text-[13px] leading-[18px] tabular-nums text-muted-foreground">{{ distanceLine }}</div>
      </div>
      <button type="button" data-change aria-haspopup="dialog" :class="pillButton" @click="openExplorer($event)">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          class="size-[18px] flex-none"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14 14 0 0 1 0 18" />
          <path d="M12 3a14 14 0 0 0 0 18" />
        </svg>
        <span>{{ $t('tides.page.changeStation') }}</span>
      </button>
    </div>

    <div v-if="station" class="grid grid-cols-12 items-stretch gap-3 sm:gap-4 md:gap-6">
      <!-- source order is the phone order; md and xl re-place the cards -->
      <TideNow
        :tides="tides"
        :now="now"
        :home-zone="coords?.tzId"
        class="col-span-12 md:col-span-6 md:col-start-1 md:row-start-2 xl:col-span-4"
      />

      <DashboardCard :title="$t('tides.chart.title')" class="col-span-12 md:row-start-1">
        <template #actions>
          <SegmentedControl
            kind="tabs"
            :aria-label="$t('tides.chart.rangeLabel')"
            :options="views"
            :model-value="view"
            @update:model-value="view = $event"
          />
        </template>
        <div class="flex min-h-12 items-center justify-between gap-2">
          <button
            v-if="view === 'day'"
            type="button"
            data-previous
            :aria-label="$t('tides.chart.previousDay')"
            :disabled="day <= -1"
            :class="dayButton"
            @click="day -= 1"
          >
            <AppIcon name="chevron-left" :size="18" :stroke-width="2" />
          </button>
          <div aria-live="polite" class="flex min-w-0 flex-1 flex-col items-center text-center">
            <span data-range-title class="whitespace-nowrap text-base font-semibold leading-6">{{ rangeTitle }}</span>
            <span data-range-tag class="min-h-4 text-xs font-semibold uppercase leading-4 tracking-[0.06em] text-primary">{{ rangeTag }}</span>
          </div>
          <button
            v-if="view === 'day'"
            type="button"
            data-next-day
            :aria-label="$t('tides.chart.nextDay')"
            :disabled="day >= 6"
            :class="dayButton"
            @click="day += 1"
          >
            <AppIcon name="chevron-right" :size="18" :stroke-width="2" />
          </button>
        </div>
        <TideChart :tides="tides" :view="view" :day="day" :now="now" />
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-4 text-muted-foreground">
          <span class="flex items-center gap-1.5"><span class="size-[9px] rounded-full bg-tide" />{{ $t('tides.chart.high') }}</span>
          <span class="flex items-center gap-1.5"><span class="size-[9px] rounded-full border-2 border-tide" />{{ $t('tides.chart.low') }}</span>
          <span class="flex items-center gap-1.5">
            <span class="h-[9px] w-3.5 rounded-sm bg-chart-night shadow-[inset_0_0_0_1px_hsl(var(--border))]" />{{ $t('tides.chart.night') }}
          </span>
          <span data-note>{{ chartNote }}</span>
        </div>
      </DashboardCard>

      <TodayTides
        :tides="tides"
        :now="now"
        :day="view === 'day' ? day : 0"
        class="col-span-12 md:col-span-6 md:col-start-7 md:row-start-2 xl:col-span-4 xl:col-start-5"
      />
      <TideWeek :tides="tides" :now="now" class="col-span-12 md:row-start-3 xl:col-span-8" />
      <MoonTides
        :tides="tides"
        :now="now"
        :day="view === 'day' ? day : 0"
        class="col-span-12 md:col-span-6 md:col-start-1 md:row-start-4 xl:col-span-4 xl:col-start-9 xl:row-start-2"
      />
      <StationAbout
        :station="station"
        :attribution="tides.credit.attribution"
        class="col-span-12 md:col-span-6 md:col-start-7 md:row-start-4 xl:col-span-4 xl:col-start-9 xl:row-start-3"
      />
      <NearbyStations
        :stations="station.nearby"
        class="col-span-12 md:row-start-5 xl:row-start-4"
        @select="selectStation"
        @explore="openExplorer"
      />
    </div>

    <DashboardCard v-else-if="state === 'loading'" :title="$t('tides.chart.title')">
      <div data-loading>
        <TideChart :tides="null" :now="now" />
      </div>
    </DashboardCard>

    <section v-else data-empty class="flex flex-col items-start gap-4 rounded-card border bg-card p-6 md:p-10">
      <svg viewBox="0 0 48 48" aria-hidden="true" class="size-12 fill-none stroke-tide" stroke-width="2" stroke-linecap="round">
        <path d="M4 20c5 0 5-4 10-4s5 4 10 4 5-4 10-4 5 4 10 4" />
        <path d="M4 30c5 0 5-4 10-4s5 4 10 4 5-4 10-4 5 4 10 4" opacity="0.5" />
      </svg>
      <div class="flex max-w-[560px] flex-col gap-1.5">
        <span class="text-lg font-semibold leading-6">{{ $t(emptyCopy.title) }}</span>
        <span class="text-sm leading-[21px] text-muted-foreground [text-wrap:pretty]">{{ $t(emptyCopy.body) }}</span>
      </div>
      <button v-if="state === 'notFound'" type="button" data-back-home :class="pillButton" @click="clearStation">{{ backLabel }}</button>
      <button v-else-if="state === 'error'" type="button" data-retry :class="pillButton" @click="load(true)">{{ $t('tides.empty.retry') }}</button>
      <button v-else type="button" data-empty-explore aria-haspopup="dialog" :class="pillButton" @click="openExplorer($event)">
        {{ $t('tides.none.cta') }}
      </button>
    </section>

    <footer class="mt-6 flex max-w-[760px] flex-col gap-1.5 border-t pt-5 text-[13px] leading-[19px] text-muted-foreground md:mt-8">
      <p>{{ $t('tides.footer.disclaimer') }}</p>
      <TideCredit v-if="footerCredit" data-credit :text="footerCredit" class="[overflow-wrap:anywhere]" />
    </footer>

    <ClientOnly>
      <StationExplorer
        v-if="explorerMounted"
        :open="explorerOpen"
        :opener="explorerOpener"
        :selected="station"
        :home="coords"
        @pick="pickStation"
        @close="onExplorerClosed"
      />
    </ClientOnly>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { mapState, mapStores } from 'pinia'
import AppIcon from '@/components/common/AppIcon.vue'
import DashboardCard from '@/components/common/DashboardCard.vue'
import SegmentedControl from '@/components/common/SegmentedControl.vue'
import MoonTides from '@/components/tides/MoonTides.vue'
import NearbyStations from '@/components/tides/NearbyStations.vue'
import StationAbout from '@/components/tides/StationAbout.vue'
import TideChart from '@/components/tides/TideChart.vue'
import TideCredit from '@/components/tides/TideCredit.vue'
import TideNow from '@/components/tides/TideNow.vue'
import TideWeek from '@/components/tides/TideWeek.vue'
import TodayTides from '@/components/tides/TodayTides.vue'
import tideMixin from '@/mixins/tideMixin'
import tideNow from '@/mixins/tideNow'
import weatherMixin from '@/mixins/weatherMixin'
import useTidesStore from '@/stores/tides'
import useWeatherStore from '@/stores/weather'
import { addDays, dateInZone, zoneOffsetMin } from '@/utils/tideTime'
import { dayIndexAt, haversineKm, offsetParts } from '@/utils/tides'

const NAMED_DATUMS = ['LAT', 'MLLW', 'MLW', 'MSL']
const SHORT_DATE = { month: 'short', day: 'numeric' }

export default {
  name: 'TidesPage',
  components: {
    AppIcon,
    DashboardCard,
    MoonTides,
    NearbyStations,
    SegmentedControl,
    StationAbout,
    // the globe and its data only load when someone opens it
    StationExplorer: defineAsyncComponent(() => import('@/components/tides/StationExplorer.vue')),
    TideChart,
    TideCredit,
    TideNow,
    TideWeek,
    TodayTides
  },
  mixins: [weatherMixin, tideMixin, tideNow],
  setup() {
    const { t } = useI18n()
    useHead({ title: () => `${t('tides.title')} · Tidy` })
  },
  data() {
    return {
      view: 'day',
      day: 0,
      explorerMounted: false,
      explorerOpen: false,
      explorerOpener: null,
      // set while the explorer closes: on a phone that takes a history step
      pendingStation: null,
      pillButton:
        'inline-flex h-11 flex-none items-center gap-2 whitespace-nowrap rounded-full border bg-card px-[18px] text-sm font-semibold text-foreground outline-ring hover:bg-foreground/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:bg-foreground/10',
      dayButton:
        'flex size-11 flex-none items-center justify-center rounded-full border outline-ring enabled:hover:bg-foreground/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-35'
    }
  },
  computed: {
    ...mapStores(useTidesStore),
    ...mapState(useWeatherStore, ['coords', 'isLoading']),
    stationId() {
      const id = this.$route.query.station
      return typeof id === 'string' && id ? id : null
    },
    slot() {
      return this.stationId ? this.tidesStore.chosen : this.tidesStore.nearest
    },
    tides() {
      return this.slot.data
    },
    station() {
      return this.tides?.station ?? null
    },
    state() {
      if (this.station) return 'live'
      if (this.slot.status === 'notFound' || this.slot.status === 'error') return this.slot.status
      if (this.tides) return 'none'
      // nothing to look up until the weather says where we are
      if (!this.stationId && !this.coords && !this.isLoading) return 'pick'
      return 'loading'
    },
    emptyCopy() {
      if (this.state === 'notFound') return { title: 'tides.empty.notFoundTitle', body: 'tides.empty.notFoundBody' }
      if (this.state === 'error') return { title: 'tides.empty.errorTitle', body: 'tides.empty.errorBody' }
      if (this.state === 'none') return { title: 'tides.none.title', body: 'tides.none.body' }
      return { title: 'tides.empty.pickTitle', body: 'tides.empty.pickBody' }
    },
    backLabel() {
      const name = this.tidesStore.nearest.data?.station?.name
      return name ? this.$t('tides.empty.backTo', { name }) : this.$t('tides.empty.backNearest')
    },
    zone() {
      return this.station?.timezone
    },
    meta() {
      return this.station ? [this.station.country, this.station.region].filter(Boolean).join(' · ') : ''
    },
    distanceKm() {
      if (!this.station) return null
      if (this.station.distanceKm !== null) return this.station.distanceKm
      return this.coords ? Math.round(haversineKm(this.coords, this.station)) : null
    },
    zoneText() {
      const { hours, minutes, negative } = offsetParts(zoneOffsetMin(this.now, this.zone))
      const pad = minutes ? `:${String(minutes).padStart(2, '0')}` : ''
      return this.$t('tides.page.timesIn', {
        zone: this.zone.replace(/_/g, ' '),
        offset: `${negative ? '−' : '+'}${hours}${pad}`
      })
    },
    distanceLine() {
      if (!this.station) return ''
      const parts = [this.zoneText]
      if (this.distanceKm !== null && this.coords) {
        parts.unshift(this.$t('tides.page.kmFrom', { km: this.formatNumber(this.distanceKm), place: this.coords.name }))
      }
      return parts.join(' · ')
    },
    views() {
      return [
        { value: 'day', label: this.$t('tides.chart.day') },
        { value: 'week', label: this.$t('tides.chart.week') }
      ]
    },
    todayDate() {
      return dateInZone(this.now, this.zone)
    },
    selectedDate() {
      const today = dayIndexAt(this.tides, this.now)
      const last = this.tides.days.length - 1
      return this.tides.days[Math.max(0, Math.min(last, today + this.day))].date
    },
    rangeTitle() {
      if (this.view === 'day') return this.tideDate(this.selectedDate, { weekday: 'long', month: 'long', day: 'numeric' })
      const start = this.todayDate
      const end = addDays(start, 6)
      const sameMonth = start.slice(0, 7) === end.slice(0, 7)
      return `${this.tideDate(start, SHORT_DATE)} – ${sameMonth ? this.formatNumber(Number(end.slice(8))) : this.tideDate(end, SHORT_DATE)}`
    },
    rangeTag() {
      if (this.view === 'week') return this.$t('tides.chart.next7')
      const key = { '-1': 'yesterday', 0: 'today', 1: 'tomorrow' }[this.day]
      return key ? this.$t(`tides.chart.${key}`) : ''
    },
    chartNote() {
      const { datum } = this.station
      return this.$t('tides.chart.note', {
        unit: this.$t(this.unit === 'celsius' ? 'tides.metres' : 'tides.feet'),
        datum: NAMED_DATUMS.includes(datum) ? this.$t(`tides.chart.datums.${datum}`) : datum
      })
    },
    footerCredit() {
      const credit = this.tides?.credit
      if (!credit) return ''
      const project = this.$t('tides.footer.credit', { project: credit.project })
      return credit.source ? `${project} ${credit.source}` : project
    }
  },
  watch: {
    stationId() {
      this.day = 0
      this.load()
    },
    coords() {
      this.load()
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    load(force = false) {
      const slot = this.stationId ? 'chosen' : 'nearest'
      // a retry has to get past the "already loaded this" check
      if (force) this.tidesStore[slot].key = null
      // the nearest one always loads, for the way back from a station that doesn't exist
      this.tidesStore.loadNearest(this.coords)
      if (this.stationId) this.tidesStore.loadStation(this.stationId)
    },
    openExplorer(event) {
      this.explorerOpener = event?.currentTarget ?? null
      this.explorerMounted = true
      this.explorerOpen = true
    },
    // The explorer closes itself after a pick. Only once it has, including its history step
    // on a phone, is it safe to change the URL: sooner would race that step.
    pickStation(id) {
      this.pendingStation = id
    },
    onExplorerClosed() {
      this.explorerOpen = false
      const id = this.pendingStation
      this.pendingStation = null
      if (id) this.selectStation(id)
    },
    selectStation(id) {
      this.$router.replace({ query: { ...this.$route.query, station: id } })
    },
    clearStation() {
      this.$router.replace({ query: {} })
    }
  }
}
</script>
