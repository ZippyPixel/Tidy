<script setup>
import { DrawerContent, DrawerPortal } from 'vaul-vue'
import { cn } from '@/lib/utils'
import DrawerOverlay from './DrawerOverlay.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true }
})
</script>

<template>
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerContent
      v-bind="$attrs"
      :class="
        cn(
          'fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-[28px] bg-popover text-popover-foreground shadow-[0_-8px_32px_hsl(220_30%_4%/0.18)] outline-none',
          props.class
        )
      "
    >
      <div aria-hidden="true" class="mx-auto mt-3 h-1 w-9 flex-none rounded-full bg-muted-foreground/35" />
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>
