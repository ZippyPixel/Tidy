<template>
  <!-- design/TidySegmented: pill track, sliding primary thumb. Segments are equal
       width (grid 1fr), so the thumb slides by its own width with no measuring. -->
  <div
    :role="kind === 'tabs' ? 'tablist' : 'radiogroup'"
    :aria-label="ariaLabel"
    class="segmented relative h-10 grid-flow-col gap-0.5 rounded-full bg-popover p-0.5 align-middle shadow-[inset_0_0_0_1px_hsl(var(--input))]"
    :class="fullWidth ? 'grid w-full' : 'inline-grid'"
    :style="{ '--count': options.length, '--index': selectedIndex }"
    @keydown="onKeydown"
  >
    <span aria-hidden="true" class="segmented-thumb pointer-events-none absolute bottom-0.5 left-0.5 top-0.5 rounded-full bg-primary" />
    <button
      v-for="(option, i) in options"
      :key="option.value"
      ref="segments"
      type="button"
      :role="kind === 'tabs' ? 'tab' : 'radio'"
      :aria-selected="kind === 'tabs' ? String(option.value === modelValue) : undefined"
      :aria-checked="kind === 'radio' ? String(option.value === modelValue) : undefined"
      :tabindex="option.value === modelValue ? 0 : -1"
      class="segmented-option relative z-[1] h-9 min-w-14 whitespace-nowrap rounded-full px-4 text-sm leading-5 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
      :class="
        option.value === modelValue
          ? 'font-semibold text-primary-foreground'
          : 'font-medium text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground active:bg-foreground/[0.12]'
      "
      @click="select(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'SegmentedControl',
  props: {
    /** [{ value, label }] */
    options: { type: Array, required: true },
    modelValue: { type: String, required: true },
    /** 'tabs' for view switchers, 'radio' for settings values */
    kind: { type: String, default: 'tabs', validator: (v) => ['tabs', 'radio'].includes(v) },
    ariaLabel: { type: String, default: '' },
    fullWidth: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  computed: {
    selectedIndex() {
      return Math.max(0, this.options.findIndex((o) => o.value === this.modelValue))
    }
  },
  methods: {
    select(value) {
      if (value !== this.modelValue) this.$emit('update:modelValue', value)
    },
    onKeydown(event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      const n = this.options.length
      const next = (this.selectedIndex + (event.key === 'ArrowRight' ? 1 : -1) + n) % n
      this.select(this.options[next].value)
      this.$refs.segments?.[next]?.focus()
    }
  }
}
</script>

<style scoped>
.segmented {
  grid-auto-columns: minmax(0, 1fr);
}

/* one segment wide (track minus padding and gaps), stepped by width + gap */
.segmented-thumb {
  width: calc((100% - 4px - (var(--count) - 1) * 2px) / var(--count));
  transform: translateX(calc(var(--index) * (100% + 2px)));
  transition: transform 200ms cubic-bezier(0.2, 0, 0, 1);
}

.segmented-option {
  transition: color 200ms cubic-bezier(0.2, 0, 0, 1), background-color 120ms linear;
}

@media (prefers-reduced-motion: reduce) {
  .segmented-thumb,
  .segmented-option {
    transition: none;
  }
}
</style>
