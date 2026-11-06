<template>
  <!-- 12 equal columns from md; below it a sideways scroll that bleeds to the hero card's
       edges. data-vaul-no-drag: a sideways swipe here scrolls instead of moving the sheet. -->
  <div
    data-strip
    data-vaul-no-drag
    class="-mx-5 flex gap-1 overflow-x-auto px-5 scrollbar-hide [mask-image:linear-gradient(to_right,#000_calc(100%-28px),transparent)] md:mx-0 md:grid md:grid-cols-12 md:gap-0.5 md:overflow-visible md:px-0 md:[mask-image:none]"
  >
    <div
      v-for="column in columns"
      :key="column.key"
      data-column
      class="flex w-10 min-w-0 flex-none flex-col items-center justify-end gap-1.5 md:w-auto"
    >
      <div v-if="column.icon || column.degree !== undefined" aria-hidden="true" class="flex size-5 items-center justify-center">
        <svg
          v-if="column.degree !== undefined"
          data-arrow
          viewBox="0 0 24 24"
          class="size-3.5 text-chart-wind"
          :style="{ transform: `rotate(${column.degree + 180}deg)` }"
        >
          <path d="M12 3 L19 21 L12 16.5 L5 21 Z" fill="currentColor" />
        </svg>
        <span v-else-if="column.icon === 'sun'" data-icon="sun" class="size-[15px] rounded-full bg-sun" />
        <svg v-else-if="column.icon === 'moon'" data-icon="moon" viewBox="0 0 24 24" class="size-[17px]">
          <path
            d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
            class="fill-moon-lit stroke-moon-arc-ahead"
            stroke-width="1.2"
            stroke-linejoin="round"
          />
        </svg>
        <svg
          v-else-if="column.icon === 'cloud'"
          data-icon="cloud"
          viewBox="0 0 24 24"
          class="size-[19px] fill-cloud-highlight stroke-muted-foreground"
          stroke-width="1.6"
          stroke-linejoin="round"
        >
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
        <svg
          v-else-if="column.icon === 'rain'"
          data-icon="rain"
          viewBox="0 0 24 24"
          fill="none"
          class="size-[19px] stroke-rain"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
          <path d="M16 14v6" />
          <path d="M8 14v6" />
          <path d="M12 16v6" />
        </svg>
      </div>

      <div class="relative" :class="boxClass">
        <!-- nothing to draw is a flat dash, so an empty slot still reads as a reading -->
        <div
          v-if="column.height === null"
          data-fill
          class="absolute inset-x-0 bottom-0 h-0.5 rounded-[1px] bg-foreground/[0.22]"
        />
        <div
          v-else
          data-fill
          class="absolute inset-x-0 bottom-0"
          :class="fillClass"
          :style="{ height: `${column.height}%`, background: column.color }"
        />
      </div>

      <span data-value class="whitespace-nowrap text-xs leading-4 tabular-nums" :class="column.valueClass || 'font-medium'">
        {{ column.value }}
      </span>
      <span
        class="whitespace-nowrap text-[11px] leading-[14px]"
        :class="column.isNow ? 'font-semibold text-foreground' : 'text-muted-foreground'"
      >
        {{ column.time }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DetailBarStrip',
  props: {
    /** { key, time, isNow, value, height (null = flat dash), valueClass?, icon?, degree?, color? } */
    columns: { type: Array, required: true },
    /** size and track of the bar */
    boxClass: { type: String, required: true },
    /** colour (unless a column has its own) and radius of the bar */
    fillClass: { type: String, required: true }
  }
}
</script>
