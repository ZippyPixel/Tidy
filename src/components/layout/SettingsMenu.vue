<template>
  <!-- One trigger; the surface depends on width at open time: a bottom sheet below
       md, a popover from md (design/Tidy Responsive "Settings" rule). -->
  <button
    ref="trigger"
    type="button"
    class="flex size-11 items-center justify-center rounded-full hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    :title="$t('header.settings')"
    :aria-label="$t('header.openSettings')"
    aria-haspopup="dialog"
    :aria-expanded="String(open)"
    @click="open = !open"
  >
    <AppIcon name="settings" :size="21" :stroke-width="1.75" />
  </button>

  <Popover v-if="mounted && isMd" :open="open" @update:open="open = $event">
    <PopoverContent
      :reference="$refs.trigger"
      align="end"
      :side-offset="8"
      class="w-80 rounded-tile p-2"
      @interact-outside="keepOpenOnTrigger"
      @close-auto-focus.prevent="$refs.trigger?.focus()"
    >
      <p class="px-3 pb-1 pt-2 text-sm font-medium text-muted-foreground">{{ $t('header.settings') }}</p>
      <SettingsPanel />
    </PopoverContent>
  </Popover>

  <DialogRoot v-else-if="mounted" :open="open" @update:open="open = $event">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-40 bg-[hsl(220_30%_4%/0.5)] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />
      <DialogContent
        class="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-popover pb-[calc(16px+env(safe-area-inset-bottom))] pl-[max(12px,env(safe-area-inset-left))] pr-[max(12px,env(safe-area-inset-right))] pt-2 text-popover-foreground shadow-[0_-8px_32px_hsl(220_30%_4%/0.2)] outline-none duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
        @close-auto-focus.prevent="$refs.trigger?.focus()"
      >
        <div aria-hidden="true" class="mx-auto mb-2 mt-1 h-1 w-9 rounded-full bg-input" />
        <div class="flex h-12 items-center justify-between pl-3 pr-1">
          <DialogTitle class="text-lg font-semibold">{{ $t('header.settings') }}</DialogTitle>
          <DialogClose
            class="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :aria-label="$t('header.close')"
          >
            <AppIcon name="x" :size="20" />
          </DialogClose>
        </div>
        <DialogDescription class="sr-only">{{ $t('header.settingsDescription') }}</DialogDescription>
        <SettingsPanel />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script>
import { useMediaQuery } from '@vueuse/core'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle
} from 'reka-ui'
import AppIcon from '@/components/common/AppIcon.vue'
import SettingsPanel from '@/components/layout/SettingsPanel.vue'
import { Popover, PopoverContent } from '@/components/ui/popover'

export default {
  name: 'SettingsMenu',
  components: {
    AppIcon,
    SettingsPanel,
    Popover,
    PopoverContent,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle
  },
  setup() {
    // false on the server and in jsdom; the surface is only rendered after mount so
    // SSR (always "phone") and hydration on a wide screen cannot disagree
    return { isMd: useMediaQuery('(min-width: 768px)') }
  },
  data() {
    return { open: false, mounted: false }
  },
  mounted() {
    this.mounted = true
  },
  methods: {
    // a press on the trigger is "outside" the popover; let the trigger's own
    // click toggle it instead of closing here and reopening on click
    keepOpenOnTrigger(event) {
      if (this.$refs.trigger?.contains(event.target)) event.preventDefault()
    }
  }
}
</script>
