<template>
  <RouterView />
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
  async mounted() {
    await this.checkAndDetectLocation()
  }
}
</script>
