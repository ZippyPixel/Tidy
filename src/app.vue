<template>
  <div class="min-h-screen bg-background text-foreground">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import useWeatherStore from '@/stores/weather'

export default {
  name: 'App',
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
