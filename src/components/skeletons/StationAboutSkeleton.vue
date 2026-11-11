<template>
  <DashboardCard :title="$t('tides.about.title')" busy>
    <div data-skeleton class="flex flex-col gap-[9px] py-[1px]">
      <Skeleton class="h-3 w-full" />
      <Skeleton class="h-3 w-full" />
      <Skeleton class="h-3 w-[45%]" />
    </div>
    <div data-skeleton class="flex flex-col">
      <div
        v-for="([labelW, valueW], i) in facts"
        :key="i"
        class="flex items-center justify-between gap-4 border-t py-[13px]"
      >
        <Skeleton class="h-3.5" :style="{ width: `${labelW}px` }" />
        <Skeleton class="h-3.5" :style="{ width: `${valueW}px` }" />
      </div>
    </div>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import { Skeleton } from '@/components/ui/skeleton'

// StationAbout while its station loads (design/TidySkeleton tAbout): lead, then the facts
const FACTS = [[72, 96], [104, 44], [128, 44], [156, 44], [150, 32], [62, 132], [36, 150], [124, 80]]

export default {
  name: 'StationAboutSkeleton',
  components: { DashboardCard, Skeleton },
  setup() {
    return { facts: FACTS }
  }
}
</script>
