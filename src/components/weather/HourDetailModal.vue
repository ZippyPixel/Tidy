<template>
  <DetailModalShell :value="content" :opener="opener" history-key="tidyHour" @close="$emit('close')">
    <template #default="{ value }">
      <HourDetailContent v-bind="value" />
    </template>
  </DetailModalShell>
</template>

<script>
import DetailModalShell from '@/components/common/DetailModalShell.vue'
import HourDetailContent from '@/components/weather/HourDetailContent.vue'

export default {
  name: 'HourDetailModal',
  components: { DetailModalShell, HourDetailContent },
  props: {
    /** normalizeHour() output; null closes the modal */
    hour: { type: Object, default: null },
    previous: { type: Object, default: null },
    /** "Today · 3 PM" */
    when: { type: String, default: '' },
    /** gets focus back on close */
    opener: { type: Object, default: null }
  },
  emits: ['close'],
  computed: {
    content() {
      return this.hour ? { hour: this.hour, previous: this.previous, when: this.when } : null
    }
  }
}
</script>
