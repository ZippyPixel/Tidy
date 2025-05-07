import moment from 'moment'
import { DATE_FORMATS, TEMPERATURE, RAIN_CHANCE } from '@/constants/weather'

export default {
  methods: {
    formatDate(date, format = DATE_FORMATS.FULL) {
      return moment(date).format(format)
    },
    formatTime(hour) {
      return moment().hour(hour).format(DATE_FORMATS.TIME).toLowerCase()
    },
    formatTemp(temp) {
      return `${Math.ceil(temp)}${TEMPERATURE.DEGREE_SYMBOL}`
    },
    formatRainChance(chance) {
      return `${chance}${RAIN_CHANCE.PERCENTAGE_SYMBOL}`
    },
    getDayName(date) {
      return moment(date).format(DATE_FORMATS.DAY)
    },
    getShortDate(date) {
      return moment(date).format(DATE_FORMATS.SHORT_DATE)
    }
  }
} 