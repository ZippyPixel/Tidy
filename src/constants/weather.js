export const AIR_QUALITY_LEVELS = {
  GOOD: 1,
  MODERATE: 2,
  UNHEALTHY: 3,
  VERY_UNHEALTHY: 5,
  HAZARDOUS: 6
}

export const UV_INDEX_LEVELS = {
  LOW: { min: 1, max: 2 },
  MODERATE: { min: 3, max: 5 },
  HIGH: { min: 6, max: 7 },
  VERY_HIGH: { min: 8, max: 10 },
  EXTREME: { min: 11, max: Infinity }
}

// Intl.DateTimeFormat option sets (locale-aware; replaces the old moment format strings)
export const DATE_FORMATS = {
  FULL: { weekday: 'long', month: 'short', day: 'numeric' },
  DAY: { weekday: 'long' },
  SHORT_DATE: { month: 'short', day: 'numeric' },
  TIME: { hour: 'numeric', hour12: true }
}

export const TEMPERATURE = {
  DEGREE_SYMBOL: '°',
  ROUND_DECIMALS: 0
}

export const RAIN_CHANCE = {
  PERCENTAGE_SYMBOL: '%'
} 