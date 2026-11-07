<template>
  <span class="flex items-center gap-1 font-semibold text-tide">
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      class="size-4 flex-none"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <template v-if="rising">
        <path d="m5 12 7-7 7 7" />
        <path d="M12 19V5" />
      </template>
      <template v-else>
        <path d="M12 5v14" />
        <path d="m19 12-7 7-7-7" />
      </template>
    </svg>
    <span>{{ $t(rising ? 'tides.rising' : 'tides.falling') }}</span>
  </span>
</template>

<script>
export default {
  name: 'TideTrend',
  props: {
    rising: { type: Boolean, required: true }
  }
}
</script>
