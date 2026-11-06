<template>
  <div class="flex flex-col gap-2">
    <!-- the hero text above already says all this, so the track is decoration to a screen reader -->
    <div aria-hidden="true" class="relative h-2">
      <div class="flex h-2 gap-0.5 overflow-hidden rounded">
        <div
          v-for="(segment, i) in segments"
          :key="i"
          data-segment
          :class="segment.class"
          :style="{ flex: segment.flex, background: segment.color }"
        />
      </div>
      <div
        data-marker
        class="absolute top-1/2 box-border -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px]"
        :class="marker.class"
        :style="{ left: `${marker.left}%`, background: marker.color }"
      />
    </div>
    <div class="flex gap-0.5 text-xs leading-4 text-muted-foreground">
      <span v-for="label in labels" :key="label.text" class="min-w-0" :class="label.class" :style="{ flex: label.flex }">
        {{ label.text }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DetailScale',
  props: {
    /** { flex, class? , color? } */
    segments: { type: Array, required: true },
    /** { left (percent), class, color? } */
    marker: { type: Object, required: true },
    /** { text, flex, class? } */
    labels: { type: Array, required: true }
  }
}
</script>
