import { defineStore } from 'pinia'
import axios from 'axios'
import { airQualityIndex, uvIndex } from '@/utils/weather'
import weatherMixin from '@/mixins/weatherMixin'

export default defineStore('weather', {
  state: () => ({
    cityName: '',
    location: '',
    day: '',
    date: '',
    condition: '',
    hourlyData: {},
    dailySummary: {},
    astro: {}, //sunrise, sunset, moonrise, moonset
    temperature: {}, //current temperature values
    chanceOfRain: '',
    basicWeatherInfo: {},
    isLoading: false,
    forecast: [],
    weatherByDate: [],
    selectedForecastDate: null
  }),
  actions: {
    async getCityWeather(cityName) {
      this.isLoading = true
      const apid = '8bca70a578594fd6b4c142700230605'
      const daysCount = 7
      await axios
        .get(
          `http://api.weatherapi.com/v1/forecast.json?key=${apid}&q=${cityName}&days=${daysCount}&aqi=yes&alerts=yes`
        )
        .then((res) => {
          this.setValues(res.data)
          this.isLoading = false
        })
        .catch((err) => {
          this.isLoading = false
          throw err
        })
    },

    async setValues(response) {
      //forecast
      this.forecast = response?.forecast?.forecastday || []

      //current location
      this.location = `${response.location.name}, ${response.location.country}`

      //current condition
      this.condition = response.current.condition.text

      //current chance of rain
      this.chanceOfRain = weatherMixin.methods.formatRainChance(response.forecast.forecastday[0].day.daily_chance_of_rain)

      //current date
      this.date = response.current.last_updated.split(' ')[0] //"2023-05-07 11:00" => "2023-05-07"
      this.day = weatherMixin.methods.formatDate(this.date)

      //current temperature values
      this.temperature.avgTemp = weatherMixin.methods.formatTemp(response.current.temp_c)
      this.temperature.feelsLike = weatherMixin.methods.formatTemp(response.current.feelslike_c)
      this.temperature.maxTemp = weatherMixin.methods.formatTemp(response.forecast.forecastday[0].day.maxtemp_c)
      this.temperature.minTemp = weatherMixin.methods.formatTemp(response.forecast.forecastday[0].day.mintemp_c)

      //current astronomical values
      this.astro.sunrise = response.forecast.forecastday[0].astro.sunrise
      this.astro.sunset = response.forecast.forecastday[0].astro.sunset
      this.astro.moonrise = response.forecast.forecastday[0].astro.moonrise
      this.astro.moonset = response.forecast.forecastday[0].astro.moonset

      //current basic weather info
      this.basicWeatherInfo.humidity = response.current.humidity
      this.basicWeatherInfo.visibility = response.current.vis_km
      this.basicWeatherInfo.pressure = response.current.pressure_mb
      this.basicWeatherInfo.uv = uvIndex(response.current.uv)
      this.basicWeatherInfo.airQuality = airQualityIndex(
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

    setSelectedForecastDate(date) {
      this.selectedForecastDate = date;
      // Update other relevant state properties based on the selected date
      if (date) {
        this.date = date.date;
        this.day = weatherMixin.methods.formatDate(date.date);
        this.condition = date.day.condition.text;
        this.chanceOfRain = weatherMixin.methods.formatRainChance(date.day.daily_chance_of_rain);
        this.temperature.maxTemp = weatherMixin.methods.formatTemp(date.day.maxtemp_c);
        this.temperature.minTemp = weatherMixin.methods.formatTemp(date.day.mintemp_c);
        this.astro = date.astro;
      }
    }
  }
})
