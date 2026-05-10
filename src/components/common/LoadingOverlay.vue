<template>
  <Transition name="fade">
    <div v-if="isLoading" class="fixed inset-0 bg-white/80 dark:bg-night-bg/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="flex flex-col items-center">
        <div class="w-16 h-16 border-4 border-blue-500 dark:border-night-accent border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-4 text-gray-600 dark:text-night-muted font-medium">Loading weather data...</p>
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