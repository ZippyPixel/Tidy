<script setup>
import { ref } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaViewport } from 'reka-ui'
import { cn } from '@/lib/utils'
import ScrollBar from './ScrollBar.vue'

const props = defineProps({
  type: { type: String, required: false, default: 'hover' },
  dir: { type: String, required: false },
  scrollHideDelay: { type: Number, required: false, default: 600 },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: {
    type: [Boolean, null, String, Object, Array],
    required: false,
    skipCheck: true
  }
})

const delegatedProps = reactiveOmit(props, 'class')

// 0 to 1, for ScrollBar's minimum thumb length. On the root so it survives the bar unmounting.
const scrollProgress = ref(0)

function onScroll({ currentTarget: viewport }) {
  const range = viewport.scrollHeight - viewport.clientHeight
  scrollProgress.value = range > 0 ? Math.min(1, Math.max(0, viewport.scrollTop / range)) : 0
}
</script>

<template>
  <ScrollAreaRoot
    v-bind="delegatedProps"
    :class="cn('relative overflow-hidden', props.class)"
    :style="{ '--scroll-progress': scrollProgress }"
  >
    <ScrollAreaViewport
      class="h-full w-full overscroll-contain rounded-[inherit] outline-ring [outline-offset:-2px] focus-visible:outline focus-visible:outline-2"
      @scroll.passive="onScroll"
    >
      <slot />
    </ScrollAreaViewport>
    <ScrollBar />
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
