<script setup>
import { cn } from "@/lib/utils";

const props = defineProps({
  class: {
    type: [Boolean, null, String, Object, Array],
    required: false,
    skipCheck: true,
  },
});
</script>

<template>
  <!-- the Tidy skeleton block: shared shimmer and tokens live in assets/style.css (.tidy-skeleton) -->
  <div aria-hidden="true" :class="cn('tidy-skeleton rounded', props.class)" />
</template>
