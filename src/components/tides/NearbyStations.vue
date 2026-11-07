<template>
  <DashboardCard :title="$t('tides.nearby.title')">
    <template #actions>
      <button
        type="button"
        data-explore
        aria-haspopup="dialog"
        class="h-11 rounded-full px-1 text-sm font-semibold text-primary outline-ring focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        @click="$emit('explore', $event)"
      >
        {{ $t('tides.nearby.exploreAll') }}
      </button>
    </template>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="station in stations"
        :key="station.id"
        type="button"
        data-nearby
        class="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm outline-ring hover:bg-foreground/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:bg-foreground/10"
        @click="$emit('select', station.id)"
      >
        <span class="font-medium">{{ station.name }}</span>
        <span class="tabular-nums text-muted-foreground">{{ $t('tides.explorer.km', { km: tideGrouped(station.km) }) }}</span>
      </button>
    </div>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import tideMixin from '@/mixins/tideMixin'

export default {
  name: 'NearbyStations',
  components: { DashboardCard },
  mixins: [tideMixin],
  props: {
    stations: { type: Array, required: true }
  },
  emits: ['select', 'explore']
}
</script>
