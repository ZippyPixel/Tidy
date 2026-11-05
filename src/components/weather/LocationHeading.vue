<template>
  <div class="mb-4 md:mb-6">
    <p class="mb-1 text-[13px] font-medium leading-4 text-muted-foreground">
      {{ $t('weather.currentLocation') }}
    </p>
    <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
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

export default {
  name: 'LocationHeading',
  computed: {
    ...mapState(useWeatherStore, ['location', 'day'])
  }
}
</script>
