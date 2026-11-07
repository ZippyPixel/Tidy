<template>
  <p>
    <template v-for="(part, i) in parts" :key="i">
      <a
        v-if="part.href"
        :href="part.href"
        target="_blank"
        rel="noopener noreferrer"
        class="break-all underline underline-offset-2 hover:text-foreground"
        >{{ part.text }}</a
      >
      <template v-else>{{ part.text }}</template>
    </template>
  </p>
</template>

<script>
import { creditParts } from '@/utils/tides'

// A credit from the station database, printed as it comes with its URLs linked.
export default {
  name: 'TideCredit',
  props: {
    text: { type: String, required: true }
  },
  computed: {
    parts() {
      return creditParts(this.text)
    }
  }
}
</script>
