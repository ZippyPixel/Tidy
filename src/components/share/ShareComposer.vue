<template>
  <div>
    <!-- One composer; the surface depends on width: a full-screen Drawer below md, a wide
         Dialog with the card filling the left from md (design/TidyShare). Mounted lazily by
         the layout the first time someone shares. -->
    <Drawer v-if="mounted && !isMd" :open="open" :dismissible="false" @update:open="onOpenChange">
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerContent class="fixed inset-0 z-50 flex h-[100dvh] flex-col bg-background outline-none">
          <ShareComposerBody
            v-if="open"
            phone
            :origin="origin"
            :site-origin="siteOrigin"
            :title-as="DrawerTitle"
            :description-as="DrawerDescription"
            @close="requestClose"
          />
        </DrawerContent>
      </DrawerPortal>
    </Drawer>

    <DialogRoot v-else-if="mounted" :open="open" @update:open="onOpenChange">
      <DialogPortal>
        <DialogOverlay
          class="fixed inset-0 z-50 bg-[hsl(220_30%_4%/0.5)] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 h-[min(780px,calc(100dvh-48px))] w-[min(1080px,calc(100vw-48px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[20px] border bg-background shadow-[0_24px_64px_hsl(220_30%_10%/0.22)] outline-none duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <ShareComposerBody
            :origin="origin"
            :site-origin="siteOrigin"
            :title-as="DialogTitle"
            :description-as="DialogDescription"
            @close="requestClose"
          />
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { mapState } from 'pinia'
import { useMediaQuery } from '@vueuse/core'
import { DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'
import { DrawerContent, DrawerDescription, DrawerPortal, DrawerTitle } from 'vaul-vue'
import { Drawer, DrawerOverlay } from '@/components/ui/drawer'
import ShareComposerBody from '@/components/share/ShareComposerBody.vue'
import backToClose from '@/mixins/backToClose'
import useShareStore from '@/stores/share'

export default {
  name: 'ShareComposer',
  components: {
    ShareComposerBody,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerPortal,
    DialogRoot,
    DialogPortal,
    DialogOverlay,
    DialogContent
  },
  mixins: [backToClose],
  props: {
    /** the site the card links to (runtime config); the page's own origin when empty */
    siteOrigin: { type: String, default: '' }
  },
  emits: ['close'],
  setup() {
    return {
      isMd: useMediaQuery('(min-width: 768px)'),
      DrawerTitle: markRaw(DrawerTitle),
      DrawerDescription: markRaw(DrawerDescription),
      DialogTitle: markRaw(DialogTitle),
      DialogDescription: markRaw(DialogDescription)
    }
  },
  data() {
    return { mounted: false, historyKey: 'tidyShare' }
  },
  computed: {
    ...mapState(useShareStore, ['open', 'origin'])
  },
  mounted() {
    this.mounted = true
  },
  methods: {
    // the surface asks to close (Escape, overlay, back button): the history entry goes too
    onOpenChange(open) {
      if (!open) this.requestClose()
    }
  }
}
</script>
