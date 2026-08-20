<template>
  <div class="min-h-screen bg-gray-100 dark:bg-night-bg">
    <LoadingOverlay />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import useWeatherStore from '@/stores/weather'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'

export default {
  name: 'App',
  components: {
    LoadingOverlay
  },
  computed: {
    ...mapState(useWeatherStore, ['location', 'isLoading'])
  },
  methods: {
    ...mapActions(useWeatherStore, {
      detectUserLocation: 'detectUserLocation'
    }),
    async checkAndDetectLocation() {
      if (!this.location && !this.isLoading) {
        try {
          await this.detectUserLocation()
        } catch (error) {
          console.error('Initial location detection failed:', error)
        }
      }
    }
  },
  // theme and locale are seeded before render by plugins/preferences.js, so all
  // that is left here is the geolocation probe (browser-only by nature)
  async mounted() {
    await this.checkAndDetectLocation()
  }
}
</script>
