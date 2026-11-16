<template>
  <div class="-mt-2 xl:-mt-3">
    <!-- design/TidySky; placement from "Tidy Sun Moon Responsive" section 04.
         The page is a function of { place, instant }, both kept in the URL (utils/skyRoute). -->
    <SkeletonGate v-slot="{ showSkeleton, fadeClass }" :loading="loading">
      <p role="status" class="sr-only">{{ showSkeleton ? $t('loading.sky') : '' }}</p>
      <NuxtLink
        to="/"
        class="-ml-2 mb-1 inline-flex h-11 items-center gap-0.5 rounded-full pl-1 pr-3 text-sm font-medium text-muted-foreground outline-ring hover:text-foreground focus-visible:outline focus-visible:outline-2"
      >
        <AppIcon name="chevron-left" :size="18" :stroke-width="2" />
        <span>{{ $t('tides.page.back') }}</span>
      </NuxtLink>

      <div class="mb-4 min-w-0 md:mb-6">
        <div class="mb-1 text-[13px] font-medium leading-4 text-muted-foreground">
          {{ $t('sky.title') }}
        </div>
        <div v-if="showSkeleton && !place" data-skeleton class="flex flex-col">
          <Skeleton class="my-[4.5px] h-[22px] w-[170px] md:my-[5px] md:w-[210px]" />
          <Skeleton class="mt-1.5 h-3 w-full max-w-[330px]" />
        </div>
        <template v-else-if="place">
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1
              data-place-name
              class="text-[clamp(1.25rem,1rem+1vw,1.625rem)] font-semibold leading-[1.2] tracking-[-0.01em]"
            >
              {{ place.name }}
            </h1>
            <span v-if="place.country" class="text-[15px] text-muted-foreground">{{
              place.country
            }}</span>
          </div>
          <div
            data-summary
            aria-live="polite"
            class="mt-1 min-h-5 text-sm leading-5 tabular-nums text-muted-foreground"
          >
            <Skeleton v-if="showSkeleton" class="my-1 h-3 w-full max-w-[330px]" />
            <span v-else :class="fadeClass">{{ summary }}</span>
          </div>
        </template>
      </div>

      <section
        v-if="failed"
        data-failed
        class="rounded-card border bg-card p-6 text-[15px] text-muted-foreground md:p-10"
      >
        {{ $t('sky.failed') }}
      </section>
      <section
        v-else-if="!place && !showSkeleton"
        data-no-place
        class="flex flex-col items-start gap-4 rounded-card border bg-card p-6 md:p-10"
      >
        <span class="text-[15px] text-muted-foreground">{{ $t('sky.noPlace') }}</span>
        <button
          type="button"
          data-choose-place
          aria-haspopup="dialog"
          :class="pillButton"
          @click="openExplorer($event)"
        >
          {{ $t('sky.choosePlace') }}
        </button>
      </section>
      <SkySkeleton v-else-if="showSkeleton" />
      <div v-else :class="[grid, fadeClass]">
        <TimeBar
          :class="layout.bar"
          :place="place"
          :away="away"
          :home-name="home?.name ?? ''"
          :t="t"
          :now="nowMs"
          :tz="tz"
          :live="live"
          :sky="sky"
          :day="day"
          :ahead="ahead"
          :sun-up="now.sun.alt > -0.833"
          @commit="commit"
          @preview="preview"
          @live="goLive"
          @open-place="openExplorer"
          @reset-place="resetPlace"
        />
        <SkyPathChart
          :class="layout.chart"
          :t="t"
          :tz="tz"
          :day="day"
          :next-day="nextDay"
          :now="now"
          @preview="preview(atMinute(t, tz, $event))"
          @commit="commit(atMinute(t, tz, $event))"
        />
        <WhereToLook
          :class="layout.look"
          :t="t"
          :tz="tz"
          :day="day"
          :next-day="nextDay"
          :now="now"
        />
        <SunCard :class="layout.sun" :t="t" :tz="tz" :day="day" :prev-day="prevDay" :now="now" />
        <MoonCard
          :class="layout.moon"
          :t="t"
          :tz="tz"
          :sky="sky"
          :day="day"
          :ahead="ahead"
          :now="now"
          @commit="commit"
        />
        <SunEarthMoon :class="layout.geo" :t="t" :tz="tz" :now="now" />
        <PrayerTimes :class="layout.prayer" :t="t" :tz="tz" :sky="sky" :ds="ds" />
      </div>

      <footer
        v-if="place"
        class="mt-6 max-w-[760px] border-t pt-5 text-[13px] leading-[19px] text-muted-foreground md:mt-8"
      >
        <p>{{ $t('sky.footer', { place: place.name }) }}</p>
      </footer>
    </SkeletonGate>

    <ClientOnly>
      <StationExplorer
        v-if="explorerMounted"
        kind="places"
        :open="explorerOpen"
        :opener="explorerOpener"
        :selected="place"
        :home="coords"
        @pick="pendingPlace = $event"
        @close="onExplorerClosed"
      />
    </ClientOnly>
  </div>
</template>

<script>
import { defineAsyncComponent, markRaw, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { mapState } from 'pinia'
import AppIcon from '@/components/common/AppIcon.vue'
import SkeletonGate from '@/components/common/SkeletonGate.vue'
import SkySkeleton from '@/components/skeletons/SkySkeleton.vue'
import { SKY_GRID, SKY_PLACE } from '@/components/sky/layout'
import MoonCard from '@/components/sky/MoonCard.vue'
import PrayerTimes from '@/components/sky/PrayerTimes.vue'
import SkyPathChart from '@/components/sky/SkyPathChart.vue'
import SunCard from '@/components/sky/SunCard.vue'
import SunEarthMoon from '@/components/sky/SunEarthMoon.vue'
import TimeBar from '@/components/sky/TimeBar.vue'
import WhereToLook from '@/components/sky/WhereToLook.vue'
import { Skeleton } from '@/components/ui/skeleton'
import skyMixin from '@/mixins/skyMixin'
import useWeatherStore from '@/stores/weather'
import {
  atMinute,
  createSky,
  dayStart,
  dayStartAt,
  formatT,
  nextDayStart,
  nextEvent,
  parseT,
  phaseKey
} from '@/utils/sky'
import {
  homePlace,
  placeFromQuery,
  samePlace,
  timeFromQuery,
  withPlace,
  withTime
} from '@/utils/skyRoute'

const LIVE_TICK_MS = 30000

export default {
  name: 'SunMoonPage',
  components: {
    AppIcon,
    Skeleton,
    SkeletonGate,
    SkySkeleton,
    // the globe and its data only load when someone opens it
    StationExplorer: defineAsyncComponent(() => import('@/components/tides/StationExplorer.vue')),
    MoonCard,
    PrayerTimes,
    SkyPathChart,
    SunCard,
    SunEarthMoon,
    TimeBar,
    WhereToLook
  },
  mixins: [skyMixin],
  setup() {
    const { t } = useI18n()
    useHead({ title: () => `${t('sky.title')} · Tidy` })
    // astronomy-engine, imported only on this page and only in the browser
    return { astronomy: shallowRef(null) }
  },
  data() {
    return {
      nowMs: Date.now(),
      failed: false,
      // the instant under the pointer while dragging; the URL changes on release
      dragT: null,
      explorerMounted: false,
      explorerOpen: false,
      explorerOpener: null,
      // set while the finder closes: on a phone that takes a history step
      pendingPlace: null,
      grid: SKY_GRID,
      layout: SKY_PLACE,
      pillButton:
        'inline-flex h-11 flex-none items-center gap-2 whitespace-nowrap rounded-full border bg-card px-[18px] text-sm font-semibold text-foreground outline-ring hover:bg-foreground/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
    }
  },
  computed: {
    ...mapState(useWeatherStore, ['coords', 'weatherPending']),
    home() {
      return homePlace(this.coords)
    },
    urlPlace() {
      return placeFromQuery(this.$route.query)
    },
    place() {
      return this.urlPlace ?? this.home
    },
    away() {
      return !!this.urlPlace && !samePlace(this.urlPlace, this.home)
    },
    tz() {
      return this.place?.tz ?? 'UTC'
    },
    /** the chosen instant from the URL, or null when live */
    chosenT() {
      const text = timeFromQuery(this.$route.query)
      return text && this.place ? parseT(text, this.tz) : null
    },
    live() {
      return this.chosenT == null
    },
    /** what every card shows: the drag, else the chosen instant, else now */
    t() {
      return this.dragT ?? this.chosenT ?? this.nowMs
    },
    loading() {
      if (this.failed) return false
      if (!this.place) return this.weatherPending
      return !this.astronomy
    },
    sky() {
      return this.astronomy && this.place ? markRaw(createSky(this.astronomy, this.place)) : null
    },
    ds() {
      return dayStart(this.t, this.tz)
    },
    day() {
      return this.sky.day(this.ds)
    },
    nextDay() {
      return this.sky.day(nextDayStart(this.ds, this.tz))
    },
    prevDay() {
      return this.sky.day(dayStartAt(this.ds, this.tz, -1))
    },
    ahead() {
      return this.sky.ahead(this.ds)
    },
    /** positions at the instant: the one thing recomputed on every frame of a drag */
    now() {
      return this.sky.instant(this.t)
    },
    // the line under the heading is announced, so it follows the released instant, not the drag
    summary() {
      if (!this.sky) return ''
      const t = this.chosenT ?? this.nowMs
      const ds = dayStart(t, this.tz)
      const day = this.sky.day(ds)
      const next = this.sky.day(nextDayStart(ds, this.tz))
      const at = this.sky.instant(t)
      const up = at.sun.alt > -0.833
      const event = nextEvent(
        [
          ['rise', day.sun.rise],
          ['set', day.sun.set],
          ['rise', next.sun.rise],
          ['set', next.sun.set]
        ],
        t
      )
      return this.$t('sky.summary', {
        date: this.skyDate(t, this.tz, { weekday: 'long', month: 'long', day: 'numeric' }),
        time: this.skyClock(t, this.tz),
        sun: this.$t(up ? 'sky.sunUp' : 'sky.sunDown'),
        next: this.skyNextText(event, up, t, this.tz),
        phase: this.$t(`sky.phases.${phaseKey(at.phase)}`)
      })
    }
  },
  mounted() {
    this.loadAstronomy()
    this.timer = setInterval(() => {
      if (this.live && this.dragT == null) this.nowMs = Date.now()
    }, LIVE_TICK_MS)
  },
  beforeUnmount() {
    clearInterval(this.timer)
    if (this.frame) cancelAnimationFrame(this.frame)
  },
  methods: {
    atMinute,
    async loadAstronomy() {
      try {
        this.astronomy = markRaw(await import('astronomy-engine'))
      } catch {
        this.failed = true
      }
    },
    query(next) {
      return this.$router.replace({ query: next })
    },
    // drags redraw at most once per animation frame
    preview(t) {
      this.pendingT = t
      if (this.frame) return
      this.frame = requestAnimationFrame(() => {
        this.frame = null
        this.dragT = this.pendingT
      })
    },
    async commit(t) {
      if (this.frame) cancelAnimationFrame(this.frame)
      this.frame = null
      this.dragT = t
      await this.query(withTime(this.$route.query, formatT(t, this.tz)))
      this.dragT = null
    },
    goLive() {
      this.nowMs = Date.now()
      this.query(withTime(this.$route.query, null))
    },
    // `t` is the place's wall clock, so keeping it keeps the chosen clock time in the new zone
    resetPlace() {
      this.query(withPlace(this.$route.query, null))
    },
    openExplorer(event) {
      this.explorerOpener = event?.currentTarget ?? null
      this.explorerMounted = true
      this.explorerOpen = true
    },
    // only change the URL once the finder has closed (and taken its history step on a phone)
    onExplorerClosed() {
      this.explorerOpen = false
      const place = this.pendingPlace
      this.pendingPlace = null
      if (!place) return
      this.query(withPlace(this.$route.query, samePlace(place, this.home) ? null : place))
    }
  }
}
</script>
