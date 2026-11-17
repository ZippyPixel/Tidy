// A WeatherAPI-shaped two-day forecast for 2026-07-15 in UTC+6 (rainy and windy unless
// `over` says otherwise), and a clock at 13:20 there.
export const OFFSET = 6 * 3600
export const DAY0 = Date.UTC(2026, 6, 15) / 1000 - OFFSET
export const NOW = (DAY0 + 13 * 3600 + 20 * 60) * 1000

const hour = (d, h, over) => ({
  time_epoch: DAY0 + d * 86400 + h * 3600,
  time: `2026-07-${15 + d} ${String(h).padStart(2, '0')}:00`,
  temp_c: 14,
  feelslike_c: 13,
  chance_of_rain: 80,
  chance_of_snow: 0,
  precip_mm: 1.4,
  wind_kph: 34,
  gust_kph: 58,
  uv: 1,
  humidity: 86,
  is_day: h >= 6 && h < 18 ? 1 : 0,
  condition: { code: 1189 },
  ...(typeof over === 'function' ? over(d, h) : over)
})

export const forecast = (over = {}) =>
  [0, 1].map((d) => ({
    date: `2026-07-${15 + d}`,
    hour: Array.from({ length: 24 }, (_, h) => hour(d, h, over))
  }))

export const weatherState = (state = {}) => ({
  awaitingLocation: false,
  forecast: forecast(),
  today: '2026-07-15',
  date: '2026-07-15',
  zoneOffsetMs: OFFSET * 1000,
  coords: { name: 'Joar Sahara', country: 'Bangladesh', lat: 23.8, lon: 90.4, tzId: 'Asia/Dhaka' },
  ...state
})
