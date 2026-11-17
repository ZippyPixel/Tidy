<template>
  <DashboardCard :title="$t('sky.geo.title')">
    <!-- design/TidySky: seen from above the north pole, sunlight from the left, the moon on its
         orbit at its phase angle (anticlockwise from new); the arc at Earth is the Sun–Earth–Moon angle -->
    <svg
      viewBox="0 0 360 232"
      role="img"
      :aria-label="aria"
      class="mx-auto block w-full max-w-[440px]"
    >
      <defs>
        <radialGradient :id="glowId">
          <stop offset="0.55" stop-color="hsl(var(--sun))" stop-opacity="0.35" />
          <stop offset="1" stop-color="hsl(var(--sun))" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="8" cy="116" r="62" :fill="`url(#${glowId})`" />
      <circle cx="8" cy="116" r="30" class="fill-sun" />
      <line
        v-for="ry in [96, 116, 136]"
        :key="ry"
        x1="58"
        :y1="ry"
        x2="92"
        :y2="ry"
        class="stroke-sun/55"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-dasharray="1 5"
      />
      <text x="10" y="166" class="fill-foreground text-[11px] font-semibold">
        {{ $t('sky.sun.title') }}
      </text>
      <text x="10" y="179" data-sun-distance class="fill-muted-foreground text-[9px]">
        {{ sunDistance }}
      </text>
      <circle
        :cx="EX"
        :cy="EY"
        :r="ORBIT"
        fill="none"
        class="stroke-chart-grid"
        stroke-width="1.5"
      />
      <template v-for="o in orbitMarks" :key="o.key">
        <circle :cx="o.x" :cy="o.y" r="2.5" class="fill-horizon" />
        <text :x="o.tx" :y="o.ty" :text-anchor="o.anchor" class="fill-muted-foreground text-[9px]">
          {{ o.label }}
        </text>
      </template>
      <line
        :x1="EX"
        :y1="EY"
        x2="44"
        :y2="EY"
        class="stroke-sun-arc"
        stroke-width="1.5"
        stroke-dasharray="4 4"
      />
      <line
        :x1="EX"
        :y1="EY"
        :x2="moon[0]"
        :y2="moon[1]"
        class="stroke-moon-arc"
        stroke-width="1.5"
      />
      <path :d="`${arc} L${EX},${EY} Z`" class="fill-primary/[0.14]" />
      <path :d="arc" fill="none" class="stroke-primary" stroke-width="2" stroke-linecap="round" />
      <circle :cx="EX" :cy="EY" r="14" class="fill-moon-shadow" />
      <path :d="`M${EX},${EY - 14} A14,14 0 0 0 ${EX},${EY + 14} Z`" class="fill-primary" />
      <text :x="EX" y="146" text-anchor="middle" class="fill-foreground text-[11px] font-semibold">
        {{ $t('sky.geo.earth') }}
      </text>
      <circle :cx="moon[0]" :cy="moon[1]" r="11" class="fill-card" />
      <circle :cx="moon[0]" :cy="moon[1]" r="9" class="fill-moon-shadow" />
      <path
        :d="`M${moon[0]},${(moon[1] - 9).toFixed(1)} A9,9 0 0 0 ${moon[0]},${(moon[1] + 9).toFixed(
          1
        )} Z`"
        class="fill-moon-lit"
      />
      <circle
        :cx="moon[0]"
        :cy="moon[1]"
        r="9"
        fill="none"
        class="stroke-moon-arc"
        stroke-width="1"
      />
      <text
        :x="moonLabel.x"
        :y="moonLabel.y"
        :text-anchor="moonLabel.anchor"
        class="fill-foreground text-[11px] font-semibold"
      >
        {{ $t('sky.moon.title') }}
      </text>
      <text
        :x="angleAt[0]"
        :y="angleAt[1]"
        text-anchor="middle"
        data-angle
        class="fill-primary text-[13px] font-bold tabular-nums"
      >
        {{ skyDegrees(Math.round(now.elongation)) }}
      </text>
    </svg>
    <div class="grid grid-cols-3 gap-2">
      <div
        v-for="tile in tiles"
        :key="tile.key"
        data-tile
        class="flex min-w-0 flex-col gap-0.5 rounded-lg bg-surface-raised px-3 py-2.5"
      >
        <span class="text-xs font-medium leading-4 text-muted-foreground">{{ tile.label }}</span>
        <span class="whitespace-nowrap text-lg font-medium leading-6 tabular-nums">{{
          tile.value
        }}</span>
      </div>
    </div>
    <p data-explain class="text-[13px] leading-[19px] [text-wrap:pretty]">{{ explain }}</p>
    <NuxtLink
      :to="tideLink"
      data-tide-link
      class="-my-1.5 inline-flex min-h-9 items-center gap-0.5 self-start rounded text-sm font-semibold text-primary outline-ring focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <span>{{
        $t('sky.geo.tideLink', {
          date: skyDate(t, tz, { weekday: 'short', month: 'short', day: 'numeric' })
        })
      }}</span>
      <AppIcon name="chevron-right" :size="18" :stroke-width="2" />
    </NuxtLink>
    <p class="text-xs leading-[17px] text-muted-foreground [text-wrap:pretty]">
      {{ $t('sky.geo.note') }}
    </p>
  </DashboardCard>
</template>

<script>
import { useId } from 'vue'
import AppIcon from '@/components/common/AppIcon.vue'
import DashboardCard from '@/components/common/DashboardCard.vue'
import skyMixin from '@/mixins/skyMixin'
import { localDate, phaseKey } from '@/utils/sky'

const EX = 214
const EY = 116
const ORBIT = 80
const ARC = 30
const RAD = Math.PI / 180
const KM_PER_MILE = 1.609344

/** the moon on its orbit at the phase angle: 0° new (towards the sun), anticlockwise */
const onOrbit = (deg, r = ORBIT) => [EX - r * Math.cos(deg * RAD), EY + r * Math.sin(deg * RAD)]

export default {
  name: 'SunEarthMoon',
  components: { AppIcon, DashboardCard },
  mixins: [skyMixin],
  props: {
    t: { type: Number, required: true },
    tz: { type: String, required: true },
    now: { type: Object, required: true },
    /** the page's place: the tides link opens the station nearest it, not the forecast's */
    place: { type: Object, default: null }
  },
  setup() {
    // useId so SSR and hydration agree on the gradient's id
    return { glowId: `sky-glow-${useId()}` }
  },
  data() {
    return { EX, EY, ORBIT }
  },
  computed: {
    phase() {
      return this.now.phase
    },
    moon() {
      return onOrbit(this.phase).map((v) => Number(v.toFixed(1)))
    },
    arc() {
      const [ax, ay] = onOrbit(this.phase, ARC)
      return `M${EX - ARC},${EY} A${ARC},${ARC} 0 0 ${this.phase <= 180 ? 0 : 1} ${ax.toFixed(
        1
      )},${ay.toFixed(1)}`
    },
    angleAt() {
      const mid = this.phase <= 180 ? this.phase / 2 : this.phase + (360 - this.phase) / 2
      const [x, y] = onOrbit(mid, 48)
      return [x.toFixed(1), (y + 4).toFixed(1)]
    },
    moonLabel() {
      const [x, y] = this.moon
      const below = y > EY
      const side = Math.abs(x - EX) > 40
      return {
        x: (x + (x > EX + 40 ? -14 : x < EX - 40 ? 14 : 0)).toFixed(1),
        y: (y + (side ? (below ? -14 : 22) : below ? -15 : 24)).toFixed(1),
        anchor: x > EX + 40 ? 'end' : x < EX - 40 ? 'start' : 'middle'
      }
    },
    orbitMarks() {
      return [
        ['new', 0],
        ['firstQuarter', 90],
        ['full', 180],
        ['lastQuarter', 270]
      ].map(([key, a]) => {
        const [x, y] = onOrbit(a)
        return {
          key,
          label: this.$t(`sky.geo.orbit.${key}`),
          x: x.toFixed(1),
          y: y.toFixed(1),
          tx: (a === 0 ? x - 7 : a === 180 ? x + 7 : x).toFixed(1),
          ty: (a === 90 ? y + 14 : y - 8).toFixed(1),
          anchor: a === 0 ? 'end' : a === 180 ? 'start' : 'middle'
        }
      })
    },
    sunDistance() {
      const km = this.now.sunKm
      const value = (this.skyMiles ? km / KM_PER_MILE : km) / 1e6
      return this.$t(this.skyMiles ? 'sky.geo.millionMi' : 'sky.geo.millionKm', {
        n: this.skyNumber(value, 1)
      })
    },
    lit() {
      return this.skyNumber(Math.round(this.now.lit * 100))
    },
    tiles() {
      return [
        {
          key: 'angle',
          label: this.$t('sky.geo.angle'),
          value: this.skyDegrees(this.now.elongation, 1)
        },
        { key: 'lit', label: this.$t('sky.geo.lit'), value: `${this.lit}%` },
        {
          key: 'phase',
          label: this.$t('sky.geo.phase'),
          value: this.$t(this.now.waxing ? 'sky.geo.waxing' : 'sky.geo.waning')
        }
      ]
    },
    explain() {
      const e = this.now.elongation
      const tide = e < 25 || e > 155 ? 'spring' : e > 65 && e < 115 ? 'neap' : 'between'
      return [
        this.$t('sky.geo.explain', { angle: this.skyNumber(Math.round(e)), lit: this.lit }),
        this.$t(this.now.waxing ? 'sky.geo.growing' : 'sky.geo.shrinking'),
        this.$t(`sky.geo.tides.${tide}`)
      ].join(' ')
    },
    aria() {
      return this.$t('sky.geo.aria', {
        angle: this.skyNumber(Math.round(this.now.elongation)),
        phase: this.$t(`sky.phases.${phaseKey(this.phase)}`)
      })
    },
    date() {
      return localDate(this.t, this.tz)
    },
    tideLink() {
      const query = { date: this.date }
      if (this.place) {
        query.lat = String(Math.round(this.place.lat * 1e4) / 1e4)
        query.lon = String(Math.round(this.place.lon * 1e4) / 1e4)
        if (this.place.name) query.name = this.place.name
      }
      return { path: '/tides', query }
    }
  }
}
</script>
