<template>
  <div
    class="grid gap-4"
    :class="variant === 'row' ? 'grid-cols-5 border-t pt-4' : 'grid-cols-2 sm:grid-cols-5'"
  >
    <!-- Humidity / Visibility / Pressure / UV / Air Quality.
         row:   the 5-column strip at the foot of the Current card (md+)
         tiles: the phone Details card, 2 columns (5 from sm), Air Quality spans 2 -->
    <div
      v-for="item in items"
      :key="item.key"
      :title="item.title"
      class="flex min-w-0 flex-col gap-1"
      :class="{ 'col-span-2 sm:col-span-1': variant === 'tiles' && item.key === 'airQuality' }"
    >
      <span class="truncate text-[13px] font-medium leading-4 text-muted-foreground">{{ item.label }}</span>
      <!-- prettier-ignore -->
      <span
        class="truncate leading-6 tabular-nums"
        :class="[
          variant === 'row' ? 'text-[17px]' : 'text-xl',
          item.dim ? 'font-normal text-muted-foreground' : 'font-medium'
        ]"
      >{{ item.value }} <span v-if="item.unit" class="text-[13px] font-normal text-muted-foreground">{{ item.unit }}</span></span>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import useWeatherStore from '@/stores/weather'
import weatherMixin from '@/mixins/weatherMixin'

export default {
  name: 'WeatherDetails',
  mixins: [weatherMixin],
  props: {
    variant: { type: String, default: 'row', validator: (v) => ['row', 'tiles'].includes(v) }
  },
  computed: {
    ...mapState(useWeatherStore, ['basicWeatherInfo']),
    items() {
      const info = this.basicWeatherInfo || {}
      const level = (group, key) => (key && key !== 'unknown' ? this.$t(`${group}.${key}`) : null)
      const uv = level('uvLevels', info.uv)
      const airQuality = level('airQualityLevels', info.airQuality)
      const number = (v) => (v === undefined || v === null ? '—' : this.formatNumber(v))
      return [
        { key: 'humidity', label: this.$t('weather.humidity'), value: `${number(info.humidity)}%` },
        { key: 'visibility', label: this.$t('weather.visibility'), value: number(info.visibility), unit: this.$t('weather.km') },
        { key: 'pressure', label: this.$t('weather.pressure'), value: number(info.pressure), unit: this.$t('weather.hPa') },
        {
          key: 'uv',
          label: this.$t('weather.uv'),
          value: uv ?? '—',
          dim: !uv,
          title: uv ? this.$t('weather.uv') : this.$t('weather.uvUnavailable')
        },
        {
          key: 'airQuality',
          label: this.$t('weather.airQuality'),
          value: airQuality ?? '—',
          dim: !airQuality
        }
      ].map((item) => ({ title: item.label, ...item }))
    }
  }
}
</script>
