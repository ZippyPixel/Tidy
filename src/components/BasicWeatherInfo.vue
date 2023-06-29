<template>
  <div class="flex-column w-[40rem]">
    <!-- location-time -->
    <div class="w-full flex flex-row justify-between items-end">
      <div class="w-fit">
        <p class="text-gray-500">Current Location</p>
        <p class="text-slate-800 font-medium text-2xl">{{ location }}</p>
      </div>
      <div class="w-fit">
        <p class="text-gray-500">{{day}}</p>
      </div>
    </div>
    <!-- info -->
    <div
      class="w-full h-80 mt-3 drop-shadow-xl bg-white rounded-3xl flex flex-col justify-around relative"
    >
      <!-- chance of rain -->
      <div class="w-24 absolute top-2.5 right-2.5 py-1 px-3 bg-gray-50 drop-shadow-sm rounded-3xl">
        <img class="float-left" src="../assets/icons/mdi_weather-heavy-rain.svg" alt="" />
        <p class="float-right">{{ chanceOfRain }}%</p>
      </div>
      <div class="w-[90%] h-full mx-auto flex flex-col justify-around">
        <!-- top -->
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="flex flex-row items-center mr-5">
              <div class="pr-5 flex flex-col">
                <p class="text-8xl font-black">{{temperature.avgTemp}}°</p>
                <div class="flex flex-row justify-between">
                  <div class="flex flex-row">
                    <img src="../assets/icons/mdi_arrow-up.svg" alt="" />
                    <p>{{ temperature.maxTemp }}°C</p>
                  </div>
                  <div class="flex flex-row">
                    <img src="../assets/icons/mdi_arrow-down.svg" alt="" />
                    <p>{{ temperature.minTemp }}°C</p>
                  </div>
                </div>
              </div>
              <div>
                <p class="mb-2 font-normal text-2xl">{{ condition }}</p>
                <p>Feels like {{ temperature.feelsLike }}°</p>
              </div>
            </div>
          </div>
          <div>
            <img class="w-[80%] float-right" src="../assets/icons/weather-icon.svg" alt="" />
          </div>
        </div>
        <!-- bottom -->
        <div class="flex flex-row justify-between">
          <div class="flex flex-col">
            <p class="text-xs font-regular text-gray-500">Humidity</p>
            <p class="text-md font-regular text-black">{{ basicWeatherInfo.humidity }}%</p>
          </div>
          <div class="flex flex-col">
            <p class="text-xs font-regular text-gray-500">Visibility</p>
            <p class="text-md font-regular text-black">{{ basicWeatherInfo.visibility }} km</p>
          </div>
          <div class="flex flex-col">
            <p class="text-xs font-regular text-gray-500">Pressure</p>
            <p class="text-md font-regular text-black">{{ basicWeatherInfo.pressure }} hPa</p>
          </div>
          <div class="flex flex-col">
            <p class="text-xs font-regular text-gray-500">UV</p>
            <p class="text-md font-regular text-black">{{ basicWeatherInfo.uv }}</p>
          </div>
          <div class="flex flex-col">
            <p class="text-xs font-regular text-gray-500">Air Quality</p>
            <p class="text-md font-regular text-black">{{ basicWeatherInfo.airQuality }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import useWeatherStore from '../stores/weather'

export default {
  name: 'BasicWeatherInfo',
  computed: {
    ...mapState(useWeatherStore, ['location', 'day',  'chanceOfRain', 'condition', 'basicWeatherInfo', 'temperature'])
  },
}
</script>
