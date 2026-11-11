<template>
  <DashboardCard :title="$t('tides.chart.title')" busy>
    <template #actions>
      <!-- the Day / Week control keeps its place, waiting at 50% -->
      <div inert class="pointer-events-none opacity-50">
        <SegmentedControl kind="tabs" :aria-label="$t('tides.chart.rangeLabel')" :options="views" model-value="day" />
      </div>
    </template>
    <div data-skeleton class="flex min-h-12 items-center justify-between gap-2">
      <Skeleton class="size-11 rounded-full" />
      <div class="flex flex-col items-center gap-2">
        <Skeleton class="h-3.5 w-[170px] md:w-[210px]" />
        <Skeleton class="h-2.5 w-12" />
      </div>
      <Skeleton class="size-11 rounded-full" />
    </div>
    <!-- TideChart draws its own skeleton without data, on its own 216 / 268px box -->
    <div data-loading>
      <TideChart :tides="null" :now="0" />
    </div>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-4 text-muted-foreground">
      <span class="flex items-center gap-1.5"><span class="size-[9px] rounded-full bg-tide" />{{ $t('tides.chart.high') }}</span>
      <span class="flex items-center gap-1.5"><span class="size-[9px] rounded-full border-2 border-tide" />{{ $t('tides.chart.low') }}</span>
      <span class="flex items-center gap-1.5">
        <span class="h-[9px] w-3.5 rounded-sm bg-chart-night shadow-[inset_0_0_0_1px_hsl(var(--border))]" />{{ $t('tides.chart.night') }}
      </span>
      <Skeleton class="h-2.5 w-[200px] max-w-full md:w-[260px]" />
    </div>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import SegmentedControl from '@/components/common/SegmentedControl.vue'
import TideChart from '@/components/tides/TideChart.vue'
import { Skeleton } from '@/components/ui/skeleton'

// The tides page chart card while its station loads (design/TidySkeleton tChart).
// The legend is real; only the datum note needs the station.
export default {
  name: 'TideChartSkeleton',
  components: { DashboardCard, SegmentedControl, Skeleton, TideChart },
  computed: {
    views() {
      return [
        { value: 'day', label: this.$t('tides.chart.day') },
        { value: 'week', label: this.$t('tides.chart.week') }
      ]
    }
  }
}
</script>
