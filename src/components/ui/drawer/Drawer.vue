<script setup>
import { useForwardPropsEmits } from 'reka-ui'
import { DrawerRoot } from 'vaul-vue'

const props = defineProps({
  open: { type: Boolean, default: undefined },
  defaultOpen: { type: Boolean, default: undefined },
  dismissible: { type: Boolean, default: true },
  modal: { type: Boolean, default: true }
})
const emits = defineEmits(['update:open', 'close', 'drag', 'release', 'animationEnd'])

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DrawerRoot v-bind="forwarded">
    <slot />
  </DrawerRoot>
</template>
