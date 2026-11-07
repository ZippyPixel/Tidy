<template>
  <DashboardCard :title="$t('tides.rightNow.title')">
    <div class="flex items-center gap-5">
      <TideGauge :fraction="gauge" class="h-[132px] w-8" />
      <div class="flex min-w-0 flex-col gap-1.5">
        <TideTrend :rising="rising" class="text-[15px] leading-5" />
        <!-- prettier-ignore -->
        <span data-level class="whitespace-nowrap text-5xl font-light leading-none tracking-[-0.035em] tabular-nums md:text-[56px]">{{ tideHeight(level) }}<span class="text-[22px] font-normal tracking-normal text-muted-foreground">{{ ' ' + tideUnit }}</span></span>
        <span data-now-line class="text-[13px] leading-4 tabular-nums text-muted-foreground">{{ nowLine }}</span>
      </div>
    </div>
    <div v-if="next" data-next class="flex flex-col gap-0.5 border-t pt-4">
      <span class="text-[13px] leading-4 text-muted-foreground">{{ $t(next.high ? 'tides.nextHigh' : 'tides.nextLow') }}</span>
      <span class="text-[22px] font-semibold leading-7 tabular-nums">{{ tideClock(next.time, zone) }}</span>
      <span class="text-[13px] leading-[18px] tabular-nums text-muted-foreground">{{ nextLine }}</span>
    </div>
    <div class="flex justify-between gap-3 text-sm leading-5 tabular-nums">
      <span class="text-muted-foreground">{{ $t('tides.rightNow.rangeToday') }}</span>
      <span data-range class="font-semibold">{{ tideHeight(today.range / 100) }} {{ tideUnit }}</span>
    </div>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import TideGauge from '@/components/tides/TideGauge.vue'
import TideTrend from '@/components/tides/TideTrend.vue'
import tideMixin from '@/mixins/tideMixin'
import { dateInZone } from '@/utils/tideTime'
import { dayIndexAt, extremeAfter, gaugeFraction, isRising, levelAt, nextExtreme } from '@/utils/tides'

export default {
  name: 'TideNow',
  components: { DashboardCard, TideGauge, TideTrend },
  mixins: [tideMixin],
  props: {
    tides: { type: Object, required: true },
    now: { type: Number, required: true },
    /** the forecast location's zone: a station in another one says "local time" */
    homeZone: { type: String, default: null }
  },
  computed: {
    zone() {
      return this.tides.station.timezone
    },
    level() {
      return levelAt(this.tides, this.now)
    },
    rising() {
      return isRising(this.tides, this.now)
    },
    gauge() {
      return gaugeFraction(this.tides, this.now)
    },
    next() {
      return nextExtreme(this.tides, this.now)
    },
    today() {
      return this.tides.days[dayIndexAt(this.tides, this.now)]
    },
    nowLine() {
      const key = this.homeZone && this.homeZone !== this.zone ? 'tides.page.nowLocal' : 'tides.page.nowHere'
      return this.$t(key, {
        time: this.tideClock(this.now, this.zone),
        day: this.tideDate(dateInZone(this.now, this.zone), { weekday: 'long' })
      })
    },
    nextLine() {
      const after = extremeAfter(this.tides, this.next)
      const shared = {
        height: this.tideHeight(this.next.level),
        unit: this.tideUnit,
        duration: this.tideDuration(this.next.time - this.now)
      }
      if (!after) return this.$t('tides.heightIn', shared)
      return this.$t(after.high ? 'tides.heightInThenHigh' : 'tides.heightInThenLow', {
        ...shared,
        time: this.tideClock(after.time, this.zone)
      })
    }
  }
}
</script>
