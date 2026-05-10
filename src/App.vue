<template>
  <div class="min-h-screen bg-gray-100 dark:bg-night-bg">
    <LoadingOverlay />
    <router-view></router-view>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import useWeatherStore from '@/stores/weather'
import useThemeStore from '@/stores/theme'
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
  async mounted() {
    const themeStore = useThemeStore()
    themeStore.initTheme()
    await this.checkAndDetectLocation()
  }
}
</script>
