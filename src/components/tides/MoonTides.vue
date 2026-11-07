<template>
  <DashboardCard :title="$t('tides.moon.title')">
    <div class="flex items-center gap-4">
      <svg viewBox="-36 -36 72 72" aria-hidden="true" class="block size-[72px] flex-none">
        <circle r="28" class="fill-moon-shadow" />
        <path :d="glyph" class="fill-moon-lit" />
        <circle r="28" fill="none" class="stroke-moon-arc-ahead" stroke-width="1" />
      </svg>
      <div class="flex min-w-0 flex-col gap-0.5">
        <span data-phase class="text-base font-semibold leading-6">{{ $t(`moonPhases.${phaseKey}`) }}</span>
        <span class="text-sm leading-5 tabular-nums text-muted-foreground">
          {{ $t('tides.moon.illuminated', { percent: formatNumber(Math.round(moon.illum * 100)) }) }}
        </span>
      </div>
    </div>
    <div class="flex flex-col gap-2.5">
      <div class="flex min-w-0 items-center gap-2.5">
        <span class="w-14 flex-none rounded-full bg-tide-soft py-[3px] text-center text-xs font-semibold leading-4 text-tide">
          {{ $t('tides.moon.spring') }}
        </span>
        <span data-spring class="min-w-0 text-sm leading-5 tabular-nums">{{ flagLine('spring', 'tides.moon.springLine') }}</span>
      </div>
      <div class="flex min-w-0 items-center gap-2.5">
        <span class="w-14 flex-none rounded-full bg-muted py-[3px] text-center text-xs font-semibold leading-4 text-muted-foreground">
          {{ $t('tides.moon.neap') }}
        </span>
        <span data-neap class="min-w-0 text-sm leading-5 tabular-nums">{{ flagLine('neap', 'tides.moon.neapLine') }}</span>
      </div>
    </div>
    <p data-explain class="text-[13px] leading-[19px] text-muted-foreground [text-wrap:pretty]">{{ explain }}</p>
    <div class="flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-[13px] leading-[18px] tabular-nums text-muted-foreground">
      <span v-if="selected.sunrise !== null">{{ $t('tides.moon.sunrise', { time: tideClock(selected.sunrise, zone) }) }}</span>
      <span v-if="selected.sunset !== null">{{ $t('tides.moon.sunset', { time: tideClock(selected.sunset, zone) }) }}</span>
    </div>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import tideMixin from '@/mixins/tideMixin'
import weatherMixin from '@/mixins/weatherMixin'
import { moonLitPath } from '@/utils/astro'
import { dateInZone } from '@/utils/tideTime'
import { dayIndexAt, nextDayFlagged, nextSyzygy } from '@/utils/tides'

// the existing moonPhases.* strings say "New Moon" where the data says 'new'
const PHASE_KEYS = { new: 'newMoon', full: 'fullMoon' }

export default {
  name: 'MoonTides',
  components: { DashboardCard },
  mixins: [weatherMixin, tideMixin],
  props: {
    tides: { type: Object, required: true },
    now: { type: Number, required: true },
    /** days from today, following the chart */
    day: { type: Number, default: 0 }
  },
  computed: {
    zone() {
      return this.tides.station.timezone
    },
    todayIndex() {
      return dayIndexAt(this.tides, this.now)
    },
    selected() {
      const last = this.tides.days.length - 1
      return this.tides.days[Math.max(0, Math.min(last, this.todayIndex + this.day))]
    },
    moon() {
      return this.selected.moon
    },
    phaseKey() {
      return PHASE_KEYS[this.moon.phase] ?? this.moon.phase
    },
    glyph() {
      // a sliver stays visible at new moon
      return moonLitPath(28, Math.max(0.04, this.moon.illum), this.moon.angle < 180)
    },
    explain() {
      const lead = this.$t('tides.moon.explain')
      const next = nextSyzygy(this.tides, this.now)
      if (!next) return lead
      const date = this.tideDate(dateInZone(next.t, this.zone), { weekday: 'short', month: 'short', day: 'numeric' })
      return `${lead} ${this.$t(next.quarter === 0 ? 'tides.moon.nextNew' : 'tides.moon.nextFull', { date })}`
    }
  },
  methods: {
    dayLabel(index) {
      if (index === this.todayIndex) return this.$t('tides.chart.today')
      if (index === this.todayIndex + 1) return this.$t('tides.chart.tomorrow')
      return this.tideDate(this.tides.days[index].date, { weekday: 'short', month: 'short', day: 'numeric' })
    },
    flagLine(flag, key) {
      const index = nextDayFlagged(this.tides, flag, this.todayIndex)
      if (index < 0) return this.$t('tides.moon.notSoon')
      return this.$t(key, {
        day: this.dayLabel(index),
        range: this.tideShort(this.tides.days[index].range / 100),
        unit: this.tideUnit
      })
    }
  }
}
</script>
