import { DATE_FORMATS, TEMPERATURE, RAIN_CHANCE } from '@/constants/weather'
import { currentIntlTag } from '@/i18n'

// parse 'YYYY-MM-DD' as a local date (new Date(string) would treat it as UTC
// and can shift the displayed day in western timezones)
function toLocalDate(date) {
  if (typeof date === 'string') {
    const [year, month, day] = date.split('-').map(Number)
    if (year && month && day) return new Date(year, month - 1, day)
  }
  return new Date(date)
}

function formatNumber(value) {
  if (value === null || value === undefined || value === '' || isNaN(value)) return ''
  return new Intl.NumberFormat(currentIntlTag(), { useGrouping: false }).format(value)
}

export default {
  methods: {
    formatDate(date, format = DATE_FORMATS.FULL) {
      return new Intl.DateTimeFormat(currentIntlTag(), format).format(toLocalDate(date))
    },
    formatTime(hour) {
      const time = new Date().setHours(hour, 0, 0, 0)
      return new Intl.DateTimeFormat(currentIntlTag(), DATE_FORMATS.TIME).format(time).toLowerCase()
    },
    formatNumber,
    formatTemp(temp) {
      return `${formatNumber(Math.ceil(temp))}${TEMPERATURE.DEGREE_SYMBOL}`
    },
    formatRainChance(chance) {
      return `${formatNumber(chance)}${RAIN_CHANCE.PERCENTAGE_SYMBOL}`
    },
    getDayName(date) {
      return this.formatDate(date, DATE_FORMATS.DAY)
    },
    getShortDate(date) {
      return this.formatDate(date, DATE_FORMATS.SHORT_DATE)
    }
  }
}
