<template>
  <div class="-mt-2 xl:-mt-3">
    <!-- design/TidyWear; placement from "Tidy Wear Responsive" section 03. One outfit for the
         chosen window (now / today / tomorrow / a part of the day), derived from the forecast
         the weather store already has. The choice of window lasts while you stay on the page. -->
    <p role="status" class="sr-only">{{ loading ? $t('loading.wear') : '' }}</p>
    <div class="flex items-center justify-between">
      <NuxtLink
        to="/"
        class="-ml-2 mb-1 inline-flex h-11 items-center gap-0.5 rounded-full pl-1 pr-3 text-sm font-medium text-muted-foreground outline-ring hover:text-foreground focus-visible:outline focus-visible:outline-2"
      >
        <AppIcon name="chevron-left" :size="18" :stroke-width="2" />
        <span>{{ $t('wear.page.back') }}</span>
      </NuxtLink>
      <ShareButton variant="icon" origin="wear" />
    </div>

    <div
      class="mb-4 flex flex-wrap items-start justify-between gap-4 sm:mb-5 sm:items-end"
      :aria-busy="loading ? 'true' : undefined"
    >
      <div class="min-w-0">
        <div class="mb-1 text-[13px] font-medium leading-4 text-muted-foreground">
          {{ $t('wear.title') }}
        </div>
        <div v-if="loading" class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Skeleton class="my-[5px] h-[22px] w-[170px] sm:my-[9px] sm:w-[220px]" />
          <Skeleton class="h-3 w-[150px]" />
        </div>
        <div v-else class="flex flex-wrap items-baseline gap-x-3 gap-y-1" :class="fadeClass">
          <h1 class="m-0 text-2xl font-semibold leading-[1.2] tracking-[-0.01em] sm:text-[32px]">
            {{ placeName }}
          </h1>
          <span class="text-[15px] text-muted-foreground" data-wear-meta>{{ placeMeta }}</span>
        </div>
      </div>
      <div class="hidden flex-none sm:block">
        <SegmentedControl
          kind="radio"
          :aria-label="$t('wear.page.figure')"
          :options="figureOptions"
          :model-value="wearPrefs.figure"
          @update:model-value="setPref('figure', $event)"
        />
      </div>
    </div>

    <WearTabs
      class="mb-4 sm:mb-6"
      :tabs="tabs"
      :label="$t('wear.page.when')"
      :disabled="loading"
      @pick="pick"
    />

    <div class="grid grid-cols-12 items-start gap-4 sm:gap-6">
      <WearHero
        class="col-span-12 lg:col-span-7 lg:row-start-1"
        v-model:look="look"
        :win="loading ? null : win"
        :looks="loading ? [] : looks"
        :tod="tod"
        :figure="wearPrefs.figure"
        :kicker="pill"
        :feels="feelsPill"
        :fade-class="fadeClass"
        :text="wearT"
      />
      <WearPieces
        class="col-span-12 lg:col-span-5 lg:col-start-8 lg:row-start-1"
        :rec="loading ? null : rec"
        :figure="wearPrefs.figure"
        :fade-class="fadeClass"
        :text="wearT"
      />
      <WearDayParts
        class="col-span-12 lg:row-start-2"
        :windows="wearWindows"
        :win="win"
        :figure="wearPrefs.figure"
        :loading="loading"
        :fade-class="fadeClass"
        :recommend="dayRecommend"
        :span="wearSpan"
        :temp="wearFmt.temp"
        :text="wearT"
        @pick="pick"
      />
      <WearTake
        class="col-span-12 lg:col-span-5 lg:col-start-8 lg:row-start-3"
        :rec="rec"
        :loading="loading"
        :fade-class="fadeClass"
        :text="wearT"
      />
      <WearWhy
        class="col-span-12 lg:col-span-7 lg:row-start-3"
        :rec="rec"
        :summary="summary"
        :loading="loading"
        :fade-class="fadeClass"
        :fmt="wearFmt"
        :text="wearT"
        :span="wearSpan"
      />
      <WearWardrobe class="col-span-12 lg:row-start-5" />
      <WearSettings class="col-span-12 lg:row-start-4" />
    </div>

    <p
      v-if="placeName"
      class="m-0 mt-4 max-w-[720px] text-[13px] leading-[18px] text-muted-foreground sm:mt-6"
    >
      {{ $t('wear.page.foot', { place: placeName }) }}
    </p>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'
import { mapState } from 'pinia'
import AppIcon from '@/components/common/AppIcon.vue'
import ShareButton from '@/components/share/ShareButton.vue'
import SegmentedControl from '@/components/common/SegmentedControl.vue'
import { Skeleton } from '@/components/ui/skeleton'
import WearHero from '@/components/wear/WearHero.vue'
import WearPieces from '@/components/wear/WearPieces.vue'
import WearDayParts from '@/components/wear/WearDayParts.vue'
import WearTake from '@/components/wear/WearTake.vue'
import WearWhy from '@/components/wear/WearWhy.vue'
import WearSettings from '@/components/wear/WearSettings.vue'
import WearWardrobe from '@/components/wear/WearWardrobe.vue'
import WearTabs from '@/components/wear/WearTabs.vue'
import { useWeatherSkeleton } from '@/composables/useSkeletonGate'
import wearMixin from '@/mixins/wearMixin'
import weatherMixin from '@/mixins/weatherMixin'
import useWeatherStore from '@/stores/weather'
import useWearStore from '@/stores/wear'
import { recommend, todOf } from '@/utils/wear'
import { buildLooks } from '@/utils/wearLooks'

export default {
  name: 'WearPage',
  components: {
    ShareButton,
    AppIcon,
    SegmentedControl,
    Skeleton,
    WearHero,
    WearPieces,
    WearDayParts,
    WearTake,
    WearWhy,
    WearSettings,
    WearWardrobe,
    WearTabs
  },
  mixins: [weatherMixin, wearMixin],
  setup() {
    const { t } = useI18n()
    useHead({ title: () => `${t('wear.title')} · Tidy` })
    return useWeatherSkeleton()
  },
  data() {
    // look: which of the hero's looks is on screen (0 = the dashboard tile's pick)
    return { winId: 'today', look: 0 }
  },
  computed: {
    ...mapState(useWeatherStore, ['coords']),
    win() {
      const ws = this.wearWindows
      return (
        ws.find((w) => w.id === this.winId) || ws.find((w) => w.id === 'today') || ws[0] || null
      )
    },
    loading() {
      return this.showSkeleton || !this.win
    },
    // up to three outfits for the window; the page follows the one on screen
    looks() {
      return this.win ? buildLooks(this.win.summary, this.wearPrefs, this.wearFmt) : []
    },
    lookShuffle() {
      return this.looks[this.look]?.shuffle || 0
    },
    rec() {
      return this.looks[this.look]?.rec || this.looks[0]?.rec || null
    },
    // a new window, figure, style or any other setting starts again from look 1
    lookResetKey() {
      return JSON.stringify([this.winId, this.wearPrefs])
    },
    summary() {
      return this.win?.summary || null
    },
    // the street takes the window's light; Now and Today use the current hour
    tod() {
      if (!this.win) return 'day'
      const live = this.win.id === 'now' || this.win.id === 'today'
      return live ? todOf(this.summary, this.wearNowHour) : todOf(this.summary)
    },
    placeName() {
      return this.coords?.name || ''
    },
    placeMeta() {
      const date = this.win?.hours[0]?.time.slice(0, 10)
      const day = date
        ? this.formatDate(date, { weekday: 'short', month: 'short', day: 'numeric' })
        : ''
      return [this.coords?.country, day].filter(Boolean).join(' · ')
    },
    figureOptions() {
      return ['man', 'woman'].map((value) => ({ value, label: this.$t(`wear.page.${value}`) }))
    },
    // Now, Today (or Tonight), Tomorrow. A part of the day keeps its day's tab selected.
    tabs() {
      const sel = this.win ? (this.win.group === 'main' ? this.win.id : this.win.day) : 'today'
      const main = this.wearWindows.filter((w) => w.group === 'main')
      const src = main.length ? main : ['now', 'today', 'tomorrow'].map((id) => ({ id }))
      return src.map((w) => ({
        id: w.id,
        on: w.id === sel,
        label: this.$t(`wear.window.${w.tonight ? 'tonight' : w.id}`),
        sub: !w.summary ? '' : w.id === 'now' ? this.$t('wear.next3') : this.wearSpan(w.summary)
      }))
    },
    // where the hero says it is: "Today · 1 PM–10 PM", "Tomorrow morning · 6 AM–12 PM"
    pill() {
      return this.win ? this.windowName(this.win) : ''
    },
    feelsPill() {
      const s = this.summary
      if (!s) return ''
      const t = this.wearFmt.temp
      return Math.round(s.feelsMin) === Math.round(s.feelsMax)
        ? this.$t('wear.feelsShort.one', { t: t(s.feelsMin) })
        : this.$t('wear.feelsShort.span', { lo: t(s.feelsMin), hi: t(s.feelsMax) })
    }
  },
  watch: {
    lookResetKey() {
      this.look = 0
    }
  },
  methods: {
    // Through the day: the tile for the window on screen wears the chosen look
    dayRecommend(w) {
      const shuffle = w.id === this.win?.id ? this.lookShuffle : 0
      return recommend(w.summary, { ...this.wearPrefs, shuffle }, this.wearFmt)
    },
    pick(id) {
      this.winId = id
    },
    setPref(key, value) {
      useWearStore().set(key, value)
    },
    windowName(w) {
      if (w.id === 'now') return this.$t('wear.next3')
      const when = w.part
        ? this.$t(`wear.part.${w.day}.${w.part}`)
        : this.$t(`wear.window.${w.tonight ? 'tonight' : w.id}`)
      return this.$t('wear.kicker', { when, span: this.wearSpan(w.summary) })
    }
  }
}
</script>
