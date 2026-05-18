<template>
  <!-- hourly data -->
  <div class="w-full h-auto bg-white dark:bg-night-surface p-4 rounded-3xl mt-7 overflow-hidden" v-if="isDataAvailable">
    <div>
      <p class="font-semibold text-gray-600 dark:text-night-muted">Daily Summary</p>
    </div>
    <div class="w-full h-64 md:h-[17rem] mt-5">
      <LineChart id="line-chart" :options="chartOptions" :data="chartDataComputed" />
    </div>
  </div>
  <div v-else>
    No Data
  </div>
</template>

<script>
import { Line as LineChart } from 'vue-chartjs'
import 'chart.js/auto'
import { mapState } from 'pinia'
import useWeatherStore from '@/stores/weather'
import useUnitStore from '@/stores/unit'

export default {
  name: 'DailyChart',
  components: { LineChart },
  computed: {
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            min: this.unit === 'celsius' ? 0 : 32,
            max: this.unit === 'celsius' ? 60 : 140,
            grid: { display: false }
          },
          x: { grid: { display: false } }
        }
      }
    },
    chartDataComputed(){
      return {
        labels: this.getChartData.labels,
        datasets: [
          {
            label: '',
            borderWidth: 4,
            borderColor: function (context) {
              const chart = context.chart
              const { ctx, chartArea } = chart

              if (!chartArea) {
                // This case happens on initial chart load
                return
              }
              let width, height, gradient

              const chartWidth = chartArea.right - chartArea.left
              const chartHeight = chartArea.bottom - chartArea.top
              if (!gradient || width !== chartWidth || height !== chartHeight) {
                // Create the gradient because this is either the first render
                // or the size of the chart has changed
                width = chartWidth
                height = chartHeight
                gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
                gradient.addColorStop(0, '#00d4ff')
                gradient.addColorStop(0.5, '#ffda00')
                gradient.addColorStop(1, '#ff0000')
              }

              return gradient
            },
            backgroundColor: 'rgba(0,0,0,0.05)',
            fill: true,
            data: this.getChartData.data,
          }
        ]
      }
    },
    getChartData() {
      if (!this.date || !this.dailySummary[this.date]) return { labels: [], data: [] }
      const tempKey = this.unit === 'celsius' ? 'tempDataC' : 'tempDataF'
      return {
        labels: this.dailySummary[this.date].hours,
        data: this.dailySummary[this.date][tempKey],
      }
    },
    isDataAvailable() {
      return !!this.dailySummary
    },
    ...mapState(useWeatherStore, ['dailySummary', 'date']),
    ...mapState(useUnitStore, ['unit']),
  },
}
</script> 