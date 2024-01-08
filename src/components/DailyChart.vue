<template>
  <!-- hourly data -->
  <div class="w-full h-[21rem] bg-white p-3 rounded-3xl mt-7" v-if="isDataAvailable">
    <div>
      <p class="font-semibold text-gray-600">Daily Summary</p>
    </div>
    <div class="w-full h-[17rem] mt-5">
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
import useWeatherStore from '../stores/weather'

export default {
  name: 'DailyChart',
  components: { LineChart },
  data() {
    return {
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            min: 0,
            max: 60,
            grid: {
              display: false
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    }
  },
  computed: {
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
      return this.date && this.dailySummary[this.date] 
      ? {
        labels: this.dailySummary[this.date].hours,
        data: this.dailySummary[this.date].tempDataC,
      }
      : {
        labels: [],
        data: [],
      };
    },
    isDataAvailable() {
      return !!this.dailySummary
    },
    ...mapState(useWeatherStore, ['dailySummary', 'date']),
  },
}
</script>
