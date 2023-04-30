<template>
  <!-- hourly data -->
  <div class="w-full h-[21rem] bg-white p-3 rounded-3xl mt-7">
    <div>
      <p class="font-semibold text-gray-600">Daily Summary</p>
    </div>
    <div class="w-full h-[17rem] mt-5">
      <LineChart id="line-chart" :options="chartOptions" :data="chartData" />
    </div>
  </div>
</template>

<script>
import { Line as LineChart } from 'vue-chartjs'
import 'chart.js/auto'

export default {
  name: 'DailyChart',
  components: { LineChart },
  data() {
    return {
      chartData: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
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
            data: [40, 39, 10, 40, 39, 80, 40]
          }
        ]
      },
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
            max: 100,
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
  }
}
</script>
