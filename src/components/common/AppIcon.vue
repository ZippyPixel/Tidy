<template>
  <component :is="icon" :size="Number(size)" :stroke-width="Number(strokeWidth)" />
</template>

<script>
import { ChevronRight, CloudRain, Languages, Moon, Settings, Sun } from 'lucide-vue-next'

// Icons used in the app, keyed by their lucide name (kebab-case).
// Add new icons here so only the ones we use end up in the bundle.
const icons = {
  'chevron-right': ChevronRight,
  'cloud-rain': CloudRain,
  languages: Languages,
  moon: Moon,
  settings: Settings,
  sun: Sun
}

export default {
  name: 'AppIcon',
  props: {
    /** Icon name from https://lucide.dev/icons — must be registered in the icons map above */
    name: {
      type: String,
      required: true,
      validator: (v) => v in icons
    },
    /** Icon size in pixels */
    size: {
      type: [Number, String],
      default: 24
    },
    /** SVG stroke width */
    strokeWidth: {
      type: [Number, String],
      default: 2
    }
  },
  computed: {
    icon() {
      return icons[this.name]
    }
  }
}
</script>
