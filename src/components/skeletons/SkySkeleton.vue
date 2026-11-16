<template>
  <div data-loading :class="grid" aria-hidden="true">
    <!-- the Sun & Moon page while astronomy-engine loads: each card in its loaded place and
         height, titles real, everything that needs numbers a .tidy-skeleton block -->
    <section :class="[place.bar, 'flex flex-col rounded-card border bg-card p-4 md:p-6']">
      <div
        class="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-4 md:gap-y-3"
      >
        <Skeleton class="h-12 w-full md:max-w-[360px] md:flex-[1_1_240px]" />
        <div class="flex items-center gap-2 md:max-w-[400px] md:flex-[1_1_320px]">
          <Skeleton class="size-11 flex-none rounded-full" />
          <Skeleton class="h-12 flex-1" />
          <Skeleton class="size-11 flex-none rounded-full" />
        </div>
        <div class="flex items-center gap-2">
          <Skeleton class="h-12 w-[110px]" />
          <Skeleton class="h-12 w-[104px]" />
          <Skeleton class="h-12 w-[84px] rounded-full" />
        </div>
      </div>
      <div class="px-3 pt-[22px]">
        <div class="flex h-11 items-center"><Skeleton class="h-3 w-full rounded-full" /></div>
        <div class="mt-0.5 h-4" />
      </div>
      <div class="mt-4 flex gap-2 overflow-hidden border-t pt-4">
        <Skeleton
          v-for="w in [120, 128, 112, 124, 140, 136]"
          :key="w"
          class="h-9 flex-none rounded-full"
          :style="{ width: `${w}px` }"
        />
      </div>
    </section>

    <DashboardCard :title="$t('sky.chart.title')" busy :class="place.chart">
      <div class="ml-9 h-[190px] md:h-[250px]"><Skeleton class="size-full" /></div>
      <div class="h-6" />
      <div class="grid gap-2 md:grid-cols-2">
        <Skeleton v-for="i in 2" :key="i" class="h-[78px]" />
      </div>
    </DashboardCard>

    <DashboardCard :title="$t('sky.look.title')" busy :class="place.look">
      <div class="mx-auto aspect-square w-full max-w-[280px] p-[11%]">
        <Skeleton class="tidy-skeleton-soft size-full rounded-full" />
      </div>
      <Skeleton v-for="i in 2" :key="i" class="h-4 w-4/5" />
    </DashboardCard>

    <DashboardCard :title="$t('sky.sun.title')" busy :class="place.sun">
      <div class="grid grid-cols-2 gap-2">
        <Skeleton v-for="i in 4" :key="i" class="h-[88px]" />
      </div>
      <div class="flex flex-col gap-3 pt-2">
        <Skeleton v-for="i in 7" :key="i" class="h-[26px]" />
      </div>
    </DashboardCard>

    <DashboardCard :title="$t('sky.moon.title')" busy :class="place.moon">
      <div class="flex items-center gap-5">
        <Skeleton class="size-[104px] flex-none rounded-full" />
        <div class="flex flex-1 flex-col gap-2">
          <Skeleton class="h-6 w-2/3" /><Skeleton class="h-4 w-1/2" />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <Skeleton v-for="i in 4" :key="i" class="h-[88px]" />
      </div>
      <Skeleton class="h-[86px]" />
    </DashboardCard>

    <DashboardCard :title="$t('sky.geo.title')" busy :class="place.geo">
      <Skeleton class="mx-auto aspect-[360/232] w-full max-w-[440px]" />
      <div class="grid grid-cols-3 gap-2">
        <Skeleton v-for="i in 3" :key="i" class="h-[66px]" />
      </div>
      <Skeleton class="h-14" />
    </DashboardCard>

    <DashboardCard :title="$t('sky.prayer.title')" busy :class="place.prayer">
      <div class="flex flex-col gap-2"><Skeleton v-for="i in 6" :key="i" class="h-[46px]" /></div>
    </DashboardCard>

    <DashboardCard :title="$t('sky.planets.title')" busy :class="place.planet">
      <div class="flex flex-col gap-2"><Skeleton v-for="i in 5" :key="i" class="h-[52px]" /></div>
    </DashboardCard>

    <DashboardCard :title="$t('sky.ahead.title')" busy :class="place.ahead">
      <!-- the loaded list is a fixed-height scroll area -->
      <div class="flex h-[440px] flex-col gap-2 overflow-hidden md:h-[480px]">
        <Skeleton v-for="i in 8" :key="i" class="h-[52px] flex-none" />
      </div>
    </DashboardCard>
  </div>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import { SKY_GRID, SKY_PLACE } from '@/components/sky/layout'
import { Skeleton } from '@/components/ui/skeleton'

export default {
  name: 'SkySkeleton',
  components: { DashboardCard, Skeleton },
  data() {
    return { grid: SKY_GRID, place: SKY_PLACE }
  }
}
</script>
