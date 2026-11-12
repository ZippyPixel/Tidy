<template>
  <div class="flex min-w-0 flex-1 flex-col gap-2">
    <div class="flex h-10 items-end justify-between gap-3">
      <template v-if="!loading">
        <div class="flex min-w-0 flex-col">
          <span class="text-[13px] leading-4 text-muted-foreground">{{ $t('astro.sun') }}</span>
          <span class="whitespace-nowrap text-base font-semibold leading-6 tabular-nums">{{ status }}</span>
        </div>
        <span v-if="extra" class="pb-1 text-right text-[13px] leading-4 tabular-nums text-muted-foreground">{{ extra }}</span>
      </template>
      <div v-else data-skeleton class="flex flex-col gap-2" aria-hidden="true">
        <Skeleton class="h-2.5 w-8" />
        <Skeleton class="h-4 w-[124px]" />
      </div>
    </div>
    <CelestialArc
      :window="state && state.window"
      :show-marker="!!state && state.live"
      :loading="loading"
      lit-class="stroke-sun-arc"
      :rise-label="$t('astro.sunrise')"
      :rise-time="time(astro.sunrise)"
      :set-label="$t('astro.sunset')"
      :set-time="time(astro.sunset)"
    >
      <template #marker="{ up }">
        <div class="relative flex size-11 items-center justify-center">
          <span v-if="up" class="absolute inset-0 rounded-full bg-[radial-gradient(hsl(var(--sun)/0.6),hsl(var(--sun)/0)_70%)]" />
          <span class="relative size-[18px] rounded-full border-2 border-card" :class="up ? 'bg-sun' : 'bg-horizon'" />
        </div>
      </template>
    </CelestialArc>
  </div>
</template>

<script>
import { Skeleton } from '@/components/ui/skeleton'
import { currentIntlTag } from '@/i18n'
import { formatAstroTime, parseMinutes, sunState } from '@/utils/astro'
import durationMixin from '@/mixins/durationMixin'
import CelestialArc from './CelestialArc.vue'

export default {
  name: 'SunArc',
  components: { CelestialArc, Skeleton },
  mixins: [durationMixin],
  props: {
    astro: { type: Object, default: () => ({}) },
    /** the next day's astro, for the countdown after sunset */
    nextAstro: { type: Object, default: null },
    /** minutes since the location's midnight; null for a day other than today */
    now: { type: Number, default: null },
    loading: { type: Boolean, default: false }
  },
  computed: {
    state() {
      return sunState({
        rise: parseMinutes(this.astro.sunrise),
        set: parseMinutes(this.astro.sunset),
        now: this.now,
        nextRise: parseMinutes(this.nextAstro?.sunrise)
      })
    },
    status() {
      if (!this.state) return '—'
      if (!this.state.status) return this.$t('astro.risesAt', { time: this.time(this.astro.sunrise) })
      return this.$t(`astro.${this.state.status.key}`, { d: this.duration(this.state.status.minutes) })
    },
    extra() {
      return this.state ? this.$t('astro.daylight', { d: this.duration(this.state.daylight) }) : ''
    }
  },
  methods: {
    time(value) {
      const t = formatAstroTime(value, currentIntlTag())
      return t === '--' ? '—' : t
    }
  }
}
</script>
