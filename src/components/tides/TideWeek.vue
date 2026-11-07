<template>
  <DashboardCard :title="$t('tides.week.title')">
    <div class="-mx-3 flex flex-col gap-1">
      <!-- same row language as the 3-day forecast. Fixed columns on a phone keep the rows lined
           up with a badge in one of them; the bar gives way on the narrowest screens, and the
           sparkline joins from md. -->
      <div
        v-for="row in rows"
        :key="row.date"
        data-row
        class="grid min-h-16 grid-cols-[72px_minmax(0,1fr)_44px_52px] items-center gap-2 rounded-lg px-3 py-2 max-[374px]:grid-cols-[72px_minmax(0,1fr)_52px] md:grid-cols-[minmax(96px,120px)_minmax(0,1fr)_120px_minmax(80px,160px)_52px] md:gap-4"
        :class="{ 'bg-accent text-accent-foreground': row.isToday }"
      >
        <div class="flex min-w-0 flex-col gap-0.5">
          <!-- stacked on a phone, so "Today" doesn't take the width the times need -->
          <span class="flex flex-col whitespace-nowrap md:flex-row md:items-baseline md:gap-1.5">
            <span class="text-[15px] font-semibold leading-5">{{ row.day }}</span>
            <span class="text-[13px]" :class="{ 'text-muted-foreground': !row.isToday }">{{ row.shortDate }}</span>
          </span>
          <span v-if="row.spring" data-badge class="self-start rounded-full bg-tide-soft px-1.5 py-px md:px-2 text-[11px] font-semibold leading-4 text-tide">
            {{ $t('tides.week.springTide') }}
          </span>
          <span v-if="row.neap" data-badge class="self-start rounded-full bg-muted px-1.5 py-px md:px-2 text-[11px] font-semibold leading-4 text-muted-foreground">
            {{ $t('tides.week.neapTide') }}
          </span>
        </div>
        <div class="flex min-w-0 flex-col gap-0.5 text-[13px] leading-[18px] tabular-nums">
          <span class="flex min-w-0 gap-x-2 md:gap-x-3">
            <span class="min-w-[34px] flex-none font-semibold text-tide">{{ $t('tides.chart.high') }}</span>
            <span class="flex min-w-0 flex-wrap gap-x-3">
              <span v-for="e in row.highs" :key="e.time" class="whitespace-nowrap">
                {{ tideClock(e.time, zone) }}<span class="text-xs text-muted-foreground">{{ ' ' + tideShort(e.level) }}</span>
              </span>
            </span>
          </span>
          <span class="flex min-w-0 gap-x-2 md:gap-x-3">
            <span class="min-w-[34px] flex-none font-semibold text-muted-foreground">{{ $t('tides.chart.low') }}</span>
            <span class="flex min-w-0 flex-wrap gap-x-3">
              <span v-for="e in row.lows" :key="e.time" class="whitespace-nowrap">
                {{ tideClock(e.time, zone) }}<span class="text-xs text-muted-foreground">{{ ' ' + tideShort(e.level) }}</span>
              </span>
            </span>
          </span>
        </div>
        <svg data-spark viewBox="0 0 120 36" aria-hidden="true" class="hidden h-9 w-[120px] overflow-visible md:block">
          <path
            :d="row.spark"
            fill="none"
            class="stroke-tide"
            stroke-width="1.5"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
        </svg>
        <div aria-hidden="true" class="relative h-1.5 rounded-[3px] bg-foreground/10 max-[374px]:hidden">
          <div
            data-bar
            class="absolute inset-y-0 rounded-[3px]"
            :class="row.spring ? 'bg-tide' : 'bg-tide/60'"
            :style="{ left: `${row.left}%`, right: `${row.right}%` }"
          />
        </div>
        <span class="whitespace-nowrap text-right text-[15px] font-semibold tabular-nums">{{ tideShort(row.range) }} {{ tideUnit }}</span>
      </div>
    </div>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import tideMixin from '@/mixins/tideMixin'
import { sparkPath, weekRows } from '@/utils/tides'

export default {
  name: 'TideWeek',
  components: { DashboardCard },
  mixins: [tideMixin],
  props: {
    tides: { type: Object, required: true },
    now: { type: Number, required: true }
  },
  computed: {
    zone() {
      return this.tides.station.timezone
    },
    rows() {
      return weekRows(this.tides, this.now).map((row) => ({
        ...row,
        day: row.isToday ? this.$t('tides.chart.today') : this.tideDate(row.date, { weekday: 'short' }),
        shortDate: this.tideDate(row.date, { month: 'short', day: 'numeric' }),
        spark: sparkPath(this.tides, row.index, row.weekLow, row.weekHigh)
      }))
    }
  }
}
</script>
