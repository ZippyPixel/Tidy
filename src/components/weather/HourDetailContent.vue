<template>
  <div class="flex flex-col gap-5">
    <div class="flex items-center justify-between gap-4">
      <div class="flex min-w-0 flex-col gap-1.5">
        <DialogTitle as="div" class="whitespace-nowrap text-[13px] font-semibold leading-4 text-primary">
          {{ when }}
        </DialogTitle>
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <div class="-ml-[0.04em] text-[56px] font-light leading-none tracking-[-0.035em] tabular-nums">
            {{ degrees(detail.temp) }}
          </div>
          <div class="whitespace-nowrap text-[15px] leading-5 text-muted-foreground tabular-nums">
            {{ $t('hourly.detail.feelsLike', { temp: degrees(detail.feels) }) }}
          </div>
        </div>
        <DialogDescription as="div" class="text-[17px] font-medium leading-6">{{ detail.condition }}</DialogDescription>
      </div>
      <div aria-hidden="true" class="flex size-20 flex-none items-center justify-center">
        <img v-if="hour.code" class="size-20 object-contain" :src="icon" alt="" />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 md:grid-cols-3">
      <div
        v-for="tile in tiles"
        :key="tile.key"
        data-tile
        class="flex min-w-0 flex-col gap-1 rounded-lg bg-surface-raised px-3.5 py-3"
      >
        <span class="whitespace-nowrap text-xs font-medium leading-4 text-muted-foreground">{{ tile.label }}</span>
        <span class="flex min-w-0 items-center gap-1.5">
          <svg
            v-if="tile.key === 'wind'"
            viewBox="0 0 24 24"
            aria-hidden="true"
            class="size-3.5 flex-none text-chart-wind"
            :style="{ transform: `rotate(${detail.wind.degree + 180}deg)` }"
          >
            <path d="M12 3 L19 21 L12 16.5 L5 21 Z" fill="currentColor" />
          </svg>
          <span class="whitespace-nowrap text-xl font-medium leading-6 tabular-nums" :class="tile.tone"
            >{{ tile.value }}<span class="text-[13px] font-normal text-muted-foreground">{{ tile.unit }}</span></span
          >
        </span>
        <!-- an empty sub-line keeps the tile rows level -->
        <span class="truncate text-xs leading-4 text-muted-foreground">{{ tile.sub || '&nbsp;' }}</span>
      </div>
    </div>

    <div class="flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-[13px] leading-5 text-muted-foreground tabular-nums">
      <span>{{ $t('hourly.detail.cloudCover', { value: number(detail.cloud) }) }}</span>
      <span v-if="detail.heatIndex !== null">
        {{ $t('hourly.detail.heatIndex', { temp: degrees(detail.heatIndex) }) }}
      </span>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { DialogDescription, DialogTitle } from 'reka-ui'
import weatherMixin from '@/mixins/weatherMixin'
import useUnitStore from '@/stores/unit'
import { getWeatherIcon } from '@/constants/weatherIcons'
import { hourDetail } from '@/utils/hourDetail'

const MISSING = '—'

export default {
  name: 'HourDetailContent',
  components: { DialogDescription, DialogTitle },
  mixins: [weatherMixin],
  props: {
    /** normalizeHour() output */
    hour: { type: Object, required: true },
    previous: { type: Object, default: null },
    /** "Today · 3 PM" */
    when: { type: String, required: true }
  },
  computed: {
    ...mapState(useUnitStore, ['unit']),
    detail() {
      return hourDetail(this.hour, this.previous, this.unit)
    },
    icon() {
      return getWeatherIcon(this.hour.code, this.hour.isDay)
    },
    tiles() {
      const { rain, wind, humidity, uv, visibility, pressure } = this.detail
      const unit = (key) => ` ${this.$t(`hourly.detail.units.${key}`)}`
      return [
        {
          key: 'rain',
          label: this.$t('weather.chanceOfRain'),
          value: this.number(rain.value),
          unit: '%',
          tone: rain.emphasis ? 'text-rain' : '',
          sub:
            rain.amount === null
              ? this.$t('hourly.detail.noRain')
              : this.$t('hourly.detail.expected', {
                  amount: `${this.formatNumber(rain.amount)}${unit(rain.amountUnit)}`
                })
        },
        {
          key: 'wind',
          label: this.$t('hourly.metrics.wind'),
          value: this.number(wind.value),
          unit: ` ${this.$t(`hourly.${wind.unit}`)}`,
          sub: [
            this.$t('hourly.detail.windFrom', { dir: wind.from }),
            this.$t('hourly.detail.gusts', { gust: this.number(wind.gust) })
          ].join(' · ')
        },
        {
          key: 'humidity',
          label: this.$t('weather.humidity'),
          value: this.number(humidity.value),
          unit: '%',
          sub: this.$t('hourly.detail.dewPoint', { temp: this.degrees(humidity.dewPoint) })
        },
        {
          key: 'uv',
          label: this.$t('hourly.detail.uvIndex'),
          value: this.number(uv.value),
          tone: uv.emphasis ? 'text-sun-arc' : '',
          sub: this.$t(`hourly.detail.uvLevels.${uv.level}`)
        },
        {
          key: 'visibility',
          label: this.$t('weather.visibility'),
          value: this.number(visibility.value),
          unit: unit(visibility.unit),
          sub: this.$t(`hourly.detail.visibilityLevels.${visibility.level}`)
        },
        {
          key: 'pressure',
          label: this.$t('weather.pressure'),
          // inHg only means something with its decimals
          value: pressure.unit === 'inHg' ? this.exact(pressure.value) : this.number(pressure.value),
          unit: unit(pressure.unit),
          sub: pressure.trend ? this.$t(`hourly.detail.trends.${pressure.trend}`) : ''
        }
      ]
    }
  },
  mounted() {
    // vaul cancels reka's open auto-focus, so the sheet would otherwise leave focus
    // on the card behind it; there is nothing tabbable inside, so take the dialog itself
    this.$el.closest('[role="dialog"]')?.focus({ preventScroll: true })
  },
  methods: {
    number(value) {
      return typeof value === 'number' ? this.formatNumber(Math.round(value)) : MISSING
    },
    exact(value) {
      return typeof value === 'number' ? this.formatNumber(value) : MISSING
    },
    degrees(value) {
      return typeof value === 'number' ? this.formatTemp(value) : MISSING
    }
  }
}
</script>
