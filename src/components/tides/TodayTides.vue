<template>
  <DashboardCard :title="title">
    <div class="-mx-3 flex flex-col gap-1">
      <div
        v-for="row in rows"
        :key="row.time"
        data-row
        class="grid min-h-14 grid-cols-[32px_minmax(0,1fr)_auto_72px] items-center gap-3 rounded-lg px-3 py-1.5"
        :class="{
          'bg-accent text-accent-foreground': row.isNext,
          'text-muted-foreground': row.passed
        }"
      >
        <span
          class="flex size-8 items-center justify-center rounded-full"
          :class="row.high ? 'bg-tide-soft text-tide' : 'bg-muted text-muted-foreground'"
        >
          <AppIcon :name="row.high ? 'arrow-up' : 'arrow-down'" :size="16" :stroke-width="2.2" />
        </span>
        <span class="flex min-w-0 flex-col">
          <span class="whitespace-nowrap text-[15px] font-semibold leading-5">
            {{ $t(row.high ? 'tides.today.highTide' : 'tides.today.lowTide') }}
          </span>
          <span v-if="row.tag" class="text-xs leading-4" :class="row.isNext ? 'font-semibold' : 'text-muted-foreground'">{{ row.tag }}</span>
        </span>
        <span class="whitespace-nowrap text-right text-base font-semibold leading-5 tabular-nums">{{ row.clock }}</span>
        <span class="whitespace-nowrap text-right text-[15px] leading-5 tabular-nums" :class="{ 'text-muted-foreground': !row.isNext }">
          {{ row.height }} {{ tideUnit }}
        </span>
      </div>
    </div>
  </DashboardCard>
</template>

<script>
import AppIcon from '@/components/common/AppIcon.vue'
import DashboardCard from '@/components/common/DashboardCard.vue'
import tideMixin from '@/mixins/tideMixin'
import { dayIndexAt, extremesOnDay } from '@/utils/tides'

export default {
  name: 'TodayTides',
  components: { AppIcon, DashboardCard },
  mixins: [tideMixin],
  props: {
    tides: { type: Object, required: true },
    now: { type: Number, required: true },
    /** days from today, following the chart */
    day: { type: Number, default: 0 }
  },
  computed: {
    index() {
      return Math.max(0, Math.min(this.tides.days.length - 1, dayIndexAt(this.tides, this.now) + this.day))
    },
    title() {
      if (this.day === 0) return this.$t('tides.today.title')
      return this.$t('tides.today.onDay', { day: this.tideDate(this.tides.days[this.index].date, { weekday: 'long' }) })
    },
    rows() {
      const extremes = extremesOnDay(this.tides, this.index)
      const today = this.day === 0
      const next = today ? extremes.find((e) => e.time > this.now) : null
      return extremes.map((e) => {
        const isNext = e === next
        const passed = today && e.time < this.now
        let tag = ''
        if (isNext) tag = this.$t('tides.today.nextIn', { duration: this.tideDuration(e.time - this.now) })
        else if (passed) tag = this.$t('tides.today.passed')
        return {
          time: e.time,
          high: e.high,
          isNext,
          passed,
          tag,
          clock: this.tideClock(e.time, this.tides.station.timezone),
          height: this.tideHeight(e.level)
        }
      })
    }
  }
}
</script>
