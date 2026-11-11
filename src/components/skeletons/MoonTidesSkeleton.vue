<template>
  <DashboardCard :title="$t('tides.moon.title')" busy>
    <div data-skeleton class="flex items-center gap-4">
      <div class="flex size-[72px] flex-none items-center justify-center">
        <Skeleton class="size-14 rounded-full" />
      </div>
      <div class="flex min-w-0 flex-col gap-2">
        <Skeleton class="h-4 w-[136px] max-w-full" />
        <Skeleton class="h-3 w-[104px]" />
      </div>
    </div>
    <!-- the Spring / Neap badges are labels, so they stay real -->
    <div class="flex flex-col gap-2.5">
      <div class="flex min-w-0 items-center gap-2.5">
        <span class="w-14 flex-none rounded-full bg-tide-soft py-[3px] text-center text-xs font-semibold leading-4 text-tide">
          {{ $t('tides.moon.spring') }}
        </span>
        <Skeleton class="h-3 w-[196px] max-w-full" />
      </div>
      <div class="flex min-w-0 items-center gap-2.5">
        <span class="w-14 flex-none rounded-full bg-muted py-[3px] text-center text-xs font-semibold leading-4 text-muted-foreground">
          {{ $t('tides.moon.neap') }}
        </span>
        <Skeleton class="h-3 w-44 max-w-full" />
      </div>
    </div>
    <div data-skeleton class="flex flex-col gap-2">
      <Skeleton class="h-[11px] w-full" />
      <Skeleton class="h-[11px] w-full" />
      <Skeleton class="h-[11px] w-[62%]" />
    </div>
    <div data-skeleton class="flex gap-4 border-t pt-3">
      <Skeleton class="my-[3px] h-3 w-[104px]" />
      <Skeleton class="my-[3px] h-3 w-[100px]" />
    </div>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import { Skeleton } from '@/components/ui/skeleton'

// MoonTides while its station loads (design/TidySkeleton tMoon)
export default {
  name: 'MoonTidesSkeleton',
  components: { DashboardCard, Skeleton }
}
</script>
