<template>
  <DashboardCard :title="$t('sky.planets.title')">
    <div class="-mx-3 flex flex-col">
      <div
        v-for="(p, i) in rows"
        :key="p.b"
        data-planet
        class="grid min-h-[60px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-3 py-2"
        :class="{ 'border-t': i }"
      >
        <span class="flex min-w-0 flex-col gap-0.5">
          <span class="flex flex-wrap items-center gap-2">
            <span class="text-[15px] font-semibold leading-5">{{
              $t(`sky.planets.names.${p.b}`)
            }}</span>
            <span
              v-if="p.visible"
              data-visible
              class="whitespace-nowrap rounded-full bg-accent px-2 py-px text-[11px] font-semibold leading-4 text-accent-foreground"
              >{{ $t('sky.planets.visible') }}</span
            >
          </span>
          <span
            class="text-[13px] leading-[18px] tabular-nums text-muted-foreground [text-wrap:pretty]"
            >{{ p.sub }}</span
          >
        </span>
        <span
          class="flex flex-col items-end gap-0.5 whitespace-nowrap text-[13px] leading-[18px] tabular-nums"
        >
          <span>{{ $t(`sky.planets.brightness.${p.bright}`) }}</span>
          <span class="text-muted-foreground"
            >↑ {{ skyClock(p.rise, tz) }}&nbsp;&nbsp;↓ {{ skyClock(p.set, tz) }}</span
          >
        </span>
      </div>
    </div>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import skyMixin from '@/mixins/skyMixin'
import { brightnessKey, compassPoint, nextEvent } from '@/utils/sky'

export default {
  name: 'PlanetsCard',
  components: { DashboardCard },
  mixins: [skyMixin],
  props: {
    t: { type: Number, required: true },
    tz: { type: String, required: true },
    day: { type: Object, required: true },
    now: { type: Object, required: true }
  },
  computed: {
    rows() {
      const sunAlt = this.now.sun.alt
      return this.now.planets.map((p) => {
        const { rise, set } = this.day.planets.find((d) => d.b === p.b)
        const up = p.alt > 0
        // visible: at least 5° up with the sun at least 6° down
        const visible = p.alt > 5 && sunAlt < -6
        let sub
        if (up) {
          const where = this.$t('sky.planets.high', {
            n: this.skyNumber(Math.round(p.alt)),
            point: this.skyPoint(compassPoint(p.az))
          })
          sub = visible
            ? where
            : `${where}${this.$t(sunAlt >= -6 ? 'sky.planets.daylight' : 'sky.planets.low')}`
        } else {
          const next = nextEvent(
            [
              ['rise', rise],
              ['set', set]
            ],
            this.t
          )
          sub =
            next && next[0] === 'rise'
              ? this.$t('sky.planets.belowRises', { time: this.skyClock(next[1], this.tz) })
              : this.$t('sky.planets.below')
        }
        return { b: p.b, rise, set, visible, sub, bright: brightnessKey(p.mag) }
      })
    }
  }
}
</script>
