<template>
  <div
    ref="list"
    role="tablist"
    :aria-label="label"
    class="tidy-motion relative isolate flex w-full gap-0.5 rounded-[var(--radius)] bg-muted p-[3px] sm:w-fit"
  >
    <!-- design/TidyWear tabThumb: one thumb slides under the tabs (transform, 420ms) and the
         labels change colour in 240ms. The design's tabs are equal widths; here the thumb takes
         the active tab's own box (offsetLeft / offsetWidth) so longer Bengali labels fit. Until
         it is measured (SSR, first paint) the active tab paints its own background. -->
    <div
      v-if="thumb"
      aria-hidden="true"
      class="pointer-events-none absolute bottom-[3px] left-0 top-[3px] z-0 rounded-[calc(var(--radius)-2px)] bg-card shadow-[0_1px_2px_hsl(220_20%_10%/0.12)]"
      :class="animate ? 'transition-[transform,width] duration-[420ms] ease-tidy' : ''"
      :style="{ width: `${thumb.width}px`, transform: `translateX(${thumb.left}px)` }"
      data-wear-tab-thumb
    />
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      :aria-selected="String(tab.on)"
      :tabindex="tab.on ? 0 : -1"
      :disabled="disabled"
      class="relative z-[1] flex h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[calc(var(--radius)-2px)] px-4 text-[15px] font-semibold leading-5 outline-ring transition-colors duration-[240ms] ease-tidy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 sm:h-14 sm:min-w-[132px] sm:flex-none sm:items-start"
      :class="[
        tab.on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        tab.on && !thumb ? 'bg-card shadow-[0_1px_2px_hsl(220_20%_10%/0.12)]' : ''
      ]"
      data-wear-tab
      @click="$emit('pick', tab.id)"
      @keydown="onKey"
    >
      <span>{{ tab.label }}</span>
      <span
        v-if="tab.sub"
        class="whitespace-nowrap text-xs font-medium leading-4 tabular-nums text-muted-foreground"
        >{{ tab.sub }}</span
      >
    </button>
  </div>
</template>

<script>
export default {
  name: 'WearTabs',
  props: {
    // [{ id, label, sub, on }]
    tabs: { type: Array, required: true },
    label: { type: String, default: '' },
    disabled: { type: Boolean, default: false }
  },
  emits: ['pick'],
  data() {
    // thumb: the active tab's box in the list ({ left, width }), null until measured
    return { thumb: null, animate: false }
  },
  computed: {
    activeIndex() {
      return this.tabs.findIndex((t) => t.on)
    },
    // anything that can change a tab's width: which one is on, its words, the language
    measureKey() {
      return JSON.stringify([this.activeIndex, this.tabs.map((t) => [t.label, t.sub])])
    }
  },
  // after the DOM has the new labels
  watch: {
    measureKey: { handler: 'measure', flush: 'post' },
    '$i18n.locale': { handler: 'measure', flush: 'post' }
  },
  mounted() {
    this.measure()
    // slide only after the first placement, so the thumb never flies in from the left
    requestAnimationFrame(() => (this.animate = true))
    if (typeof ResizeObserver !== 'undefined') {
      // kept off data(): a reactive proxy breaks the native observer's methods
      this.resizeObserver = new ResizeObserver(() => this.measure())
      this.resizeObserver.observe(this.$refs.list)
    }
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect()
  },
  methods: {
    measure() {
      const tab = this.$refs.list?.querySelectorAll('[role="tab"]')[this.activeIndex]
      if (!tab || !tab.offsetWidth) {
        this.thumb = null
        return
      }
      const next = { left: tab.offsetLeft, width: tab.offsetWidth }
      if (this.thumb?.left !== next.left || this.thumb?.width !== next.width) this.thumb = next
    },
    // arrow keys move between the tabs and select, like the segmented control
    onKey(event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      const n = this.tabs.length
      const i = Math.max(0, this.activeIndex)
      const next = this.tabs[(i + (event.key === 'ArrowRight' ? 1 : n - 1)) % n]
      this.$emit('pick', next.id)
      this.$nextTick(() => this.$refs.list?.querySelector('[role="tab"][tabindex="0"]')?.focus())
    }
  }
}
</script>
