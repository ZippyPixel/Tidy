<template>
  <DashboardCard :title="$t('tides.nearby.title')" busy>
    <template #actions>
      <!-- "Explore all stations" is real, and waits at 50% with the rest of the page -->
      <button
        type="button"
        disabled
        class="h-11 rounded-full px-1 text-sm font-semibold text-primary opacity-50"
      >
        {{ $t('tides.nearby.exploreAll') }}
      </button>
    </template>
    <div data-skeleton class="flex flex-wrap gap-2">
      <Skeleton v-for="w in chips" :key="w" class="h-11 rounded-full" :style="{ width: `${w}px` }" />
    </div>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import { Skeleton } from '@/components/ui/skeleton'

// NearbyStations while its station loads (design/TidySkeleton tNear)
export default {
  name: 'NearbyStationsSkeleton',
  components: { DashboardCard, Skeleton },
  setup() {
    return { chips: [128, 150, 142, 154, 168, 122] }
  }
}
</script>
