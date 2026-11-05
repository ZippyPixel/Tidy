<template>
  <Transition name="fade">
    <div v-if="isLoading" class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div class="flex flex-col items-center">
        <div class="size-16 animate-spin rounded-full border-4 border-primary border-t-transparent motion-reduce:animate-none"></div>
        <p class="mt-4 font-medium text-muted-foreground">{{ $t('loading') }}</p>
      </div>
    </div>
  </Transition>
</template>

<script>
import { mapState } from 'pinia'
import useWeatherStore from '@/stores/weather'

export default {
  name: 'LoadingOverlay',
  computed: {
    ...mapState(useWeatherStore, ['isLoading'])
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 