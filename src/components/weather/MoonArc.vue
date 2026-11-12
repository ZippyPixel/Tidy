<template>
  <div class="flex min-w-0 flex-1 flex-col gap-2">
    <div class="flex items-center gap-4">
      <!-- phase poster: 96 phone / 112 md+ -->
      <div class="relative size-24 flex-none md:size-28">
        <svg v-if="!loading" class="size-full" viewBox="-56 -56 112 112" aria-hidden="true">
          <circle r="48" class="fill-moon-shadow" />
          <path :d="posterLit" class="fill-moon-lit" />
          <circle r="48" fill="none" class="stroke-moon-arc-ahead" stroke-width="1" />
        </svg>
        <Skeleton v-else class="absolute inset-2 rounded-full" />
      </div>
      <div v-if="!loading" class="flex min-w-0 flex-col gap-1">
        <span class="text-[13px] leading-4 text-muted-foreground">{{ $t('astro.moon') }}</span>
        <span class="text-base font-semibold leading-6 tabular-nums">{{ status }}</span>
        <span v-if="phaseLine" class="text-sm leading-5 tabular-nums text-muted-foreground">{{ phaseLine }}</span>
        <span v-if="note" class="text-[13px] font-semibold leading-4">{{ note }}</span>
      </div>
      <div v-else data-skeleton class="flex flex-col gap-2" aria-hidden="true">
        <Skeleton class="h-2.5 w-10" />
        <Skeleton class="h-4 w-[124px]" />
        <Skeleton class="h-3 w-[164px] max-w-full" />
      </div>
    </div>
    <CelestialArc
      :window="state && state.window"
      :show-marker="!!state && state.live"
      :loading="loading"
      lit-class="stroke-moon-arc"
      :rise-label="edgeLabel('moonrise', state && state.rise.day)"
      :rise-time="riseTime"
      :set-label="edgeLabel('moonset', state && state.set.day)"
      :set-time="setTime"
    >
      <template #marker="{ up }">
        <svg viewBox="-14 -14 28 28" class="size-[26px]" :class="up ? '' : 'opacity-55'" aria-hidden="true">
          <circle r="13" class="fill-card" />
          <circle r="9" class="fill-moon-shadow" />
          <path :d="glyphLit" class="fill-moon-lit" />
          <circle r="9" fill="none" class="stroke-moon-arc" stroke-width="1" />
        </svg>
      </template>
    </CelestialArc>
  </div>
</template>

<script>
import { Skeleton } from '@/components/ui/skeleton'
import { currentIntlTag } from '@/i18n'
import { formatAstroTime, moonLitPath, moonPhase, moonState, parseMinutes } from '@/utils/astro'
import durationMixin from '@/mixins/durationMixin'
import weatherMixin from '@/mixins/weatherMixin'
import CelestialArc from './CelestialArc.vue'

export default {
  name: 'MoonArc',
  components: { CelestialArc, Skeleton },
  mixins: [durationMixin, weatherMixin],
  props: {
    astro: { type: Object, default: () => ({}) },
    /** the next day's astro: tomorrow's rise/set when today has none */
    nextAstro: { type: Object, default: null },
    now: { type: Number, default: null },
    loading: { type: Boolean, default: false }
  },
  computed: {
    state() {
      return moonState({
        rise: parseMinutes(this.astro.moonrise),
        set: parseMinutes(this.astro.moonset),
        now: this.now,
        nextRise: parseMinutes(this.nextAstro?.moonrise),
        nextSet: parseMinutes(this.nextAstro?.moonset)
      })
    },
    phase() {
      return moonPhase(this.astro.moon_phase, this.astro.moon_illumination)
    },
    phaseLine() {
      const name = this.phase.key ? this.$t(`moonPhases.${this.phase.key}`) : this.astro.moon_phase
      if (!name) return ''
      return this.$t('astro.illuminated', { phase: name, n: this.formatNumber(this.phase.illumination) })
    },
    posterLit() {
      return moonLitPath(48, this.phase.k, this.phase.waxing)
    },
    glyphLit() {
      return moonLitPath(9, this.phase.k, this.phase.waxing)
    },
    riseTime() {
      return this.state?.rise.known ? this.time(this.astro.moonrise) : '—'
    },
    setTime() {
      if (!this.state?.set.known) return '—'
      // "No moonset" today: the time shown is tomorrow's
      return this.time(parseMinutes(this.astro.moonset) === null ? this.nextAstro?.moonset : this.astro.moonset)
    },
    status() {
      if (!this.state) return '—'
      const s = this.state.status
      if (s) return this.$t(`astro.${s.key}`, { d: this.duration(s.minutes) })
      return this.state.rise.known ? this.$t('astro.risesAt', { time: this.riseTime }) : this.$t('astro.noMoonrise')
    },
    note() {
      const n = this.state?.note
      if (!n) return ''
      return n.key === 'noMoonriseNext'
        ? this.$t('astro.noMoonriseNext', { time: this.time(this.nextAstro?.moonrise) })
        : this.$t('astro.noMoonrise')
    }
  },
  methods: {
    time(value) {
      const t = formatAstroTime(value, currentIntlTag())
      return t === '--' ? '—' : t
    },
    edgeLabel(key, day) {
      const label = this.$t(`astro.${key}`)
      return day ? this.$t('astro.withDay', { label, day: this.$t(`astro.${day}`) }) : label
    }
  }
}
</script>
