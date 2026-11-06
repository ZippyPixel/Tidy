<template>
  <DialogRoot v-if="mounted && isMd" :open="open" @update:open="onOpenChange">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-[hsl(220_30%_4%/0.45)] duration-150 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:!animate-none"
      />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-card border bg-popover p-6 text-popover-foreground shadow-[0_16px_48px_hsl(220_30%_4%/0.22)] outline-none duration-[180ms] ease-[cubic-bezier(0.2,0,0,1)] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] motion-reduce:!animate-none"
        :class="maxWidthClass"
        @close-auto-focus.prevent="restoreFocus"
      >
        <slot v-if="shown !== null" :value="shown" />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>

  <Drawer v-else-if="mounted" :open="open" @update:open="onOpenChange">
    <DrawerContent @close-auto-focus.prevent="restoreFocus">
      <div
        class="min-h-0 overflow-y-auto overscroll-contain pb-[calc(24px+env(safe-area-inset-bottom))] pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] pt-5"
      >
        <slot v-if="shown !== null" :value="shown" />
      </div>
    </DrawerContent>
  </Drawer>
</template>

<script>
import { useMediaQuery } from '@vueuse/core'
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot } from 'reka-ui'
import { Drawer, DrawerContent } from '@/components/ui/drawer'

// The surface shared by the hour and condition detail modals: a centered Dialog from
// md, a Drawer below it. No close button; outside click/tap and Esc close it, and on
// phone so does back navigation. The slot renders the content and needs a DialogTitle.
export default {
  name: 'DetailModalShell',
  components: { DialogContent, DialogOverlay, DialogPortal, DialogRoot, Drawer, DrawerContent },
  props: {
    /** what to show, handed to the slot; null closes the modal */
    value: { type: [Object, String], default: null },
    /** gets focus back on close */
    opener: { type: Object, default: null },
    maxWidthClass: { type: String, default: 'max-w-[480px]' },
    /** marks this modal's history entry on phone */
    historyKey: { type: String, default: 'tidyDetailModal' }
  },
  emits: ['close'],
  setup() {
    // false on the server and in jsdom; the surface is only rendered after mount so
    // SSR (always "phone") and hydration on a wide screen cannot disagree
    return { isMd: useMediaQuery('(min-width: 768px)') }
  },
  data() {
    return {
      mounted: false,
      // what is on screen: outlives `value` so the closing animation keeps its content
      shown: null,
      focusTarget: null,
      // this modal owns the current history entry
      pushed: false
    }
  },
  computed: {
    open() {
      return this.value !== null && this.value !== undefined
    }
  },
  watch: {
    value(value) {
      if (value !== null && value !== undefined) {
        this.shown = value
        this.focusTarget = this.opener
      }
    },
    open(open) {
      if (open) window.addEventListener('popstate', this.onPopState)
      else window.removeEventListener('popstate', this.onPopState)
      this.syncHistory()
    },
    isMd() {
      this.syncHistory()
    }
  },
  mounted() {
    this.mounted = true
  },
  beforeUnmount() {
    window.removeEventListener('popstate', this.onPopState)
  },
  methods: {
    // Phone only: back closes the sheet instead of leaving the page. Merged into the
    // current state, because vue-router keeps its position there.
    syncHistory() {
      if (!this.open || this.isMd || this.pushed) return
      history.pushState({ ...history.state, [this.historyKey]: true }, '')
      this.pushed = true
    },
    onOpenChange(open) {
      // vaul also reports false when mounted closed and after we have closed it;
      // only a request while still open is a real one
      if (open || !this.open) return
      if (this.pushed) {
        // the entry has to go too; popstate finishes the close
        this.pushed = false
        history.back()
      } else {
        this.$emit('close')
      }
    },
    onPopState() {
      this.pushed = false
      this.$emit('close')
    },
    restoreFocus() {
      this.focusTarget?.focus({ preventScroll: true })
    }
  }
}
</script>
