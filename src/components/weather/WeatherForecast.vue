<template>
  <!-- forecast -->
  <div class="w-full lg:w-96 h-auto lg:h-[47rem] flex flex-col justify-stretch">
    <div class="w-full flex flex-row justify-between items-end invisible h-0 lg:h-auto">
      <div class="w-fit">
        <p class="text-gray-500 dark:text-night-muted">C</p>
        <p class="text-slate-800 dark:text-night-text font-medium text-2xl">D</p>
      </div>
      <div class="w-fit">
        <p class="text-gray-500 dark:text-night-muted">T</p>
      </div>
    </div>
    <div class="w-full h-full mt-2 bg-gray-200 dark:bg-night-surface rounded-3xl p-4 md:p-6">
      <div class="h-full flex flex-col">
        <p class="font-semibold text-gray-600 dark:text-night-muted mb-4">{{ forecastDayCount }}</p>
        <!-- days list -->
        <div class="flex-1 overflow-y-auto scrollbar-hide space-y-3 max-h-80 md:max-h-[26rem] lg:max-h-none">
          <!-- day -->
          <div
            class="border border-gray-300 dark:border-night-muted/30 p-3 md:p-4 rounded-3xl hover:bg-white dark:hover:bg-night-bg hover:border-white dark:hover:border-night-bg transition-colors duration-700 cursor-pointer"
            :class="{
              'bg-white border-white dark:bg-night-bg dark:border-night-bg':
                day.date === selectedForecastDate?.date
            }"
            v-for="day in forecast"
            :key="day.date"
            @click.prevent="selectForecastDate(day)"
          >
            <div class="flex flex-row justify-between items-center mb-2">
              <p class="font-medium dark:text-night-text">{{ getDay(day) }}</p>
              <p class="font-thin text-xs md:text-sm dark:text-night-muted">{{ getDate(day) }}</p>
            </div>
            <div class="flex flex-row items-center justify-between">
              <div>
                <img class="w-12 md:w-16" :src="getIcon(day)" :alt="day.day.condition.text" />
              </div>
              <div class="flex flex-row items-baseline gap-2">
                <span class="text-lg md:text-xl font-semibold dark:text-night-text">{{ getMaxTemp(day) }}</span>
                <span class="text-sm text-gray-500 dark:text-night-muted">{{ getMinTemp(day) }}</span>
              </div>
              <div
                class="flex flex-row items-center gap-2 py-1 px-3 bg-gray-50 dark:bg-night-bg drop-shadow-sm rounded-full"
              >
                <AppIcon name="cloud-rain" :size="16" class="text-blue-500 dark:text-night-muted" />
                <p class="text-xs md:text-sm">{{ getChanceOfRain(day) }}</p>
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
import useUnitStore from '@/stores/unit'
import weatherMixin from '@/mixins/weatherMixin'
import AppIcon from '@/components/common/AppIcon.vue'
import { getWeatherIcon } from '@/constants/weatherIcons'

export default {
  name: 'WeatherForecast',
  components: {
    AppIcon
  },
  mixins: [weatherMixin],
  computed: {
    forecastDayCount() {
      const days = this.forecast?.length || 0
      return this.$t('forecast.dayCount', { count: this.formatNumber(days) }, days)
    },
    ...mapState(useWeatherStore, ['forecast', 'selectedForecastDate']),
    ...mapState(useUnitStore, ['unit'])
  },
  methods: {
    getDay(dayInfo) {
      return this.getDayName(dayInfo.date)
    },
    getDate(dayInfo) {
      return this.getShortDate(dayInfo.date)
    },
    getMaxTemp(dayInfo) {
      return this.unit === 'celsius'
        ? this.formatTemp(dayInfo.day.maxtemp_c)
        : this.formatTemp(dayInfo.day.maxtemp_f)
    },
    getMinTemp(dayInfo) {
      return this.unit === 'celsius'
        ? this.formatTemp(dayInfo.day.mintemp_c)
        : this.formatTemp(dayInfo.day.mintemp_f)
    },
    getChanceOfRain(dayInfo) {
      return this.formatRainChance(dayInfo.day.daily_chance_of_rain)
    },
    getIcon(dayInfo) {
      return getWeatherIcon(dayInfo.day.condition.code)
    },
    ...mapActions(useWeatherStore, ['setSelectedForecastDate']),
    selectForecastDate(day) {
      this.setSelectedForecastDate(day)
    }
  }
}
</script>
