import moment from 'moment'
import { formatTemperature, formatChanceOfRain } from '@/utils/weather'

export default {
  methods: {
    formatDate(date, format = 'dddd, MMM D') {
      return moment(date).format(format)
    },
    formatTime(hour) {
      return moment().hour(hour).format('h a').toLowerCase()
    },
    formatTemp(temp) {
      return formatTemperature(temp)
    },
    formatRainChance(chance) {
      return formatChanceOfRain(chance)
    },
    getDayName(date) {
      return moment(date).format('dddd')
    },
    getShortDate(date) {
      return moment(date).format('MMM D')
    }
  }
} 