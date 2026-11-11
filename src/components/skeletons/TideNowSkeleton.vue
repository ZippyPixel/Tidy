<template>
  <DashboardCard :title="$t('tides.rightNow.title')" busy>
    <div data-skeleton class="flex items-center gap-5">
      <Skeleton class="h-[132px] w-8 rounded-2xl" />
      <div class="flex min-w-0 flex-col gap-2.5">
        <Skeleton class="h-3.5 w-[72px]" />
        <Skeleton class="h-11 w-[120px] rounded-lg md:h-[52px] md:w-[140px]" />
        <Skeleton class="h-2.5 w-[150px] max-w-full" />
      </div>
    </div>
    <div data-skeleton class="flex flex-col gap-0.5 border-t pt-4">
      <Skeleton class="my-[3px] h-2.5 w-24" />
      <Skeleton class="my-[3px] h-[22px] w-24" />
      <Skeleton class="my-1 h-2.5 w-[240px] max-w-[90%]" />
    </div>
    <div class="flex items-center justify-between gap-3 text-sm leading-5">
      <span class="text-muted-foreground">{{ $t('tides.rightNow.rangeToday') }}</span>
      <Skeleton class="h-3 w-14" />
    </div>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import { Skeleton } from '@/components/ui/skeleton'

// TideNow while its station loads (design/TidySkeleton tNow)
export default {
  name: 'TideNowSkeleton',
  components: { DashboardCard, Skeleton }
}
</script>
