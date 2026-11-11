<template>
  <div class="mb-4 md:mb-6" :aria-busy="showSkeleton ? 'true' : undefined">
    <p class="mb-1 text-[13px] font-medium leading-4 text-muted-foreground">
      {{ $t('weather.currentLocation') }}
    </p>
    <!-- skeleton: the name and date bars, each on the loaded text's line height -->
    <div v-if="showSkeleton" data-skeleton class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Skeleton class="my-[4.5px] h-[22px] w-[220px] max-w-full md:my-[5px] md:w-[290px]" />
      <Skeleton class="my-[5px] h-3 w-[104px]" />
    </div>
    <div v-else class="flex flex-wrap items-baseline gap-x-3 gap-y-1" :class="fadeClass">
      <h1
        class="min-w-0 text-[clamp(1.25rem,1rem+1vw,1.625rem)] font-semibold leading-[1.2] tracking-[-0.01em]"
      >
        {{ location || '—' }}
      </h1>
      <span class="text-[15px] text-muted-foreground">{{ day }}</span>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import useWeatherStore from '@/stores/weather'
import { Skeleton } from '@/components/ui/skeleton'
import { useWeatherSkeleton } from '@/composables/useSkeletonGate'

export default {
  name: 'LocationHeading',
  components: { Skeleton },
  setup() {
    return useWeatherSkeleton()
  },
  computed: {
    ...mapState(useWeatherStore, ['location', 'day'])
  }
}
</script>
