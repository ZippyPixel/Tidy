<template>
  <DashboardCard :title="$t('tides.today.title')" busy>
    <div data-skeleton class="-mx-3 flex flex-col gap-1">
      <div
        v-for="(labelW, i) in rows"
        :key="i"
        class="grid min-h-14 grid-cols-[32px_minmax(0,1fr)_auto_72px] items-center gap-3 rounded-lg px-3 py-1.5"
        :class="{ 'bg-surface-raised': i === rows.length - 1 }"
      >
        <Skeleton class="size-8 rounded-full" />
        <Skeleton class="h-3.5 max-w-full" :style="{ width: `${labelW}px` }" />
        <Skeleton class="h-3.5 w-[68px]" />
        <Skeleton class="h-3 w-[52px] justify-self-end" />
      </div>
    </div>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import { Skeleton } from '@/components/ui/skeleton'

// TodayTides while its station loads (design/TidySkeleton tToday): four 56px rows
export default {
  name: 'TodayTidesSkeleton',
  components: { DashboardCard, Skeleton },
  setup() {
    return { rows: [78, 70, 78, 70] }
  }
}
</script>
