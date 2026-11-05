<template>
  <DashboardCard :title="forecastDayCount">
    <!-- V3 list: day/date · icon · rain · low · range bar · high, 64px rows.
         Range bars share one scale across all days; the selected day is highlighted
         and today carries a dot for the current reading. -->
    <div class="-mx-3 flex flex-col gap-1">
      <button
        v-for="day in rows"
        :key="day.date"
        type="button"
        class="grid h-16 grid-cols-[minmax(60px,1fr)_32px_48px_32px_minmax(24px,1fr)_32px] items-center gap-2 rounded-[var(--radius)] px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[minmax(120px,1fr)_32px_56px_40px_minmax(120px,2fr)_40px] md:gap-4"
        :class="day.selected ? 'bg-accent text-accent-foreground' : 'hover:bg-foreground/[0.06]'"
        :aria-pressed="String(day.selected)"
        @click="setSelectedForecastDate(day.raw)"
      >
        <span class="flex min-w-0 items-baseline gap-2 overflow-hidden whitespace-nowrap">
          <span class="text-[15px] font-semibold">
            <span class="md:hidden">{{ day.shortName }}</span>
            <span class="hidden md:inline">{{ day.name }}</span>
          </span>
          <span class="text-[13px]" :class="{ 'text-muted-foreground': !day.selected }">{{ day.shortDate }}</span>
        </span>
        <span class="flex size-8 items-center justify-center">
          <img class="size-8 object-contain" :src="day.icon" :alt="day.condition" />
        </span>
        <span
          class="flex items-center gap-1 text-[13px] font-semibold tabular-nums text-rain"
          :title="$t('weather.chanceOfRain')"
        >
          <AppIcon name="droplet" :size="13" class="flex-none" />
          <span class="sr-only">{{ $t('weather.chanceOfRain') }}</span>
          <span>{{ day.rain }}</span>
        </span>
        <span class="text-right text-base tabular-nums" :class="{ 'text-muted-foreground': !day.selected }">
          <span class="sr-only">{{ $t('weather.low') }}</span>{{ day.low }}
        </span>
        <span class="relative h-1.5 rounded-full bg-foreground/10" aria-hidden="true">
          <span
            class="absolute inset-y-0 rounded-full bg-primary"
            :style="{ left: `${day.from}%`, right: `${100 - day.to}%` }"
          />
          <span
            v-if="day.now !== null"
            class="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-card"
            :style="{ left: `${day.now}%` }"
          />
        </span>
        <span class="text-right text-base font-semibold tabular-nums">
          <span class="sr-only">{{ $t('weather.high') }}</span>{{ day.high }}
        </span>
      </button>
    </div>
  </DashboardCard>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import useWeatherStore from '@/stores/weather'
import useUnitStore from '@/stores/unit'
import weatherMixin from '@/mixins/weatherMixin'
import AppIcon from '@/components/common/AppIcon.vue'
import DashboardCard from '@/components/common/DashboardCard.vue'
import { getWeatherIcon } from '@/constants/weatherIcons'
import { DATE_FORMATS } from '@/constants/weather'

export default {
  name: 'WeatherForecast',
  components: {
    AppIcon,
    DashboardCard
  },
  mixins: [weatherMixin],
  computed: {
    ...mapState(useWeatherStore, ['forecast', 'selectedForecastDate', 'today', 'rawTemperature']),
    ...mapState(useUnitStore, ['unit']),
    forecastDayCount() {
      const days = this.forecast?.length || 0
      return this.$t('forecast.dayCount', { count: this.formatNumber(days) }, days)
    },
    // one °C scale for every bar (proportions are the same in °F)
    scale() {
      const lows = this.forecast.map((d) => d.day.mintemp_c)
      const highs = this.forecast.map((d) => d.day.maxtemp_c)
      const min = Math.min(...lows)
      const max = Math.max(...highs)
      return { min, span: max > min ? max - min : 1 }
    },
    rows() {
      const celsius = this.unit === 'celsius'
      const selected = this.selectedForecastDate?.date ?? this.today
      const pct = (c) => Math.max(0, Math.min(100, ((c - this.scale.min) / this.scale.span) * 100))
      const nowC = this.rawTemperature?.avgTemp_c
      return this.forecast.map((day) => ({
        raw: day,
        date: day.date,
        name: this.getDayName(day.date),
        shortName: this.formatDate(day.date, DATE_FORMATS.SHORT_DAY),
        shortDate: this.getShortDate(day.date),
        condition: day.day.condition.text,
        icon: getWeatherIcon(day.day.condition.code),
        rain: this.formatRainChance(day.day.daily_chance_of_rain),
        low: this.formatTemp(celsius ? day.day.mintemp_c : day.day.mintemp_f),
        high: this.formatTemp(celsius ? day.day.maxtemp_c : day.day.maxtemp_f),
        from: pct(day.day.mintemp_c),
        to: pct(day.day.maxtemp_c),
        now: day.date === this.today && typeof nowC === 'number' ? pct(nowC) : null,
        selected: day.date === selected
      }))
    }
  },
  methods: {
    ...mapActions(useWeatherStore, ['setSelectedForecastDate'])
  }
}
</script>
