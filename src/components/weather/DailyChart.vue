<template>
  <DashboardCard :title="$t('hourly.title')" class="overflow-hidden">
    <!-- design/TidyHourly: Summary (scrolling hour cards) / Trends (metric chart),
         both over the same 24-hour window starting now (or 00:00 on a picked day) -->
    <template #actions>
      <SegmentedControl
        kind="tabs"
        :aria-label="$t('hourly.view')"
        :options="modes"
        :model-value="mode"
        class="max-[340px]:w-full"
        @update:model-value="setMode"
      />
    </template>

    <div class="relative h-[232px]">
      <div
        role="tabpanel"
        :aria-label="$t('hourly.summary')"
        :aria-hidden="String(mode !== 'summary')"
        class="hourly-panel absolute inset-0"
        :class="{ 'is-hidden': mode !== 'summary' }"
      >
        <HourlySummary :items="items" :loading="loading" :live="live" :today="today" />
      </div>
      <div
        role="tabpanel"
        :aria-label="$t('hourly.trends')"
        :aria-hidden="String(mode !== 'trends')"
        class="hourly-panel absolute inset-0"
        :class="{ 'is-hidden': mode !== 'trends' }"
      >
        <HourlyTrends
          :points="points"
          :loading="loading"
          :live="live"
          :today="today"
          :metric="metric"
          @update:metric="setMetric"
        />
      </div>
    </div>
  </DashboardCard>
</template>

<script>
import { mapState } from 'pinia'
import useWeatherStore from '@/stores/weather'
import DashboardCard from '@/components/common/DashboardCard.vue'
import SegmentedControl from '@/components/common/SegmentedControl.vue'
import HourlySummary from '@/components/weather/HourlySummary.vue'
import HourlyTrends from '@/components/weather/HourlyTrends.vue'
import { hourlyStrip, hourlyWindow } from '@/utils/hourly'
import { locationClock } from '@/utils/astro'

const MODE_KEY = 'tidy.hourly.mode'
const METRIC_KEY = 'tidy.hourly.metric'
const METRICS = ['temp', 'feels', 'rain', 'wind', 'hum']

function readPref(key, allowed) {
  try {
    const value = localStorage.getItem(key)
    return allowed.includes(value) ? value : null
  } catch {
    return null
  }
}

function writePref(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // private mode / blocked storage: the choice just is not remembered
  }
}

export default {
  name: 'DailyChart',
  components: { DashboardCard, SegmentedControl, HourlySummary, HourlyTrends },
  data() {
    return {
      mode: 'summary',
      metric: 'temp',
      nowMs: Date.now(),
      clockTimer: null
    }
  },
  computed: {
    ...mapState(useWeatherStore, ['hourly', 'forecast', 'date', 'today', 'zoneOffsetMs', 'isLoading']),
    modes() {
      return [
        { value: 'summary', label: this.$t('hourly.summary') },
        { value: 'trends', label: this.$t('hourly.trends') }
      ]
    },
    clock() {
      return locationClock(this.zoneOffsetMs, this.nowMs)
    },
    // today's window starts at the location's current hour; a picked day shows 00:00 on
    live() {
      return !!this.date && this.date === this.today
    },
    points() {
      if (!this.date) return []
      if (!this.live) return hourlyWindow(this.hourly, this.date, 0)
      // the city's clock may have passed midnight since the data was fetched
      const start = this.hourly[this.clock.date] ? this.clock.date : this.date
      return hourlyWindow(this.hourly, start, start === this.clock.date ? this.clock.hour : 0)
    },
    items() {
      return hourlyStrip(this.points, this.forecast)
    },
    loading() {
      return this.isLoading && !this.points.length
    }
  },
  mounted() {
    this.mode = readPref(MODE_KEY, ['summary', 'trends']) || this.mode
    this.metric = readPref(METRIC_KEY, METRICS) || this.metric
    // keep "now" current while the page stays open
    this.clockTimer = setInterval(() => (this.nowMs = Date.now()), 60000)
  },
  beforeUnmount() {
    clearInterval(this.clockTimer)
  },
  methods: {
    setMode(value) {
      this.mode = value
      writePref(MODE_KEY, value)
    },
    setMetric(value) {
      this.metric = value
      writePref(METRIC_KEY, value)
    }
  }
}
</script>

<style scoped>
.hourly-panel {
  transition: opacity 150ms ease, visibility 150ms;
}

.hourly-panel.is-hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .hourly-panel {
    transition: none;
  }
}
</style>
