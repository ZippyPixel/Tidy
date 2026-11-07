<script setup>
// design/TidyScrollbar.
// - reka-ui positions the bar inline, hence the ! insets.
// - It unmounts the bar as soon as it hides unless a CSS animation is running, so the fade
//   can't be a transition.
// - Its geometry assumes a thumb of 18px or more. As the content scrolls, translate takes back
//   whatever the 32px minimum added, so the longer thumb still stops at the end of the track.
import { reactiveOmit } from '@vueuse/core'
import { ScrollAreaScrollbar, ScrollAreaThumb } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  orientation: { type: String, required: false, default: 'vertical' },
  forceMount: { type: Boolean, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: {
    type: [Boolean, null, String, Object, Array],
    required: false,
    skipCheck: true
  }
})

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <ScrollAreaScrollbar
    v-bind="delegatedProps"
    :class="
      cn(
        'group z-[1] flex touch-none select-none rounded-full transition-[padding,background-color] duration-[120ms] [animation-duration:150ms] hover:bg-scrollbar-track active:bg-scrollbar-track data-[state=hidden]:animate-out data-[state=visible]:animate-in data-[state=hidden]:fade-out-0 data-[state=visible]:fade-in-0 motion-reduce:!animate-none motion-reduce:transition-none',
        orientation === 'vertical' &&
          '!bottom-1 !right-0.5 !top-1 w-3 px-[3px] hover:px-0.5 active:px-0.5',
        orientation === 'horizontal' &&
          '!bottom-0.5 !left-1 !right-1 h-3 flex-col py-[3px] hover:py-0.5 active:py-0.5',
        props.class
      )
    "
  >
    <ScrollAreaThumb
      :class="
        cn(
          'relative flex-1 rounded-full bg-scrollbar-thumb group-hover:bg-scrollbar-thumb-hover group-active:bg-scrollbar-thumb-active',
          orientation === 'vertical' &&
            'min-h-8 [translate:0_calc(var(--scroll-progress,0)_*_min(0px,_var(--reka-scroll-area-thumb-height,2rem)_-_2rem))]'
        )
      "
    />
  </ScrollAreaScrollbar>
</template>
