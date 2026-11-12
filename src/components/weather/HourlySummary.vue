<template>
  <div class="relative h-full">
    <!-- the strip bleeds to the card edges (-mx = card padding) and snaps per card -->
    <div
      ref="scroller"
      :tabindex="loading ? undefined : 0"
      role="region"
      :aria-label="$t('hourly.scrollRegion')"
      class="-mx-4 flex h-[232px] snap-x snap-mandatory scroll-px-4 gap-2 overflow-y-hidden px-4 outline-none scrollbar-hide focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:-mx-6 md:scroll-px-6 md:px-6"
      :class="loading ? 'overflow-x-hidden' : 'overflow-x-auto'"
      :style="edgeMask"
      @scroll.passive="checkScroll"
    >
      <template v-if="!loading">
        <template v-for="(item, index) in items" :key="item.id">
          <div v-if="item.type === 'divider'" aria-hidden="true" class="mt-6 h-[208px] w-px flex-none bg-border" />

          <div v-else class="flex w-[72px] flex-none snap-start flex-col gap-2 md:w-20">
            <div class="h-4 whitespace-nowrap text-xs font-semibold leading-4 text-primary">{{ tagFor(item, index) }}</div>

            <!-- sunrise / sunset -->
            <div
              v-if="item.type === 'event'"
              class="flex h-[208px] flex-col items-center rounded-tile px-1 py-4"
            >
              <div class="h-4 whitespace-nowrap text-[13px] font-medium leading-4">{{ eventTime(item) }}</div>
              <div class="mt-4 flex size-10 items-center justify-center text-sun-arc">
                <AppIcon :name="item.kind" :size="28" :stroke-width="1.75" />
              </div>
              <div class="mt-4 h-6 text-sm font-medium leading-6">{{ $t(`hourly.${item.kind}`) }}</div>
            </div>

            <!-- hour: spans, because a button only takes phrasing content -->
            <button
              v-else
              type="button"
              aria-haspopup="dialog"
              :aria-label="cardLabel(item, index)"
              class="flex h-[208px] w-full touch-manipulation flex-col items-center rounded-tile px-1 py-4 outline-none hover:shadow-[inset_0_0_0_1px_hsl(var(--input))] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:shadow-[inset_0_0_0_999px_hsl(var(--foreground)/0.06)]"
              :class="isNow(index) ? 'bg-accent text-accent-foreground' : ''"
              @pointerdown="onCardPress"
              @pointercancel="press = null"
              @click="onCardClick(item, index, $event)"
            >
              <span class="h-4 whitespace-nowrap text-[13px] font-medium leading-4">
                {{ hourLabel(item, index) }}
              </span>
              <span class="mt-4 flex size-10 items-center justify-center">
                <img v-if="item.code" class="size-10 object-contain" :src="icon(item)" alt="" />
              </span>
              <span class="mt-4 h-6 text-xl font-medium leading-6 tabular-nums">{{ temp(item) }}</span>
              <span
                class="mt-6 flex h-4 items-center justify-center gap-0.5 text-xs leading-4 tabular-nums"
                :class="
                  item.rain >= 10
                    ? 'font-semibold text-rain'
                    : ['font-medium', isNow(index) ? '' : 'text-muted-foreground']
                "
                :title="$t('weather.chanceOfRain')"
              >
                <AppIcon name="droplet" :size="11" :stroke-width="2.2" class="flex-none" />
                <span>{{ formatRainChance(item.rain) }}</span>
              </span>
              <span class="mt-2 flex h-4 items-center justify-center gap-0.5 whitespace-nowrap text-xs leading-4 tabular-nums">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  class="size-3 flex-none"
                  :class="isNow(index) ? '' : 'text-chart-wind'"
                  :style="{ transform: `rotate(${item.windDegree + 180}deg)` }"
                >
                  <path d="M12 3 L19 21 L12 16.5 L5 21 Z" fill="currentColor" />
                </svg>
                <span class="font-medium">{{ formatNumber(Math.round(wind(item))) }}</span>
                <span :class="isNow(index) ? '' : 'text-muted-foreground'">{{ windUnit }}</span>
              </span>
            </button>
          </div>
        </template>
        <p v-if="!items.length" class="self-center text-sm text-muted-foreground">{{ $t('hourly.noData') }}</p>
      </template>

      <!-- skeleton (design/TidySkeleton hourly): the hour cards' own rows, the first
           one raised like "now"; the strip is clipped, not scrollable, meanwhile -->
      <template v-else>
        <div v-for="n in 20" :key="n" data-skeleton class="flex w-[72px] flex-none flex-col gap-2 md:w-20" aria-hidden="true">
          <div class="h-4" />
          <div class="flex h-[208px] flex-col items-center rounded-tile px-1 py-4" :class="{ 'bg-surface-raised': n === 1 }">
            <div class="flex h-4 items-center"><Skeleton class="h-2.5" :class="n === 1 ? 'w-7' : 'w-9'" /></div>
            <Skeleton class="mt-4 size-10 rounded-full" />
            <div class="mt-4 flex h-6 items-center"><Skeleton class="h-[18px] w-[30px]" /></div>
            <div class="mt-6 flex h-4 items-center"><Skeleton class="h-2.5 w-[30px]" /></div>
            <div class="mt-2 flex h-4 items-center"><Skeleton class="h-2.5 w-[42px]" /></div>
          </div>
        </div>
      </template>
    </div>

    <!-- md+: step buttons over the strip edges -->
    <button
      v-if="!loading && !atStart"
      type="button"
      :class="[stepButton, '-left-4']"
      :aria-label="$t('hourly.earlier')"
      @click="scrollStrip(-1)"
    >
      <AppIcon name="chevron-left" :size="18" />
    </button>
    <button
      v-if="!loading && !atEnd"
      type="button"
      :class="[stepButton, '-right-4']"
      :aria-label="$t('hourly.later')"
      @click="scrollStrip(1)"
    >
      <AppIcon name="chevron-right" :size="18" />
    </button>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import useUnitStore from '@/stores/unit'
import weatherMixin from '@/mixins/weatherMixin'
import AppIcon from '@/components/common/AppIcon.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { getWeatherIcon } from '@/constants/weatherIcons'
import { currentIntlTag } from '@/i18n'
import { formatAstroTime, prefersReducedMotion } from '@/utils/astro'

// a press that travels further than this is a swipe, not a tap
const TAP_SLOP_PX = 8

export default {
  name: 'HourlySummary',
  components: { AppIcon, Skeleton },
  mixins: [weatherMixin],
  props: {
    /** hourlyStrip() output: hour / event / divider items */
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    /** the first hour is the current one */
    live: { type: Boolean, default: false },
    today: { type: String, default: '' }
  },
  emits: ['select-hour'],
  data() {
    return {
      press: null,
      atStart: true,
      atEnd: false,
      stepButton:
        'absolute top-[108px] z-[2] hidden size-10 items-center justify-center rounded-full border bg-popover text-foreground shadow-[0_2px_8px_hsl(220_30%_4%/0.12)] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex'
    }
  },
  computed: {
    ...mapState(useUnitStore, ['unit']),
    celsius() {
      return this.unit === 'celsius'
    },
    windUnit() {
      return this.$t(this.celsius ? 'hourly.kmh' : 'hourly.mph')
    },
    firstHourIndex() {
      return this.items.findIndex((i) => i.type === 'hour')
    },
    // fade the strip into the card edge on whichever side has more to scroll
    edgeMask() {
      const left = this.atStart ? 0 : 40
      const right = this.atEnd ? 0 : 40
      const mask = `linear-gradient(to right, transparent 0, #000 ${left}px, #000 calc(100% - ${right}px), transparent 100%)`
      return { maskImage: mask, WebkitMaskImage: mask }
    }
  },
  watch: {
    items() {
      this.$nextTick(this.checkScroll)
    }
  },
  mounted() {
    this.checkScroll()
  },
  methods: {
    isNow(index) {
      return this.live && index === this.firstHourIndex
    },
    // day tag on the first card of the strip and on the first card after midnight
    tagFor(item, index) {
      const prev = this.items[index - 1]
      if (index === 0 || prev?.type === 'divider') return this.relativeDay(item.date, this.today)
      return ''
    },
    hourLabel(item, index) {
      return this.isNow(index) ? this.$t('hourly.now') : this.formatHour(item.hour)
    },
    cardLabel(item, index) {
      return this.$t('hourly.detail.openLabel', {
        day: this.relativeDay(item.date, this.today),
        time: this.hourLabel(item, index),
        temp: this.temp(item),
        condition: item.conditionText || ''
      })
    },
    onCardPress(event) {
      this.press = { x: event.clientX, y: event.clientY, scroll: this.$refs.scroller.scrollLeft }
    },
    wasSwipe(event) {
      const { press } = this
      this.press = null
      // detail 0 is a keyboard click, with no press to compare against
      if (!press || event.detail === 0) return false
      return (
        Math.abs(event.clientX - press.x) > TAP_SLOP_PX ||
        Math.abs(event.clientY - press.y) > TAP_SLOP_PX ||
        Math.abs(this.$refs.scroller.scrollLeft - press.scroll) > TAP_SLOP_PX
      )
    },
    onCardClick(item, index, event) {
      if (this.wasSwipe(event)) return
      this.$emit('select-hour', {
        hour: item,
        when: this.$t('hourly.detail.when', {
          day: this.relativeDay(item.date, this.today),
          time: this.hourLabel(item, index)
        }),
        opener: event.currentTarget
      })
    },
    temp(item) {
      const v = this.celsius ? item.tempC : item.tempF
      return typeof v === 'number' ? this.formatTemp(v) : '—'
    },
    wind(item) {
      return this.celsius ? item.windKph : item.windMph
    },
    icon(item) {
      return getWeatherIcon(item.code, item.isDay)
    },
    eventTime(item) {
      return formatAstroTime(item.time, currentIntlTag())
    },
    checkScroll() {
      const el = this.$refs.scroller
      if (!el) return
      this.atStart = el.scrollLeft < 4
      this.atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
    },
    scrollStrip(direction) {
      const el = this.$refs.scroller
      if (!el) return
      el.scrollBy({ left: direction * el.clientWidth * 0.75, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    }
  }
}
</script>
