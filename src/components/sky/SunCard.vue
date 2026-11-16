<template>
  <DashboardCard :title="$t('sky.sun.title')">
    <div class="grid grid-cols-2 gap-2">
      <div
        v-for="tile in tiles"
        :key="tile.key"
        data-tile
        class="flex min-w-0 flex-col gap-1 rounded-lg bg-surface-raised px-3.5 py-3"
      >
        <span class="whitespace-nowrap text-xs font-medium leading-4 text-muted-foreground">{{
          tile.label
        }}</span>
        <span class="whitespace-nowrap text-lg font-medium leading-6 tabular-nums">{{
          tile.value
        }}</span>
        <span class="text-xs leading-4 tabular-nums text-muted-foreground [text-wrap:pretty]">{{
          tile.sub
        }}</span>
      </div>
    </div>
    <div class="flex flex-col">
      <div
        v-for="row in rows"
        :key="row.key"
        data-sun-row
        class="grid grid-cols-[8px_minmax(0,1fr)_auto] items-center gap-3 border-t py-[9px] text-sm leading-5"
        :class="{ 'text-muted-foreground': row.past }"
      >
        <span class="size-2 flex-none rounded-full" :class="row.dot" />
        <span class="min-w-0">{{ row.label }}</span>
        <span class="whitespace-nowrap text-right font-semibold tabular-nums">{{
          skyClock(row.t, tz)
        }}</span>
      </div>
    </div>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import skyMixin from '@/mixins/skyMixin'

const RAD = Math.PI / 180

export default {
  name: 'SunCard',
  components: { DashboardCard },
  mixins: [skyMixin],
  props: {
    t: { type: Number, required: true },
    tz: { type: String, required: true },
    day: { type: Object, required: true },
    prevDay: { type: Object, required: true },
    now: { type: Object, required: true }
  },
  computed: {
    tiles() {
      const s = this.day.sun
      const p = this.prevDay.sun
      const len = s.rise != null && s.set != null ? s.set - s.rise : null
      const lenBefore = p.rise != null && p.set != null ? p.set - p.rise : null
      const diff = len != null && lenBefore != null ? Math.round((len - lenBefore) / 1000) : null
      let diffText = ''
      if (diff != null) {
        const abs = Math.abs(diff)
        diffText =
          abs < 1
            ? this.$t('sky.sun.sameLength')
            : this.$t(diff > 0 ? 'sky.sun.longer' : 'sky.sun.shorter', {
                m: this.skyNumber(Math.floor(abs / 60)),
                s: this.skyNumber(abs % 60).padStart(2, this.skyNumber(0))
              })
      }
      const alt = this.now.sun.alt
      const shadow = alt > 0.5 ? 1 / Math.tan(alt * RAD) : null
      const unit = this.$t(this.skyMiles ? 'sky.sun.ft' : 'sky.sun.m')
      const range = (a, b) =>
        a != null && b != null ? `${this.skyClock(a, this.tz)} – ${this.skyClock(b, this.tz)}` : '—'
      return [
        {
          key: 'length',
          label: this.$t('sky.sun.dayLength'),
          value: len != null ? this.skyDuration(len) : '—',
          sub: diffText
        },
        {
          key: 'shadow',
          label: this.$t('sky.sun.shadow'),
          value:
            shadow == null
              ? this.$t('sky.sun.noShadow')
              : shadow > 20
              ? this.$t('sky.sun.veryLong')
              : this.$t('sky.sun.times', { n: this.skyNumber(shadow, 1) }),
          sub:
            shadow == null
              ? this.$t('sky.sun.isDown')
              : this.$t(shadow > 20 ? 'sky.sun.poleOver' : 'sky.sun.pole', {
                  n: this.skyNumber(Math.min(shadow, 20), shadow > 20 ? 0 : 1),
                  unit
                })
        },
        {
          key: 'golden',
          label: this.$t('sky.sun.golden'),
          value: range(s.rise, s.goldenEnd),
          sub: this.$t('sky.sun.evening', { range: range(s.goldenStart, s.set) })
        },
        {
          key: 'blue',
          label: this.$t('sky.sun.blue'),
          value: range(s.civilDawn, s.blueEnd),
          sub: this.$t('sky.sun.evening', { range: range(s.blueStart, s.civilDusk) })
        }
      ]
    },
    rows() {
      const s = this.day.sun
      const row = (key, t, dot, label) => ({
        key,
        t,
        dot,
        past: t != null && t < this.t,
        label: label ?? this.$t(`sky.sun.${key}`)
      })
      return [
        row('astroDawn', s.astroDawn, 'bg-moon-arc'),
        row('civilDawn', s.civilDawn, 'bg-primary'),
        row('sunrise', s.rise, 'bg-sun-arc'),
        row(
          'noon',
          s.noon?.t ?? null,
          'bg-sun',
          s.noon
            ? this.$t('sky.sun.noonHigh', { n: this.skyNumber(Math.round(s.noon.alt)) })
            : this.$t('sky.sun.noon')
        ),
        row('sunset', s.set, 'bg-sun-arc'),
        row('civilDusk', s.civilDusk, 'bg-primary'),
        row('astroDusk', s.astroDusk, 'bg-moon-arc')
      ]
    }
  }
}
</script>
