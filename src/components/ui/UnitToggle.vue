<template>
  <div
    class="relative flex w-20 bg-gray-200 dark:bg-night-surface rounded-full p-1 cursor-pointer select-none"
    role="switch"
    :aria-checked="unit === 'fahrenheit'"
    :title="`Switch to ${unit === 'celsius' ? 'Fahrenheit' : 'Celsius'}`"
    @click="toggle"
  >
    <!-- sliding pill -->
    <div
      class="absolute top-1 bottom-1 w-9 rounded-full bg-white dark:bg-night-bg shadow-sm transition-all duration-300 ease-in-out"
      :class="unit === 'fahrenheit' ? 'left-[2.5rem]' : 'left-1'"
    />
    <!-- °C label -->
    <span
      class="relative z-10 w-9 text-center py-0.5 text-xs font-semibold transition-colors duration-300"
      :class="unit === 'celsius' ? 'text-slate-800 dark:text-night-text' : 'text-gray-400 dark:text-night-muted'"
    >°C</span>
    <!-- °F label -->
    <span
      class="relative z-10 w-9 text-center py-0.5 text-xs font-semibold transition-colors duration-300"
      :class="unit === 'fahrenheit' ? 'text-slate-800 dark:text-night-text' : 'text-gray-400 dark:text-night-muted'"
    >°F</span>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import useUnitStore from '@/stores/unit'

export default {
  name: 'UnitToggle',
  computed: {
    ...mapState(useUnitStore, ['unit'])
  },
  methods: {
    ...mapActions(useUnitStore, ['setUnit']),
    toggle() {
      this.setUnit(this.unit === 'celsius' ? 'fahrenheit' : 'celsius')
    }
  }
}
</script>
