<template>
  <!-- <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header> -->
  <!-- <RouterView /> -->
  <!-- header -->
  <div
    class="w-full h-20 fixed top-0 bg-white/70 backdrop-blur-lg z-10 flex flex-row justify-around items-center drop-shadow-lg"
  >
    <!-- title -->
    <div>
      <p class="font-semibold text-4xl text-slate-800 tracking-[0.5em]">TIDY</p>
    </div>

    <!-- search -->
    <div class="w-1/4 flex flex-row items-center">
      <div class="w-full bg-gray-200 p-2 rounded-lg">
        <form action="" class="content-start flex items-stretch">
          <input
            type="text"
            class="bg-inherit w-full focus:outline-none text-xl pl-2"
            placeholder="Search City"
          />
          <button type="submit"><img src="./assets/icons/arrow-right.svg" alt="" /></button>
        </form>
      </div>
      <button>
        <img src="./assets/icons/gps-location.svg" alt="" class="p-2" />
      </button>
    </div>

    <!-- unit select -->
    <div>
      <select name="unit" id="unit" class="p-2 rounded-md">
        <option value="celsius">Celsius</option>
        <option value="fahrenheit">Fahrenheit</option>
      </select>
    </div>
  </div>
  <div class="mt-20 pb-10"></div>
  <!-- home -->
  <div class="w-[92rem] h-max mx-auto flex flex-row items-baseline justify-between">
    <!-- weather-info -->
    <div class="w-[65rem] h-auto flex flex-col items-end justify-between">
      <div class="w-full flex flex-row items-end justify-between">
        <!-- basic-info -->
        <div class="flex-column w-[40rem]">
          <!-- location-time -->
          <div class="w-full flex flex-row justify-between items-end">
            <div class="w-fit">
              <p class="text-gray-500">Current Location</p>
              <p class="text-slate-800 font-medium text-2xl">Dhaka, Bangladesh</p>
            </div>
            <div class="w-fit">
              <p class="text-gray-500">Thursday, Apr 20</p>
            </div>
          </div>
          <!-- info -->
          <div
            class="w-full h-80 mt-3 drop-shadow-xl bg-white rounded-3xl flex flex-col justify-around relative"
          >
            <!-- chance of rain -->
            <div
              class="w-24 absolute top-2.5 right-2.5 py-1 px-3 bg-gray-50 drop-shadow-sm rounded-3xl"
            >
              <img class="float-left" src="./assets/icons/mdi_weather-heavy-rain.svg" alt="" />
              <p class="float-right">100%</p>
            </div>
            <div class="w-[90%] h-full mx-auto flex flex-col justify-around">
              <!-- top -->
              <div class="flex flex-row items-center justify-between">
                <div class="flex flex-col">
                  <div class="flex flex-row items-center mr-5">
                    <div class="pr-5 flex flex-col">
                      <p class="text-8xl font-black">27°</p>
                      <div class="flex flex-row justify-between">
                        <div class="flex flex-row">
                          <img src="./assets/icons/mdi_arrow-up.svg" alt="" />
                          <p>35°C</p>
                        </div>
                        <div class="flex flex-row">
                          <img src="./assets/icons/mdi_arrow-down.svg" alt="" />
                          <p>26°C</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p class="mb-2 font-normal text-2xl">Haze</p>
                      <p>Feels like 29°</p>
                    </div>
                  </div>
                </div>
                <div>
                  <img class="w-[80%] float-right" src="./assets/icons/weather-icon.svg" alt="" />
                </div>
              </div>
              <!-- bottom -->
              <div class="flex flex-row justify-between">
                <div class="flex flex-col">
                  <p class="text-xs font-regular text-gray-500">Humidity</p>
                  <p class="text-md font-regular text-black">68%</p>
                </div>
                <div class="flex flex-col">
                  <p class="text-xs font-regular text-gray-500">Visibility</p>
                  <p class="text-md font-regular text-black">3.54 km</p>
                </div>
                <div class="flex flex-col">
                  <p class="text-xs font-regular text-gray-500">Pressure</p>
                  <p class="text-md font-regular text-black">1010 hPa</p>
                </div>
                <div class="flex flex-col">
                  <p class="text-xs font-regular text-gray-500">UV</p>
                  <p class="text-md font-regular text-black">Lowest</p>
                </div>
                <div class="flex flex-col">
                  <p class="text-xs font-regular text-gray-500">Air Quality</p>
                  <p class="text-md font-regular text-black">Poor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- planetary info -->
        <div class="bg-white w-[23rem] h-80 rounded-3xl p-3">
          <div class="w-[22rem] h-full mx-auto flex flex-col justify-between">
            <!-- sunrise & sunset -->
            <div class="">
              <p class="text-gray-500">Sunrise & Sunset</p>
              <div class="w-full flex flex-row justify-around my-3">
                <!-- sunrise -->
                <div class="flex flex-col items-center">
                  <img class="w-[3rem] mb-1" src="./assets/icons/sunrise.png" alt="" />
                  <p class="text-lg font-regular">5:29 AM</p>
                </div>
                <!-- sunset -->
                <div class="flex flex-col items-center">
                  <img class="w-[3rem] mb-1" src="./assets/icons/sunset.png" alt="" />
                  <p class="text-lg font-regular">6:23 PM</p>
                </div>
              </div>
            </div>
            <!-- moonrise & moonset -->
            <div class="">
              <p class="text-gray-500">Moonrise & Moonset</p>
              <div class="w-full flex flex-row justify-around my-3">
                <!-- moonrise -->
                <div class="flex flex-col items-center">
                  <img class="w-[3rem]" src="./assets/icons/moonrise.png" alt="" />
                  <p class="text-lg font-regular">5:29 AM</p>
                </div>
                <!-- moonset -->
                <div class="flex flex-col items-center">
                  <img class="w-[3rem]" src="./assets/icons/moonset.png" alt="" />
                  <p class="text-lg font-regular">6:23 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- hourly data -->
      <div class="w-full h-[21rem] bg-white p-3 rounded-3xl mt-7">
        <div>
          <p class="font-semibold text-gray-600">Daily Summary</p>
        </div>
        <div class="w-full h-[17rem] mt-5">
          <LineChart id="line-chart" :options="chartOptions" :data="chartData" />
        </div>
      </div>
    </div>

    <!-- forecast -->
    <div class="w-[25rem] h-[47rem] flex flex-col justify-stretch">
      <div class="w-full flex flex-row justify-between items-end invisible">
        <div class="w-fit">
          <p class="text-gray-500">C</p>
          <p class="text-slate-800 font-medium text-2xl">D</p>
        </div>
        <div class="w-fit">
          <p class="text-gray-500">T</p>
        </div>
      </div>
      <div class="w-full h-full mt-3 bg-gray-200 rounded-3xl p-3">
        <div>
          <p class="font-semibold text-gray-600">7 Days Forecast</p>
          <!-- days list -->
          <div class="mt-5 max-h-[37rem] overflow-y-auto scrollbar-hide">
            <!-- day -->
            <div
              class="border border-gray-300 p-3 rounded-3xl my-3 hover:bg-white hover:border-white transition-colors duration-700"
            >
              <div class="flex flex-row justify-between items-end">
                <p class="text-center font-medium">Wednesday</p>
                <p class="font-thin text-sm">April 26th</p>
              </div>
              <div class="flex flex-row items-center justify-between">
                <div>
                  <img class="w-[80px]" src="./assets/icons/weather-icon.svg" alt="" />
                </div>
                <div class="w-16 flex flex-row justify-between items-end">
                  <div class="text-xl font-semibold">37°</div>
                  <div class="text-gray-500">26°</div>
                </div>
                <div class="w-24 py-1 px-3 bg-gray-50 drop-shadow-sm rounded-3xl">
                  <img class="float-left" src="./assets/icons/mdi_weather-heavy-rain.svg" alt="" />
                  <p class="float-right">100%</p>
                </div>
              </div>
            </div>
            <div
              class="border border-gray-300 p-3 rounded-3xl my-3 hover:bg-white hover:border-white transition-colors duration-700"
            >
              <div class="flex flex-row justify-between items-end">
                <p class="text-center font-medium">Wednesday</p>
                <p class="font-thin text-sm">April 26th</p>
              </div>
              <div class="flex flex-row items-center justify-between">
                <div>
                  <img class="w-[80px]" src="./assets/icons/weather-icon.svg" alt="" />
                </div>
                <div class="w-16 flex flex-row justify-between items-end">
                  <div class="text-xl font-semibold">37°</div>
                  <div class="text-gray-500">26°</div>
                </div>
                <div class="w-24 py-1 px-3 bg-gray-50 drop-shadow-sm rounded-3xl">
                  <img class="float-left" src="./assets/icons/mdi_weather-heavy-rain.svg" alt="" />
                  <p class="float-right">100%</p>
                </div>
              </div>
            </div>
            <div
              class="border border-gray-300 p-3 rounded-3xl my-3 hover:bg-white hover:border-white transition-colors duration-700"
            >
              <div class="flex flex-row justify-between items-end">
                <p class="text-center font-medium">Wednesday</p>
                <p class="font-thin text-sm">April 26th</p>
              </div>
              <div class="flex flex-row items-center justify-between">
                <div>
                  <img class="w-[80px]" src="./assets/icons/weather-icon.svg" alt="" />
                </div>
                <div class="w-16 flex flex-row justify-between items-end">
                  <div class="text-xl font-semibold">37°</div>
                  <div class="text-gray-500">26°</div>
                </div>
                <div class="w-24 py-1 px-3 bg-gray-50 drop-shadow-sm rounded-3xl">
                  <img class="float-left" src="./assets/icons/mdi_weather-heavy-rain.svg" alt="" />
                  <p class="float-right">100%</p>
                </div>
              </div>
            </div>
            <div
              class="border border-gray-300 p-3 rounded-3xl my-3 hover:bg-white hover:border-white transition-colors duration-700"
            >
              <div class="flex flex-row justify-between items-end">
                <p class="text-center font-medium">Wednesday</p>
                <p class="font-thin text-sm">April 26th</p>
              </div>
              <div class="flex flex-row items-center justify-between">
                <div>
                  <img class="w-[80px]" src="./assets/icons/weather-icon.svg" alt="" />
                </div>
                <div class="w-16 flex flex-row justify-between items-end">
                  <div class="text-xl font-semibold">37°</div>
                  <div class="text-gray-500">26°</div>
                </div>
                <div class="w-24 py-1 px-3 bg-gray-50 drop-shadow-sm rounded-3xl">
                  <img class="float-left" src="./assets/icons/mdi_weather-heavy-rain.svg" alt="" />
                  <p class="float-right">100%</p>
                </div>
              </div>
            </div>
            <div
              class="border border-gray-300 p-3 rounded-3xl my-3 hover:bg-white hover:border-white transition-colors duration-700"
            >
              <div class="flex flex-row justify-between items-end">
                <p class="text-center font-medium">Wednesday</p>
                <p class="font-thin text-sm">April 26th</p>
              </div>
              <div class="flex flex-row items-center justify-between">
                <div>
                  <img class="w-[80px]" src="./assets/icons/weather-icon.svg" alt="" />
                </div>
                <div class="w-16 flex flex-row justify-between items-end">
                  <div class="text-xl font-semibold">37°</div>
                  <div class="text-gray-500">26°</div>
                </div>
                <div class="w-24 py-1 px-3 bg-gray-50 drop-shadow-sm rounded-3xl">
                  <img class="float-left" src="./assets/icons/mdi_weather-heavy-rain.svg" alt="" />
                  <p class="float-right">100%</p>
                </div>
              </div>
            </div>
            <div
              class="border border-gray-300 p-3 rounded-3xl my-3 hover:bg-white hover:border-white transition-colors duration-700"
            >
              <div class="flex flex-row justify-between items-end">
                <p class="text-center font-medium">Wednesday</p>
                <p class="font-thin text-sm">April 26th</p>
              </div>
              <div class="flex flex-row items-center justify-between">
                <div>
                  <img class="w-[80px]" src="./assets/icons/weather-icon.svg" alt="" />
                </div>
                <div class="w-16 flex flex-row justify-between items-end">
                  <div class="text-xl font-semibold">37°</div>
                  <div class="text-gray-500">26°</div>
                </div>
                <div class="w-24 py-1 px-3 bg-gray-50 drop-shadow-sm rounded-3xl">
                  <img class="float-left" src="./assets/icons/mdi_weather-heavy-rain.svg" alt="" />
                  <p class="float-right">100%</p>
                </div>
              </div>
            </div>
            <div
              class="border border-gray-300 p-3 rounded-3xl my-3 hover:bg-white hover:border-white transition-colors duration-700"
            >
              <div class="flex flex-row justify-between items-end">
                <p class="text-center font-medium">Wednesday</p>
                <p class="font-thin text-sm">April 26th</p>
              </div>
              <div class="flex flex-row items-center justify-between">
                <div>
                  <img class="w-[80px]" src="./assets/icons/weather-icon.svg" alt="" />
                </div>
                <div class="w-16 flex flex-row justify-between items-end">
                  <div class="text-xl font-semibold">37°</div>
                  <div class="text-gray-500">26°</div>
                </div>
                <div class="w-24 py-1 px-3 bg-gray-50 drop-shadow-sm rounded-3xl">
                  <img class="float-left" src="./assets/icons/mdi_weather-heavy-rain.svg" alt="" />
                  <p class="float-right">100%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Line as LineChart } from 'vue-chartjs'
import 'chart.js/auto'

export default {
  name: 'App',
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
