<template>
  <button
    v-if="variant === 'pill'"
    type="button"
    aria-haspopup="dialog"
    data-share-button
    class="relative my-1 inline-flex h-9 flex-none items-center gap-1.5 whitespace-nowrap rounded-full border bg-card pl-3 pr-3.5 text-sm font-semibold text-foreground shadow-[0_1px_2px_hsl(220_20%_10%/0.06)] outline-ring transition-colors duration-[120ms] ease-linear after:absolute after:inset-x-0 after:-inset-y-1 hover:bg-foreground/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:bg-foreground/[0.08]"
    @click="openShare(origin)"
  >
    <ShareIcon name="share" :size="17" />
    <span class="md:hidden">{{ $t('share.button') }}</span>
    <span class="hidden md:inline">{{ $t('share.buttonToday') }}</span>
  </button>
  <button
    v-else
    type="button"
    aria-haspopup="dialog"
    data-share-button
    :aria-label="$t(`share.pageButton.${origin}`)"
    :title="$t(`share.pageButton.${origin}`)"
    class="flex size-11 flex-none items-center justify-center rounded-full text-foreground outline-ring hover:bg-foreground/[0.06] focus-visible:outline focus-visible:outline-2 active:bg-foreground/[0.1]"
    @click="openShare(origin)"
  >
    <ShareIcon name="share" :size="20" :stroke-width="1.8" />
  </button>
</template>

<script>
// design/Tidy Share Overview, entry points: a "Share" pill beside the place name on the
// dashboard ("Share today" from md), an icon button in the detail pages' headers
import { mapActions } from 'pinia'
import ShareIcon from '@/components/share/ShareIcon.vue'
import useShareStore from '@/stores/share'

export default {
  name: 'ShareButton',
  components: { ShareIcon },
  props: {
    /** 'pill' (dashboard) | 'icon' (detail pages) */
    variant: { type: String, default: 'pill' },
    /** dashboard | tides | sky | wear: the moment the composer opens on */
    origin: { type: String, default: 'dashboard' }
  },
  methods: {
    ...mapActions(useShareStore, ['openShare'])
  }
}
</script>
