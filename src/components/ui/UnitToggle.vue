<template>
  <div class="relative inline-flex select-none">
    <UiSwitch
      :model-value="unit === 'fahrenheit'"
      :title="$t('header.switchToUnit', { unit: $t(unit === 'celsius' ? 'header.fahrenheit' : 'header.celsius') })"
      aria-label="Toggle temperature unit"
      class="h-7 w-20 border-0 p-1 shadow-none data-[state=checked]:bg-gray-200 data-[state=unchecked]:bg-gray-200 dark:data-[state=checked]:bg-night-surface dark:data-[state=unchecked]:bg-night-surface"
      thumb-class="h-5 w-9 bg-white shadow-sm duration-300 ease-in-out data-[state=checked]:translate-x-9 dark:bg-night-bg"
      @update:model-value="onToggle"
    />
    <!-- °C / °F labels overlaid on the switch track -->
    <div class="pointer-events-none absolute inset-0 flex items-center px-1">
      <span
        class="w-9 text-center text-xs font-semibold transition-colors duration-300"
        :class="unit === 'celsius' ? 'text-slate-800 dark:text-night-text' : 'text-gray-400 dark:text-night-muted'"
      >°C</span>
      <span
        class="w-9 text-center text-xs font-semibold transition-colors duration-300"
        :class="unit === 'fahrenheit' ? 'text-slate-800 dark:text-night-text' : 'text-gray-400 dark:text-night-muted'"
      >°F</span>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import useUnitStore from '@/stores/unit'
import { Switch } from '@/components/ui/switch'

export default {
  name: 'UnitToggle',
  components: {
    UiSwitch: Switch
  },
  computed: {
    ...mapState(useUnitStore, ['unit'])
  },
  methods: {
    ...mapActions(useUnitStore, ['setUnit']),
    onToggle(checked) {
      this.setUnit(checked ? 'fahrenheit' : 'celsius')
    }
  }
}
</script>
