<template>
  <!-- planetary info -->
  <div class="w-full md:w-auto md:min-w-[15rem] lg:w-full flex flex-col gap-4 md:gap-6">
    <div
      v-for="panel in panels"
      :key="panel.key"
      class="bg-white dark:bg-night-surface rounded-3xl p-4 md:p-5"
    >
      <p class="text-gray-500 dark:text-night-muted text-sm mb-1">{{ panel.title }}</p>

      <!-- arc -->
      <div class="text-slate-900 dark:text-night-text">
        <svg
          class="w-full overflow-visible"
          viewBox="0 0 200 116"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <radialGradient v-if="panel.key === 'sun'" id="grad-sun" cx="35%" cy="30%" r="75%">
              <stop offset="0" stop-color="#ffe08a" />
              <stop offset="1" stop-color="#f5a623" />
            </radialGradient>
            <radialGradient v-else id="grad-moon" cx="35%" cy="28%" r="85%">
              <stop offset="0" stop-color="#94a3b4" />
              <stop offset="1" stop-color="#5b6b7a" />
            </radialGradient>
          </defs>

          <!-- dashed trajectory -->
          <path
            class="arc"
            d="M 6 104 A 94 94 0 0 1 194 104"
            stroke="currentColor"
            stroke-opacity="0.35"
            stroke-width="2"
            stroke-linecap="round"
            stroke-dasharray="0.5 11"
          />
          <!-- horizon -->
          <line
            x1="6"
            y1="104"
            x2="194"
            y2="104"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          />

          <!-- celestial body -->
          <g
            v-if="panel.show"
            class="marker"
            :transform="`translate(${panel.pos.x} ${panel.pos.y})`"
          >
            <template v-if="panel.key === 'sun'">
              <circle class="glow" r="9" fill="#f5a623" opacity="0.25" />
              <g class="rays">
                <line
                  v-for="n in 8"
                  :key="n"
                  x1="0"
                  y1="-9.5"
                  x2="0"
                  y2="-12.5"
                  :transform="`rotate(${n * 45})`"
                  stroke="#f5a623"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </g>
              <circle r="6.5" fill="url(#grad-sun)" />
            </template>
            <template v-else>
              <g class="moon-body">
                <circle r="8" fill="url(#grad-moon)" />
                <circle cx="2.6" cy="-1.6" r="1.6" fill="#46545f" opacity="0.5" />
                <circle cx="-1.6" cy="2" r="1.1" fill="#46545f" opacity="0.45" />
                <circle cx="1" cy="3" r="0.8" fill="#46545f" opacity="0.4" />
              </g>
            </template>
          </g>
        </svg>
      </div>

      <!-- times -->
      <div class="flex flex-row justify-between text-sm md:text-base font-regular -mt-1">
        <p class="text-slate-700 dark:text-night-text">{{ panel.riseTime }}</p>
        <p class="text-slate-700 dark:text-night-text">{{ panel.setTime }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import useWeatherStore from '@/stores/weather'
import { currentIntlTag } from '@/i18n'

const ARC = { cx: 100, cy: 104, r: 94 }

export default {
  name: 'PlanetaryInfo',
  data() {
    return {
      // eased progress values driving the marker position (0 = rise, 1 = set)
      animatedSunP: 0,
      animatedMoonP: 0
    }
  },
  computed: {
    ...mapState(useWeatherStore, ['astro']),
    sunTarget() {
      return this.progressBetween(this.astro && this.astro.sunrise, this.astro && this.astro.sunset)
    },
    moonTarget() {
      return this.progressBetween(this.astro && this.astro.moonrise, this.astro && this.astro.moonset)
    },
    panels() {
      const a = this.astro || {}
      return [
        {
          key: 'sun',
          title: this.$t('planetary.sunriseSunset'),
          riseTime: this.formatAstroTime(a.sunrise),
          setTime: this.formatAstroTime(a.sunset),
          show: this.sunTarget !== null,
          pos: this.pointOnArc(this.animatedSunP)
        },
        {
          key: 'moon',
          title: this.$t('planetary.moonriseMoonset'),
          riseTime: this.formatAstroTime(a.moonrise),
          setTime: this.formatAstroTime(a.moonset),
          show: this.moonTarget !== null,
          pos: this.pointOnArc(this.animatedMoonP)
        }
      ]
    }
  },
  watch: {
    sunTarget: { handler(v) { this.tween('animatedSunP', v) }, immediate: true },
    moonTarget: { handler(v) { this.tween('animatedMoonP', v) }, immediate: true }
  },
  methods: {
    // "05:29 AM" -> minutes since midnight, or null when unparseable ("No moonrise", etc.)
    parseMinutes(str) {
      if (!str || typeof str !== 'string') return null
      const m = str.trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/)
      if (!m) return null
      let hours = Number(m[1]) % 12
      if (/[Pp]/.test(m[3])) hours += 12
      return hours * 60 + Number(m[2])
    },
    nowMinutes() {
      const d = new Date()
      return d.getHours() * 60 + d.getMinutes()
    },
    // fraction of the way from rise to set, clamped to [0, 1]; handles spans past midnight
    progressBetween(riseStr, setStr) {
      const rise = this.parseMinutes(riseStr)
      const set = this.parseMinutes(setStr)
      if (rise === null || set === null) return null
      const end = set <= rise ? set + 1440 : set
      let now = this.nowMinutes()
      if (now < rise) now += 1440
      const frac = (now - rise) / (end - rise)
      return Math.max(0, Math.min(1, frac))
    },
    pointOnArc(p) {
      const theta = Math.PI * (1 - p)
      return {
        x: +(ARC.cx + ARC.r * Math.cos(theta)).toFixed(2),
        y: +(ARC.cy - ARC.r * Math.sin(theta)).toFixed(2)
      }
    },
    // localize the API's "05:29 AM" using the active locale's digits and
    // day-period markers; falls back to '--' for missing/"No moonrise" values
    formatAstroTime(str) {
      const minutes = this.parseMinutes(str)
      if (minutes === null) return '--'
      const date = new Date()
      date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
      return new Intl.DateTimeFormat(currentIntlTag(), {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date)
    },
    prefersReducedMotion() {
      return typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false
    },
    tween(key, target) {
      if (target === null || target === undefined) {
        this[key] = 0
        return
      }
      if (this.prefersReducedMotion()) {
        this[key] = target
        return
      }
      const duration = 1100
      const start = performance.now()
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - t, 3)
        this[key] = target * eased
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

.rays,
.glow,
.moon-body {
  transform-box: fill-box;
  transform-origin: center;
}

@media (prefers-reduced-motion: no-preference) {
  .rays {
    animation: spin 26s linear infinite;
  }
  .glow {
    animation: glow 3.2s ease-in-out infinite;
  }
  .moon-body {
    animation: float 4.5s ease-in-out infinite;
  }
}

@keyframes marker-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes glow {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.22;
  }
  50% {
    transform: scale(1.28);
    opacity: 0.4;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-1.5px);
  }
}
</style>
