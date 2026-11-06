<template>
  <div v-if="view" class="flex flex-col gap-5">
    <div class="flex flex-col gap-0.5">
      <DialogTitle as="h2" class="text-xl font-semibold leading-7 tracking-[-0.01em]">{{ view.title }}</DialogTitle>
      <DialogDescription as="span" class="text-[13px] leading-4 text-muted-foreground">
        {{ $t('conditionDetail.updated', { time: formatClock(current.last_updated) }) }}
      </DialogDescription>
    </div>

    <div data-hero class="flex flex-col gap-5 rounded-tile bg-surface-raised p-5">
      <div class="flex items-center justify-between gap-4">
        <div class="flex min-w-0 flex-col gap-1">
          <span class="text-[13px] font-medium leading-4 text-muted-foreground">{{ view.kicker }}</span>
          <div class="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <span
              data-big
              :class="
                view.bigIsText
                  ? 'text-[32px] font-medium leading-[1.1] tracking-[-0.01em]'
                  : 'whitespace-nowrap text-5xl font-light leading-none tracking-[-0.03em] tabular-nums'
              "
              >{{ view.big }}<span v-if="view.unit" class="text-xl font-normal tracking-normal text-muted-foreground">{{ view.unit }}</span></span
            >
            <span
              v-if="view.qualifier"
              class="text-lg font-medium leading-6"
              :class="{ 'text-muted-foreground': !view.qualifierColor }"
              :style="{ color: view.qualifierColor }"
            >
              {{ view.qualifier }}
            </span>
          </div>
          <span class="text-[13px] leading-[18px] text-muted-foreground tabular-nums">{{ view.sub }}</span>
        </div>

        <svg
          v-if="view.compass !== undefined"
          data-compass
          viewBox="-50 -50 100 100"
          aria-hidden="true"
          class="size-24 flex-none"
        >
          <circle r="44" class="fill-popover stroke-border" stroke-width="1.5" />
          <g class="stroke-muted-foreground" stroke-width="1.5">
            <line x1="0" y1="-44" x2="0" y2="-38" />
            <line x1="44" y1="0" x2="38" y2="0" />
            <line x1="0" y1="44" x2="0" y2="38" />
            <line x1="-44" y1="0" x2="-38" y2="0" />
          </g>
          <text x="0" y="-27" text-anchor="middle" dominant-baseline="middle" class="fill-foreground text-[10px] font-semibold">N</text>
          <text x="29" y="0" text-anchor="middle" dominant-baseline="middle" class="fill-muted-foreground text-[10px]">E</text>
          <text x="0" y="29" text-anchor="middle" dominant-baseline="middle" class="fill-muted-foreground text-[10px]">S</text>
          <text x="-29" y="0" text-anchor="middle" dominant-baseline="middle" class="fill-muted-foreground text-[10px]">W</text>
          <g data-needle :transform="`rotate(${view.compass + 180})`">
            <path d="M0,-20 L8,16 L0,10 L-8,16 Z" class="fill-chart-wind" />
          </g>
        </svg>
      </div>

      <p v-if="view.advice" class="text-sm leading-5 [text-wrap:pretty]">{{ view.advice }}</p>

      <DetailScale v-if="view.scale" v-bind="view.scale" />

      <div
        v-if="view.pollutants"
        class="grid grid-cols-3 gap-x-4 gap-y-3 border-t border-border pt-4"
      >
        <div v-for="p in view.pollutants" :key="p.name" data-pollutant class="flex min-w-0 flex-col gap-0.5">
          <span class="text-xs font-medium leading-4 text-muted-foreground">{{ p.name }}</span>
          <!-- prettier-ignore -->
          <span class="whitespace-nowrap text-[15px] font-medium leading-5 tabular-nums">{{ p.value }}<span class="text-[11px] font-normal text-muted-foreground"> {{ $t('conditionDetail.airQuality.unit') }}</span></span>
        </div>
      </div>

      <DetailBarStrip v-if="view.strip" v-bind="view.strip" />
    </div>

    <div v-if="view.guide" class="-mx-2 flex flex-col gap-0.5">
      <div
        v-for="row in view.guide"
        :key="row.key"
        data-guide
        class="flex items-start gap-3 rounded-lg p-2"
        :class="{ 'bg-accent text-accent-foreground': row.current }"
      >
        <span aria-hidden="true" class="mt-[5px] size-2.5 flex-none rounded-full" :style="{ background: row.color }" />
        <!-- prettier-ignore -->
        <span class="text-sm leading-5"><span class="font-semibold tabular-nums">{{ row.range }}</span><span class="text-muted-foreground"> {{ row.advice }}</span></span>
      </div>
    </div>

    <div class="flex flex-col gap-3">
      <p
        v-for="paragraph in view.paragraphs"
        :key="paragraph"
        class="text-sm leading-[21px] text-muted-foreground [text-wrap:pretty]"
      >
        {{ paragraph }}
      </p>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { DialogDescription, DialogTitle } from 'reka-ui'
import DetailBarStrip from '@/components/weather/DetailBarStrip.vue'
import DetailScale from '@/components/weather/DetailScale.vue'
import weatherMixin from '@/mixins/weatherMixin'
import useUnitStore from '@/stores/unit'
import useWeatherStore from '@/stores/weather'
import { UV_LEVELS } from '@/constants/levelColors'
import { uvLevelOf } from '@/utils/hourDetail'
import {
  beaufortLabel,
  dewPointComfort,
  dewPointGuide,
  humidityColumns,
  rainBestChance,
  rainColumns,
  readings,
  uvColumns,
  uvPeak,
  windColumns
} from '@/utils/conditionDetail'

const T = 'conditionDetail'

export default {
  name: 'ConditionDetailContent',
  components: { DetailBarStrip, DetailScale, DialogDescription, DialogTitle },
  mixins: [weatherMixin],
  props: {
    /** humidity | wind | precip | visibility | pressure | uv | airQuality */
    detail: { type: String, required: true }
  },
  computed: {
    ...mapState(useWeatherStore, ['current', 'forecast', 'next24Hours']),
    ...mapState(useUnitStore, ['unit']),
    day() {
      return this.forecast?.[0]?.day
    },
    r() {
      return readings(this.current, this.day, this.unit)
    },
    speedUnit() {
      return this.$t(`hourly.${this.r.speedUnit}`)
    },
    view() {
      if (!this.current || !this.day) return null
      return this[`${this.detail}View`]()
    }
  },
  mounted() {
    // vaul cancels reka's open auto-focus and nothing inside is tabbable, so take the dialog
    this.$el.closest('[role="dialog"]')?.focus({ preventScroll: true })
  },
  methods: {
    unitLabel(key) {
      return this.$t(`hourly.detail.units.${key}`)
    },
    // a bar strip column's shared parts; `value` is already formatted
    column(c, value, extra = {}) {
      return {
        ...c,
        value,
        time: c.isNow ? this.$t('hourly.now') : this.formatHour(c.hour),
        ...extra
      }
    },
    humidityView() {
      const guide = dewPointGuide(this.unit)
      return {
        title: this.$t(`${T}.humidity.title`),
        kicker: this.$t(`${T}.humidity.kicker`),
        big: this.formatNumber(Math.round(this.day.avghumidity)),
        unit: '%',
        qualifier: this.$t(`${T}.humidity.comfort.${dewPointComfort(this.current.dewpoint_c)}`),
        sub: this.$t(`${T}.humidity.sub`, {
          now: this.formatNumber(this.current.humidity),
          dew: this.formatTemp(this.r.dewPoint)
        }),
        strip: {
          boxClass: 'h-20 w-[22px] overflow-hidden rounded-[11px] bg-foreground/[0.08]',
          fillClass: 'rounded-[11px] bg-chart-humidity',
          columns: humidityColumns(this.next24Hours).map((c) => this.column(c, `${this.formatNumber(c.value)}%`))
        },
        paragraphs: [
          this.$t(`${T}.humidity.para1`),
          this.$t(`${T}.humidity.para2`, {
            comfortable: this.formatTemp(guide.comfortable),
            muggy: this.formatTemp(guide.muggy)
          })
        ]
      }
    },
    windView() {
      return {
        title: this.$t(`${T}.wind.title`),
        kicker: this.$t(`${T}.wind.kicker`),
        big: this.formatNumber(this.r.speed),
        unit: ` ${this.speedUnit}`,
        qualifier: this.$t(`${T}.wind.beaufort.${beaufortLabel(this.current.wind_kph)}`),
        sub: this.$t(`${T}.wind.sub`, {
          dir: this.current.wind_dir,
          gust: this.formatNumber(this.r.gust),
          unit: this.speedUnit
        }),
        compass: this.current.wind_degree,
        strip: {
          boxClass: 'h-16 w-3.5',
          fillClass: 'rounded bg-chart-wind/75',
          columns: windColumns(this.next24Hours, this.unit).map((c) => this.column(c, this.formatNumber(c.value)))
        },
        paragraphs: [
          this.$t(`${T}.wind.para1`, { speed: this.formatNumber(this.r.maxWind), unit: this.speedUnit }),
          this.$t(`${T}.wind.para2`)
        ]
      }
    },
    precipSub() {
      const best = rainBestChance(this.next24Hours)
      if (!best.likely) return this.$t(`${T}.precip.unlikely`)
      const chance = this.formatNumber(best.chance)
      return best.isNow
        ? this.$t(`${T}.precip.bestNow`, { chance })
        : this.$t(`${T}.precip.best`, { chance, time: this.formatHour(best.hour.hour) })
    },
    precipView() {
      return {
        title: this.$t(`${T}.precip.title`),
        kicker: this.$t(`${T}.precip.kicker`),
        big: this.formatNumber(this.r.precip),
        unit: ` ${this.unitLabel(this.r.precipUnit)}`,
        sub: this.precipSub(),
        strip: {
          boxClass: 'h-14 w-4',
          fillClass: 'rounded bg-rain',
          columns: rainColumns(this.next24Hours).map((c) =>
            this.column(c, `${this.formatNumber(c.value)}%`, {
              valueClass: c.emphasis ? 'font-semibold text-rain' : 'font-medium text-muted-foreground'
            })
          )
        },
        paragraphs: [this.$t(`${T}.precip.para1`), this.$t(`${T}.precip.para2`)]
      }
    },
    uvView() {
      const peak = uvPeak(this.next24Hours, this.forecast[0].date)
      const level = uvLevelOf(this.day.uv)
      const now = this.formatNumber(Math.round(this.current.uv))
      const currentLevel = uvLevelOf(this.current.uv).key
      return {
        title: this.$t(`${T}.uv.title`),
        kicker: this.$t(`${T}.uv.kicker`),
        big: this.formatNumber(Math.round(this.day.uv)),
        qualifier: this.$t(`hourly.detail.uvLevels.${level.key}`),
        qualifierColor: level.color,
        sub: peak
          ? this.$t(`${T}.uv.nowPeak`, { now, time: this.formatHour(peak.hour.hour) })
          : this.$t(`${T}.uv.now`, { now }),
        strip: {
          boxClass: 'h-14 w-4',
          fillClass: 'rounded',
          columns: uvColumns(this.next24Hours).map((c) => this.column(c, this.formatNumber(c.value)))
        },
        guide: UV_LEVELS.map(({ key, color }) => ({
          key,
          color,
          current: key === currentLevel,
          range: this.$t(`${T}.uv.guide.${key}.range`),
          advice: this.$t(`${T}.uv.guide.${key}.advice`)
        })),
        paragraphs: [this.$t(`${T}.uv.para`)]
      }
    }
  }
}
</script>
