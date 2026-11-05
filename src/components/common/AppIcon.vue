<template>
  <component :is="icon" :size="Number(size)" :stroke-width="Number(strokeWidth)" />
</template>

<script>
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  CloudRain,
  Droplet,
  Languages,
  LocateFixed,
  Moon,
  Search,
  Settings,
  Sun,
  Sunrise,
  Sunset,
  X
} from 'lucide-vue-next'

// Icons used in the app, keyed by their lucide name (kebab-case).
// Add new icons here so only the ones we use end up in the bundle.
const icons = {
  'arrow-down': ArrowDown,
  'arrow-left': ArrowLeft,
  'arrow-up': ArrowUp,
  check: Check,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'cloud-rain': CloudRain,
  droplet: Droplet,
  languages: Languages,
  'locate-fixed': LocateFixed,
  moon: Moon,
  search: Search,
  settings: Settings,
  sun: Sun,
  sunrise: Sunrise,
  sunset: Sunset,
  x: X
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
