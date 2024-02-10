import { defineStore } from "pinia";
import axios from "axios";
import { dateToName, convertToAMPM } from "./helpers/formatDate";
import { airQualityIndex, uvIndex } from "./helpers/indexToText";

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
  }),
  actions: {
    async getCityWeather (cityName) {
      this.isLoading = true;
      const apid = '8bca70a578594fd6b4c142700230605'
      const daysCount = 7
      await axios.get(`http://api.weatherapi.com/v1/forecast.json?key=${apid}&q=${cityName}&days=${daysCount}&aqi=yes&alerts=yes`).then((res) => {
        this.setValues(res.data)
        this.isLoading = false;
      }).catch((err) => {
        this.isLoading = false;
        throw err;
      })
    },

    async setValues(response){
      //current location
      this.location = `${response.location.name}, ${response.location.country}`

      //current condition
      this.condition = response.current.condition.text

      //current chance of rain
      this.chanceOfRain = response.forecast.forecastday[0].day.daily_chance_of_rain

      //current date
      this.date = response.current.last_updated.split(" ")[0] //"2023-05-07 11:00" => "2023-05-07"
      this.day = dateToName(this.date)
      
      //current temperature values
      this.temperature.avgTemp = Math.ceil(response.current.temp_c)
      this.temperature.feelsLike = Math.ceil(response.current.feelslike_c)
      this.temperature.maxTemp = Math.ceil(response.forecast.forecastday[0].day.maxtemp_c)
      this.temperature.minTemp = Math.ceil(response.forecast.forecastday[0].day.mintemp_c)

      //current astronomical values
      this.astro.sunrise = response.forecast.forecastday[0].astro.sunrise;
      this.astro.sunset = response.forecast.forecastday[0].astro.sunset;
      this.astro.moonrise = response.forecast.forecastday[0].astro.moonrise;
      this.astro.moonset = response.forecast.forecastday[0].astro.moonset;

      //current basic weather info
      this.basicWeatherInfo.humidity = response.current.humidity
      this.basicWeatherInfo.visibility = response.current.vis_km
      this.basicWeatherInfo.pressure = response.current.pressure_mb
      this.basicWeatherInfo.uv = uvIndex(response.current.uv)
      this.basicWeatherInfo.airQuality = airQualityIndex(response.current.air_quality['us-epa-index'])

      //Daily Summary
      await response.forecast.forecastday.map((day) => {
        this.dailySummary[day.date] = {
          hours: [],
          tempDataC: [],
          tempDataF: [],
        };
        day.hour.map((hour, index) => {
          this.dailySummary[day.date].hours.push(convertToAMPM(index).toString())
          this.dailySummary[day.date].tempDataC.push(hour.temp_c)
          this.dailySummary[day.date].tempDataF.push(hour.temp_f)
        })
      })
    }
  }
})