<template>
  <!-- home: V3 12-column grid. Source order is the phone order; md+ re-places cards.
       base  Current → Hourly → Forecast → Sun & Moon → What to wear → Details → Tides
       md    Current → Forecast → Hourly → Sun & Moon → What to wear → Tides (details move
             into Current)
       lg    Current / Forecast in cols 1–7, Sun & Moon cols 8–12 over both rows; row 3 is
             Hourly (cols 1–7) and What to wear under Sun & Moon, at Hourly's height; Tides
             full width below. xl is the same on an 8 / 4 split -->
  <div>
    <!-- one announcement for the whole dashboard; each card marks itself aria-busy -->
    <p role="status" class="sr-only">{{ showSkeleton ? $t('loading.weather') : '' }}</p>
    <!-- opened from a share card (?from=share): the shared place and day, and a way back -->
    <ShareBanner
      v-if="showBanner"
      :place="bannerPlace"
      :date="bannerDate"
      @mine="showMine"
      @dismiss="bannerHidden = true"
    />
    <LocationHeading />
    <div class="grid grid-cols-12 items-stretch gap-4 md:gap-6">
      <BasicWeatherInfo class="col-span-12 row-start-1 lg:col-span-7 xl:col-span-8" />
      <DailyChart class="col-span-12 row-start-2 md:row-start-3 lg:col-span-7 xl:col-span-8" />
      <WeatherForecast class="col-span-12 row-start-3 md:row-start-2 lg:col-span-7 xl:col-span-8" />
      <PlanetaryInfo
        class="col-span-12 row-start-4 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 xl:col-span-4 xl:col-start-9"
      />
      <WearCard
        class="col-span-12 row-start-5 h-[300px] md:h-[340px] lg:col-span-5 lg:col-start-8 lg:row-start-3 lg:h-auto xl:col-span-4 xl:col-start-9"
      />
      <DashboardCard
        :title="$t('weather.details')"
        :busy="showSkeleton"
        class="col-span-12 row-start-6 md:hidden"
      >
        <WeatherDetails variant="tiles" />
      </DashboardCard>
      <TidesCard class="col-span-12 row-start-7 md:row-start-6 lg:row-start-4" />
    </div>
  </div>
</template>

<script>
import DailyChart from '@/components/weather/DailyChart.vue'
import BasicWeatherInfo from '@/components/weather/BasicWeatherInfo.vue'
import WeatherForecast from '@/components/weather/WeatherForecast.vue'
import PlanetaryInfo from '@/components/weather/PlanetaryInfo.vue'
import LocationHeading from '@/components/weather/LocationHeading.vue'
import WeatherDetails from '@/components/weather/WeatherDetails.vue'
import DashboardCard from '@/components/common/DashboardCard.vue'
import TidesCard from '@/components/tides/TidesCard.vue'
import WearCard from '@/components/wear/WearCard.vue'
import ShareBanner from '@/components/share/ShareBanner.vue'
import { useWeatherSkeleton } from '@/composables/useSkeletonGate'
import useWeatherStore from '@/stores/weather'
import { currentIntlTag } from '@/i18n'
import { parseShareLink, withoutShare } from '@/utils/share/shareLink'

export default {
  name: 'HomeView',
  components: {
    DailyChart,
    BasicWeatherInfo,
    WeatherForecast,
    PlanetaryInfo,
    LocationHeading,
    WeatherDetails,
    DashboardCard,
    TidesCard,
    WearCard,
    ShareBanner
  },
  setup() {
    return useWeatherSkeleton()
  },
  data() {
    return { bannerHidden: false }
  },
  computed: {
    shared() {
      return parseShareLink(this.$route?.query || {})
    },
    showBanner() {
      return !!this.shared?.place && !this.bannerHidden
    },
    // the link's name; a region link has none, so the place it loaded (region, country)
    bannerPlace() {
      if (this.$route?.query?.name) return this.shared.place.name
      const c = useWeatherStore().coords
      if (!c) return this.shared.place.name
      return [c.region, c.country].filter(Boolean).join(', ') || c.name
    },
    bannerDate() {
      const d = this.shared?.date
      if (!d) return ''
      const [y, m, day] = d.split('-').map(Number)
      return new Intl.DateTimeFormat(currentIntlTag(), {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC'
      }).format(Date.UTC(y, m - 1, day))
    }
  },
  mounted() {
    this.openShared()
  },
  methods: {
    // load the shared place, then its day when the forecast has it
    async openShared() {
      const shared = this.shared
      if (!shared?.place) return
      const weather = useWeatherStore()
      try {
        await weather.getWeatherByCoords(shared.place.lat, shared.place.lon)
      } catch (error) {
        console.error('Shared place failed to load:', error)
        return
      }
      if (shared.date && shared.date !== weather.today) {
        const day = weather.forecast.find((f) => f.date === shared.date)
        if (day) weather.setSelectedForecastDate(day)
      }
    },
    // back to the visitor's own location, without the link's params
    async showMine() {
      this.bannerHidden = true
      await this.$router?.replace({ query: withoutShare(this.$route.query) })
      try {
        await useWeatherStore().detectUserLocation()
      } catch (error) {
        console.error('Location detection failed:', error)
      }
    }
  }
}
</script>
