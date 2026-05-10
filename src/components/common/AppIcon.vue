<template>
  <span
    class="material-symbols-outlined flex items-center justify-center"
    :style="{
      fontSize: size + 'px',
      fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opsz}`
    }"
    >{{ name }}</span
  >
</template>

<script>
export default {
  name: 'AppIcon',
  props: {
    /** Icon name from https://fonts.google.com/icons */
    name: {
      type: String,
      required: true
    },
    /** Icon size in pixels */
    size: {
      type: [Number, String],
      default: 24
    },
    /** Fill: 0 = outlined, 1 = filled */
    fill: {
      type: Number,
      default: 0,
      validator: (v) => v === 0 || v === 1
    },
    /** Weight: 100–700 */
    weight: {
      type: Number,
      default: 400
    },
    /** Grade: -50 to 200 */
    grade: {
      type: Number,
      default: 0
    },
    /** Optical size: 20–48 */
    opsz: {
      type: Number,
      default: 24
    }
  }
}
</script>
