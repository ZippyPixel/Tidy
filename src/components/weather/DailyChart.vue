<template>
  <!-- hourly data -->
  <div class="w-full h-auto bg-white dark:bg-night-surface p-4 rounded-3xl mt-6 overflow-hidden" v-if="isDataAvailable">
    <div>
      <p class="font-semibold text-gray-600 dark:text-night-muted">{{ $t('chart.dailySummary') }}</p>
    </div>
    <div class="w-full mt-5">
      <AreaChart
        class="h-64 md:h-[17rem]"
        index="hour"
        :data="chartData"
        :categories="['temperature']"
        :show-legend="false"
        :show-grid-line="false"
        :y-formatter="formatTemperature"
      />
    </div>
  </div>
  <div v-else>
    {{ $t('chart.noData') }}
  </div>
</template>

<script>
import { mapState } from 'pinia'
import useWeatherStore from '@/stores/weather'
import useUnitStore from '@/stores/unit'
import weatherMixin from '@/mixins/weatherMixin'
import { AreaChart } from '@/components/ui/chart-area'

export default {
  name: 'DailyChart',
  components: { AreaChart },
  mixins: [weatherMixin],
  computed: {
    chartData() {
      if (!this.date || !this.dailySummary[this.date]) return []
      const day = this.dailySummary[this.date]
      const tempKey = this.unit === 'celsius' ? 'tempDataC' : 'tempDataF'
      return day.hours.map((hour, i) => ({
        hour,
        temperature: day[tempKey][i]
      }))
    },
    isDataAvailable() {
      return !!this.dailySummary
    },
    ...mapState(useWeatherStore, ['dailySummary', 'date']),
    ...mapState(useUnitStore, ['unit'])
  },
  methods: {
    formatTemperature(value) {
      return `${this.formatNumber(value)}°${this.unit === 'celsius' ? 'C' : 'F'}`
    }
  }
}
</script>
