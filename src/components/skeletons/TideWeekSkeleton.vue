<template>
  <DashboardCard :title="$t('tides.week.title')" busy>
    <div data-skeleton class="-mx-3 flex flex-col gap-1">
      <!-- TideWeek's own columns: day · times · sparkline (md+) · range bar · range -->
      <div
        v-for="(row, i) in rows"
        :key="i"
        class="grid min-h-16 grid-cols-[72px_minmax(0,1fr)_44px_52px] items-center gap-2 rounded-lg px-3 py-2 max-[374px]:grid-cols-[72px_minmax(0,1fr)_52px] md:grid-cols-[minmax(96px,120px)_minmax(0,1fr)_120px_minmax(80px,160px)_52px] md:gap-4"
        :class="{ 'bg-surface-raised': i === 0 }"
      >
        <Skeleton class="h-3.5 max-w-full" :style="{ width: `${row.day}px` }" />
        <Skeleton class="h-3" :style="{ width: row.times }" />
        <Skeleton class="hidden h-[18px] w-[120px] rounded-md md:block" />
        <Skeleton class="h-1.5 rounded-[3px] max-[374px]:hidden" />
        <Skeleton class="h-3.5 w-9 justify-self-end md:w-10" />
      </div>
    </div>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import { Skeleton } from '@/components/ui/skeleton'

// TideWeek while its station loads (design/TidySkeleton tWeek): seven 64px rows
const DAYS = [52, 60, 60, 60, 60, 60, 60]
const TIMES = ['78%', '72%', '80%', '74%', '70%', '76%', '72%']

export default {
  name: 'TideWeekSkeleton',
  components: { DashboardCard, Skeleton },
  setup() {
    return { rows: DAYS.map((day, i) => ({ day, times: TIMES[i] })) }
  }
}
</script>
