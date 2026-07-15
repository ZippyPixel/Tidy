import { defineStore } from 'pinia'
import axios from 'axios'
import { AIR_QUALITY_LEVELS, UV_INDEX_LEVELS } from '@/constants/weather'
import { API_ENDPOINTS, API_CONFIG } from '@/constants/api'
import weatherMixin from '@/mixins/weatherMixin'
import useUnitStore from '@/stores/unit'

export default defineStore('weather', {
  state: () => ({
    cityName: '',
    location: '',
    day: '',
    date: '',
    condition: '',
    conditionCode: null,
    isDay: 1,
    hourlyData: {},
    dailySummary: {},
    astro: {}, //sunrise, sunset, moonrise, moonset
    rawTemperature: {}, //stores raw C and F values from API
    chanceOfRain: '',
    basicWeatherInfo: {},
    isLoading: false,
    forecast: [],
    weatherByDate: [],
    selectedForecastDate: null,
    userLocation: null,
    locationError: null
  }),
  getters: {
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
    }
  },
  actions: {
    async detectUserLocation() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          this.locationError = 'Geolocation is not supported by your browser'
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
            this.locationError = 'Unable to retrieve your location'
            reject(error)
          }
        )
      })
    },

    async getWeatherByCoords(latitude, longitude) {
      this.isLoading = true
      const { BASE_URL, PARAMS } = API_ENDPOINTS.WEATHER
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY
      
      try {
        const response = await axios.get(
          `${BASE_URL}?key=${apiKey}&q=${latitude},${longitude}&days=${API_CONFIG.DAYS_COUNT}&aqi=${PARAMS.AQI}&alerts=${PARAMS.ALERTS}`
        )
        await this.setValues(response.data)
      } catch (error) {
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async getCityWeather(cityName) {
      this.isLoading = true
      const { BASE_URL, PARAMS } = API_ENDPOINTS.WEATHER
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY
      
      try {
        const response = await axios.get(
          `${BASE_URL}?key=${apiKey}&q=${cityName}&days=${API_CONFIG.DAYS_COUNT}&aqi=${PARAMS.AQI}&alerts=${PARAMS.ALERTS}`
        )
        await this.setValues(response.data)
      } catch (error) {
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async searchLocations(query) {
      const { BASE_URL } = API_ENDPOINTS.SEARCH
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY
      const response = await axios.get(`${BASE_URL}?key=${apiKey}&q=${encodeURIComponent(query)}`)
      return response.data || []
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

      //current astronomical values
      this.astro.sunrise = response.forecast.forecastday[0].astro.sunrise
      this.astro.sunset = response.forecast.forecastday[0].astro.sunset
      this.astro.moonrise = response.forecast.forecastday[0].astro.moonrise
      this.astro.moonset = response.forecast.forecastday[0].astro.moonset

      //current basic weather info
      this.basicWeatherInfo.humidity = response.current.humidity
      this.basicWeatherInfo.visibility = response.current.vis_km
      this.basicWeatherInfo.pressure = response.current.pressure_mb
      this.basicWeatherInfo.uv = this.getUVIndexLevel(response.current.uv)
      this.basicWeatherInfo.airQuality = this.getAirQualityLevel(
        response.current.air_quality['us-epa-index']
      )

      //Daily Summary
      await response.forecast.forecastday.map((day) => {
        this.dailySummary[day.date] = {
          hours: [],
          tempDataC: [],
          tempDataF: []
        }
        day.hour.map((hour, index) => {
          this.dailySummary[day.date].hours.push(weatherMixin.methods.formatTime(index))
          this.dailySummary[day.date].tempDataC.push(hour.temp_c)
          this.dailySummary[day.date].tempDataF.push(hour.temp_f)
        })
      })
    },

    getAirQualityLevel(index) {
      switch (index) {
        case AIR_QUALITY_LEVELS.GOOD:
          return 'Good'
        case AIR_QUALITY_LEVELS.MODERATE:
          return 'Moderate'
        case AIR_QUALITY_LEVELS.UNHEALTHY:
        case AIR_QUALITY_LEVELS.UNHEALTHY + 1:
          return 'Unhealthy'
        case AIR_QUALITY_LEVELS.VERY_UNHEALTHY:
          return 'Very Unhealthy'
        case AIR_QUALITY_LEVELS.HAZARDOUS:
          return 'Hazardous'
        default:
          return 'Unknown'
      }
    },

    getUVIndexLevel(index) {
      if (index >= UV_INDEX_LEVELS.LOW.min && index <= UV_INDEX_LEVELS.LOW.max) {
        return 'Low'
      }
      if (index >= UV_INDEX_LEVELS.MODERATE.min && index <= UV_INDEX_LEVELS.MODERATE.max) {
        return 'Moderate'
      }
      if (index >= UV_INDEX_LEVELS.HIGH.min && index <= UV_INDEX_LEVELS.HIGH.max) {
        return 'High'
      }
      if (index >= UV_INDEX_LEVELS.VERY_HIGH.min && index <= UV_INDEX_LEVELS.VERY_HIGH.max) {
        return 'Very High'
      }
      if (index >= UV_INDEX_LEVELS.EXTREME.min) {
        return 'Extreme'
      }
      return 'Unknown'
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
