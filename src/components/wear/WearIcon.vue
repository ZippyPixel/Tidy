<template>
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    class="flex-none fill-none stroke-current"
    :style="{ width: `${size}px`, height: `${size}px` }"
    :stroke-width="stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path :d="d" />
  </svg>
</template>

<script>
export default {
  name: 'WearIcon',
  props: {
    d: { type: String, required: true },
    size: { type: Number, default: 16 },
    stroke: { type: Number, default: 1.8 }
  }
}
</script>
