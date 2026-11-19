<template>
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    class="flex-none"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path :d="path" />
  </svg>
</template>

<script>
import { SHARE_ICONS } from '@/components/share/icons'

export default {
  name: 'ShareIcon',
  props: {
    name: { type: String, required: true },
    size: { type: Number, default: 18 },
    strokeWidth: { type: Number, default: 1.9 }
  },
  computed: {
    path() {
      return SHARE_ICONS[this.name] || ''
    }
  }
}
</script>
