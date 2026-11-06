<template>
  <SegmentedControl
    kind="radio"
    :aria-label="$t('header.temperature')"
    :options="options"
    :model-value="unit"
    @update:model-value="setUnit"
  />
</template>

<script>
import { mapState, mapActions } from 'pinia'
import useUnitStore from '@/stores/unit'
import SegmentedControl from '@/components/common/SegmentedControl.vue'

export default {
  name: 'UnitToggle',
  components: { SegmentedControl },
  data() {
    return {
      options: [
        { value: 'celsius', label: '°C' },
        { value: 'fahrenheit', label: '°F' }
      ]
    }
  },
  computed: {
    ...mapState(useUnitStore, ['unit'])
  },
  methods: {
    ...mapActions(useUnitStore, ['setUnit'])
  }
}
</script>
