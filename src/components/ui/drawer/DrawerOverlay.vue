<script setup>
import { DrawerOverlay } from 'vaul-vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true }
})
</script>

<template>
  <DrawerOverlay :class="cn('fixed inset-0 z-50 bg-[hsl(220_30%_4%/0.45)]', props.class)" />
</template>
