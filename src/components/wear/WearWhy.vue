<template>
  <DashboardCard :title="$t('wear.page.whyOutfit')" :busy="loading" class="self-stretch">
    <!-- design/TidyWear "Why this outfit": up to four reasons and the numbers behind them -->
    <template v-if="!loading">
      <ul class="m-0 flex list-none flex-col gap-2 p-0" :class="fadeClass">
        <li
          v-for="(r, i) in reasons"
          :key="i"
          class="flex items-center gap-2.5 text-[15px] leading-5"
          data-wear-why
        >
          <WearIcon :d="r.icon" :size="18" class="text-muted-foreground" />
          <span class="tabular-nums">{{ r.text }}</span>
        </li>
      </ul>
      <dl class="m-0 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3" :class="fadeClass">
        <div v-for="s in stats" :key="s.l" class="flex min-w-0 flex-col gap-0.5" data-wear-stat>
          <dt class="text-[13px] leading-4 text-muted-foreground">{{ s.l }}</dt>
          <dd class="m-0 whitespace-nowrap text-lg font-semibold leading-6 tabular-nums">
            {{ s.v }}
          </dd>
          <span class="text-xs leading-4 tabular-nums text-muted-foreground">{{ s.sub }}</span>
        </div>
      </dl>
    </template>
    <template v-else>
      <div class="flex flex-col gap-3">
        <Skeleton
          v-for="k in 3"
          :key="k"
          class="h-3.5"
          :class="['w-[60%]', 'w-[48%]', 'w-[54%]'][k - 1]"
        />
      </div>
      <div class="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
        <div v-for="k in 6" :key="k" class="flex flex-col gap-2">
          <Skeleton class="h-3 w-[60%]" />
          <Skeleton class="h-5 w-[40%] rounded-md" />
        </div>
      </div>
    </template>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { wearIcon } from '@/constants/wear'
import WearIcon from './WearIcon.vue'

const uvLevel = (u) =>
  u >= 11 ? 'extreme' : u >= 8 ? 'veryHigh' : u >= 6 ? 'high' : u >= 3 ? 'moderate' : 'low'

export default {
  name: 'WearWhy',
  components: { DashboardCard, Skeleton, WearIcon },
  props: {
    rec: { type: Object, default: null },
    summary: { type: Object, default: null },
    loading: { type: Boolean, default: false },
    fadeClass: { type: String, default: '' },
    // { temp, hour, speed, num } from wearMixin, a message translator and "1 PM–10 PM"
    fmt: { type: Object, required: true },
    text: { type: Function, required: true },
    span: { type: Function, required: true }
  },
  computed: {
    reasons() {
      return (this.rec?.allReasons || [])
        .slice(0, 4)
        .map((r) => ({ icon: wearIcon(r.k), text: this.text(r.t) }))
    },
    stats() {
      const s = this.summary
      if (!s) return []
      const { temp, hour, speed, num } = this.fmt
      const T = (k, p) => this.$t(`wear.stat.${k}`, p)
      const pct = (n) => `${num(n)}%`
      const kind = s.kind === 'clear' && !s.isDay ? 'clearNight' : s.kind
      const snowy = s.snow >= 20
      return [
        {
          l: T('feelsLike'),
          v:
            Math.round(s.feelsMin) === Math.round(s.feelsMax)
              ? temp(s.feelsMin)
              : this.$t('wear.tempSpan', { lo: temp(s.feelsMin), hi: temp(s.feelsMax) }),
          sub: T('air', { t: temp(s.temp) })
        },
        { l: T('sky'), v: T(`kind.${kind}`), sub: this.span(s) },
        snowy
          ? { l: T('snow'), v: pct(s.snow), sub: T('highest') }
          : {
              l: T('rain'),
              v: pct(s.rain),
              sub:
                s.rain >= 30 && s.rainH != null
                  ? T('highestAt', { hour: hour(s.rainH) })
                  : T('highest')
            },
        { l: T('wind'), v: speed(s.wind), sub: T('gusts', { speed: speed(s.gust) }) },
        {
          l: T('uv'),
          v: s.isDay ? num(s.uv) : num(0),
          sub: !s.isDay
            ? T('afterDark')
            : s.uv >= 3 && s.uvH != null
            ? T('uvAt', { level: this.$t(`uvLevels.${uvLevel(s.uv)}`), hour: hour(s.uvH) })
            : this.$t(`uvLevels.${uvLevel(s.uv)}`)
        },
        {
          l: T('humidity'),
          v: pct(s.humidity),
          sub:
            s.humidity >= 70 && s.feels >= 25
              ? T('muggy')
              : s.humidity <= 30
              ? T('dry')
              : T('average')
        }
      ]
    }
  }
}
</script>
