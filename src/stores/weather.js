import { defineStore } from 'pinia'
import { AIR_QUALITY_LEVELS, UV_INDEX_LEVELS } from '@/constants/weather'
import { API_ENDPOINTS } from '@/constants/api'
import weatherMixin from '@/mixins/weatherMixin'
import useUnitStore from '@/stores/unit'
import { currentLocale } from '@/i18n'
import { hourlyWindow, normalizeHour } from '@/utils/hourly'
import { zoneOffsetMs } from '@/utils/astro'

export default defineStore('weather', {
  state: () => ({
    cityName: '',
    location: '',
    day: '',
    date: '',
    condition: '',
    conditionCode: null,
    isDay: 1,
    hourly: {}, // { [date]: normalized hour[] } for the Hourly card
    current: null, // raw API `current`, for the detail modals; unaffected by the selected day
    localtime: '', // the location's clock when fetched, 'YYYY-MM-DD HH:mm'
    today: '', // the location's current date, YYYY-MM-DD
    zoneOffsetMs: null, // location UTC offset, for its wall clock (utils/astro locationClock)
    coords: null, // { name, country, lat, lon, tzId } of the forecast location, for the tides
    astro: {}, //sunrise, sunset, moonrise, moonset
    rawTemperature: {}, //stores raw C and F values from API
    chanceOfRain: '',
    basicWeatherInfo: {},
    isLoading: false,
    pendingQuery: null, // the query being fetched; differs from lastQuery when the place changes
    // nothing has been asked for yet: true until the first geolocation probe or fetch
    // settles, so the first frame (SSR included) shows skeletons rather than empty cards
    awaitingLocation: true,
    forecast: [],
    weatherByDate: [],
    selectedForecastDate: null,
    userLocation: null,
    locationError: null,
    lastQuery: null
  }),
  getters: {
    hasWeather: (state) => !!state.coords,
    // Cards show their skeleton while this is true: on the first load, and when the
    // city changes. A refetch of the same place (language switch, refresh) keeps the
    // old numbers on screen until the new ones arrive. See composables/useSkeletonGate.
    weatherPending(state) {
      if (!state.coords) return state.isLoading || state.awaitingLocation
      return state.isLoading && state.pendingQuery !== state.lastQuery
    },
    temperature(state) {
      const isCelsius = useUnitStore().unit === 'celsius'
      const fmt = weatherMixin.methods.formatTemp
      const r = state.rawTemperature
      return {
        avgTemp: fmt(isCelsius ? r.avgTemp_c : r.avgTemp_f),
        feelsLike: fmt(isCelsius ? r.feelsLike_c : r.feelsLike_f),
        maxTemp: fmt(isCelsius ? r.maxTemp_c : r.maxTemp_f),
        minTemp: fmt(isCelsius ? r.minTemp_c : r.minTemp_f),
      }
    },
    // the window behind the detail modals, starting at the hour the data was fetched
    next24Hours(state) {
      if (!state.localtime) return []
      const [date, time] = state.localtime.split(' ')
      return hourlyWindow(state.hourly, date, Number(time.split(':')[0]), 24)
    }
  },
  actions: {
    async detectUserLocation() {
      try {
        await this.locateAndFetch()
      } finally {
        this.awaitingLocation = false
      }
    },

    locateAndFetch() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          this.locationError = 'errors.geolocationUnsupported'
          reject(new Error(this.locationError))
          return
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            this.userLocation = { latitude, longitude }
            try {
              await this.getWeatherByCoords(latitude, longitude)
              resolve()
            } catch (error) {
              reject(error)
            }
          },
          (error) => {
            this.locationError = 'errors.locationFailed'
            reject(error)
          }
        )
      })
    },

    async getWeatherByCoords(latitude, longitude) {
      await this.fetchForecast(`${latitude},${longitude}`)
    },

    async getCityWeather(cityName) {
      await this.fetchForecast(cityName)
    },

    async fetchForecast(query) {
      this.isLoading = true
      this.pendingQuery = query
      try {
        const data = await $fetch(API_ENDPOINTS.WEATHER, {
          query: { q: query, lang: currentLocale() }
        })
        // a slower request for a place the user has moved on from lost the race
        if (this.pendingQuery !== query) return
        this.lastQuery = query
        await this.setValues(data)
      } finally {
        if (this.pendingQuery === query) {
          this.isLoading = false
          this.pendingQuery = null
          this.awaitingLocation = false
        }
      }
    },

    async refetchWeather() {
      // a place still on its way wins over the one on screen
      const query = this.pendingQuery ?? this.lastQuery
      if (!query) return
      await this.fetchForecast(query)
    },

    async searchLocations(query) {
      const results = await $fetch(API_ENDPOINTS.SEARCH, { query: { q: query } })
      return results || []
    },

    async setValues(response) {
      //forecast
      this.forecast = response?.forecast?.forecastday || []

      //current location
      this.location = `${response.location.name}, ${response.location.country}`

      //current condition
      this.condition = response.current.condition.text
      this.conditionCode = response.current.condition.code
      this.isDay = response.current.is_day

      //current chance of rain
      this.chanceOfRain = weatherMixin.methods.formatRainChance(response.forecast.forecastday[0].day.daily_chance_of_rain)

      //current date
      this.date = response.current.last_updated.split(' ')[0] //"2023-05-07 11:00" => "2023-05-07"
      this.day = weatherMixin.methods.formatDate(this.date)

      //current temperature values (raw, unit conversion happens in getter)
      this.rawTemperature = {
        avgTemp_c: response.current.temp_c,
        avgTemp_f: response.current.temp_f,
        feelsLike_c: response.current.feelslike_c,
        feelsLike_f: response.current.feelslike_f,
        maxTemp_c: response.forecast.forecastday[0].day.maxtemp_c,
        maxTemp_f: response.forecast.forecastday[0].day.maxtemp_f,
        minTemp_c: response.forecast.forecastday[0].day.mintemp_c,
        minTemp_f: response.forecast.forecastday[0].day.mintemp_f,
      }

      //location clock: today's date and zone offset, so "now" is the city's, not the browser's
      this.today = this.date
      this.zoneOffsetMs = zoneOffsetMs(response.location.localtime, response.location.localtime_epoch)

      //where the forecast is for, so the tides can find the nearest station
      this.coords = {
        name: response.location.name,
        country: response.location.country,
        lat: response.location.lat,
        lon: response.location.lon,
        tzId: response.location.tz_id
      }

      //current astronomical values: the whole API object (rise/set times, moon phase and
      //illumination), the same shape setSelectedForecastDate assigns
      this.astro = { ...response.forecast.forecastday[0].astro }

      //hourly values per day, both units kept like rawTemperature
      this.hourly = Object.fromEntries(
        this.forecast.map((day) => [day.date, (day.hour || []).map(normalizeHour)])
      )

      //current conditions as the API sent them, for the detail modals
      this.current = response.current
      this.localtime = response.location.localtime

      //current basic weather info
      this.basicWeatherInfo.humidity = response.current.humidity
      this.basicWeatherInfo.visibility = response.current.vis_km
      this.basicWeatherInfo.pressure = response.current.pressure_mb
      this.basicWeatherInfo.uv = this.getUVIndexLevel(response.current.uv)
      this.basicWeatherInfo.airQuality = this.getAirQualityLevel(
        response.current.air_quality['us-epa-index']
      )
    },

    // returns an i18n key suffix (airQualityLevels.*) so components can translate it
    getAirQualityLevel(index) {
      switch (index) {
        case AIR_QUALITY_LEVELS.GOOD:
          return 'good'
        case AIR_QUALITY_LEVELS.MODERATE:
          return 'moderate'
        case AIR_QUALITY_LEVELS.UNHEALTHY:
        case AIR_QUALITY_LEVELS.UNHEALTHY + 1:
          return 'unhealthy'
        case AIR_QUALITY_LEVELS.VERY_UNHEALTHY:
          return 'veryUnhealthy'
        case AIR_QUALITY_LEVELS.HAZARDOUS:
          return 'hazardous'
        default:
          return 'unknown'
      }
    },

    // returns an i18n key suffix (uvLevels.*) so components can translate it
    getUVIndexLevel(index) {
      if (typeof index !== 'number' || Number.isNaN(index) || index < 0) return 'unknown'
      // the bands are whole numbers (WHO scale): round first, so 5.6 is "high" and 0.4
      // is "low" instead of falling between two bands
      const uv = Math.round(index)
      if (uv <= UV_INDEX_LEVELS.LOW.max) return 'low'
      if (uv <= UV_INDEX_LEVELS.MODERATE.max) return 'moderate'
      if (uv <= UV_INDEX_LEVELS.HIGH.max) return 'high'
      if (uv <= UV_INDEX_LEVELS.VERY_HIGH.max) return 'veryHigh'
      return 'extreme'
    },

    setSelectedForecastDate(date) {
      this.selectedForecastDate = date;
      // Update other relevant state properties based on the selected date
      if (date) {
        this.date = date.date;
        this.day = weatherMixin.methods.formatDate(date.date);
        this.condition = date.day.condition.text;
        this.conditionCode = date.day.condition.code;
        this.isDay = 1; // day-level condition represents the whole day
        this.chanceOfRain = weatherMixin.methods.formatRainChance(date.day.daily_chance_of_rain);
        this.rawTemperature = {
          ...this.rawTemperature,
          maxTemp_c: date.day.maxtemp_c,
          maxTemp_f: date.day.maxtemp_f,
          minTemp_c: date.day.mintemp_c,
          minTemp_f: date.day.mintemp_f,
        };
        this.astro = date.astro;
      }
    }
  }
})
