<template>
  <div class="bg-white dark:bg-night-surface rounded-3xl p-3 md:p-4 flex-1 flex flex-col justify-center">
    <p class="text-gray-500 dark:text-night-muted text-xs md:text-sm mb-0.5">{{ title }}</p>

    <!-- arc + celestial body -->
    <div class="text-slate-900 dark:text-night-text">
      <svg class="w-full overflow-visible" viewBox="0 0 200 65" fill="none" aria-hidden="true">
        <!-- dashed trajectory -->
        <path
          :d="path"
          stroke="currentColor"
          stroke-opacity="0.35"
          stroke-width="2"
          stroke-linecap="round"
          stroke-dasharray="0.5 11"
        />
        <!-- horizon -->
        <line
          :x1="arc.cx - arc.halfWidth"
          :y1="arc.baseY"
          :x2="arc.cx + arc.halfWidth"
          :y2="arc.baseY"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
        <!-- marker graphic supplied by Sun/Moon, centered at the origin -->
        <g v-if="show" class="marker" :transform="`translate(${pos.x} ${pos.y})`">
          <slot />
        </g>
      </svg>
    </div>

    <!-- times -->
    <div class="flex flex-row justify-between text-xs md:text-sm font-regular -mt-1">
      <p class="text-slate-700 dark:text-night-text">{{ riseTime }}</p>
      <p class="text-slate-700 dark:text-night-text">{{ setTime }}</p>
    </div>
  </div>
</template>

<script>
import { ARC, pointOnArc, arcPath, prefersReducedMotion } from '@/utils/astro'

export default {
  name: 'CelestialArc',
  props: {
    title: { type: String, default: '' },
    riseTime: { type: String, default: '--' },
    setTime: { type: String, default: '--' },
    // target progress 0..1 (0 = rise, 1 = set); null hides the marker
    progress: { type: Number, default: null }
  },
  data() {
    return { arc: ARC, animatedProgress: 0 }
  },
  computed: {
    show() {
      return this.progress !== null && this.progress !== undefined
    },
    path() {
      return arcPath(this.arc)
    },
    pos() {
      return pointOnArc(this.animatedProgress, this.arc)
    }
  },
  watch: {
    progress: { handler(value) { this.tween(value) }, immediate: true }
  },
  methods: {
    // glide the marker from the horizon to its current position on mount/update
    tween(target) {
      if (target === null || target === undefined) {
        this.animatedProgress = 0
        return
      }
      // this watcher is immediate, so it also runs during SSR where there is no
      // requestAnimationFrame — render the final position and let the client animate
      if (typeof requestAnimationFrame === 'undefined') {
        this.animatedProgress = target
        return
      }
      if (prefersReducedMotion()) {
        this.animatedProgress = target
        return
      }
      const duration = 1100
      const start = performance.now()
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - t, 3)
        this.animatedProgress = target * eased
        if (t < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }
  }
}
</script>

<style scoped>
.marker {
  animation: marker-in 0.6s ease-out both;
}

@keyframes marker-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
