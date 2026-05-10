<template>
  <!-- forecast -->
  <div class="w-[25rem] h-[47rem] flex flex-col justify-stretch">
    <div class="w-full flex flex-row justify-between items-end invisible">
      <div class="w-fit">
        <p class="text-gray-500 dark:text-night-muted">C</p>
        <p class="text-slate-800 dark:text-night-text font-medium text-2xl">D</p>
      </div>
      <div class="w-fit">
        <p class="text-gray-500 dark:text-night-muted">T</p>
      </div>
    </div>
    <div class="w-full h-full mt-3 bg-gray-200 dark:bg-night-surface rounded-3xl p-3">
      <div>
        <p class="font-semibold text-gray-600 dark:text-night-muted">{{forecastDayCount}}</p>
        <!-- days list -->
        <div class="mt-5 max-h-[37rem] overflow-y-auto scrollbar-hide">
          <!-- day -->
          <div
            class="border border-gray-300 dark:border-night-muted/30 p-3 rounded-3xl my-3 hover:bg-white dark:hover:bg-night-bg hover:border-white dark:hover:border-night-bg transition-colors duration-700 cursor-pointer"
            :class="{ 'bg-white border-white dark:bg-night-bg dark:border-night-bg': day.date === selectedForecastDate?.date }"
            v-for="day in forecast"
            :key="day.date"
            @click.prevent="selectForecastDate(day)"
            >
            <div class="flex flex-row justify-between items-end">
              <p class="text-center font-medium dark:text-night-text">{{ getDay(day) }}</p>
              <p class="font-thin text-sm dark:text-night-muted">{{ getDate(day) }}</p>
            </div>
            <div class="flex flex-row items-center justify-between">
              <div>
                <img class="w-[80px]" src="@/assets/icons/weather-icon.svg" alt="" />
              </div>
              <div class="w-16 flex flex-row justify-between items-end">
                <div class="text-xl font-semibold dark:text-night-text">{{ getMaxTemp(day) }}</div>
                <div class="text-gray-500 dark:text-night-muted">{{ getMinTemp(day) }}</div>
              </div>
              <div class="w-24 py-1 px-3 bg-gray-50 dark:bg-night-bg drop-shadow-sm rounded-3xl">
                <img class="float-left" src="@/assets/icons/mdi_weather-heavy-rain.svg" alt="" />
                <p class="float-right">{{ getChanceOfRain(day) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import useWeatherStore from '@/stores/weather'
import weatherMixin from '@/mixins/weatherMixin'

export default {
  name: 'WeatherForecast',
  mixins: [weatherMixin],
  computed: {
    forecastDayCount() {
      const days = this.forecast?.length || 0;
      return `${days} ${days > 1 ? 'Days' : 'Day'} Forecast`;
    },
    ...mapState(useWeatherStore, ['forecast', 'selectedForecastDate'])
  },
  methods: {
    getDay(dayInfo) {
      return this.getDayName(dayInfo.date);
    },
    getDate(dayInfo) {
      return this.getShortDate(dayInfo.date);
    },
    getMaxTemp(dayInfo) {
      return this.formatTemp(dayInfo.day.maxtemp_c);
    },
    getMinTemp(dayInfo) {
      return this.formatTemp(dayInfo.day.mintemp_c);
    },
    getChanceOfRain(dayInfo) {
      return this.formatRainChance(dayInfo.day.daily_chance_of_rain);
    },
    ...mapActions(useWeatherStore, ['setSelectedForecastDate']),
    selectForecastDate(day) {
      this.setSelectedForecastDate(day);
    },
  },
}
</script> 