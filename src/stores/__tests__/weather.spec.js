import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import useWeatherStore from '@/stores/weather'

const hour = (date, h) => ({
  time: `${date} ${String(h).padStart(2, '0')}:00`,
  temp_c: 26 + h / 4,
  temp_f: 79 + h / 2,
  feelslike_c: 28,
  feelslike_f: 82,
  chance_of_rain: 10,
  wind_kph: 12,
  wind_mph: 7.5,
  wind_degree: 180,
  humidity: 70,
  condition: { code: 1063 },
  is_day: 1
})

const forecastDay = (date, astro) => ({
  date,
  day: {
    maxtemp_c: 31,
    maxtemp_f: 88,
    mintemp_c: 26,
    mintemp_f: 79,
    daily_chance_of_rain: 49,
    condition: { text: 'Patchy rain nearby', code: 1063 }
  },
  astro,
  hour: Array.from({ length: 24 }, (_, h) => hour(date, h))
})

// trimmed copy of .claude/weather-api-response.md
const response = () => ({
  location: {
    name: 'Chhota Magbazar',
    country: 'Bangladesh',
    localtime: '2026-07-15 15:52',
    localtime_epoch: Date.UTC(2026, 6, 15, 9, 52) / 1000
  },
  current: {
    last_updated: '2026-07-15 15:30',
    temp_c: 31.1,
    temp_f: 88,
    is_day: 1,
    condition: { text: 'Patchy rain nearby', code: 1063 },
    feelslike_c: 37.5,
    feelslike_f: 99.5,
    humidity: 69,
    vis_km: 10,
    pressure_mb: 1000,
    uv: 3.7,
    air_quality: { 'us-epa-index': 1 }
  },
  forecast: {
    forecastday: [
      forecastDay('2026-07-15', {
        sunrise: '05:18 AM',
        sunset: '06:50 PM',
        moonrise: '10:02 PM',
        moonset: '09:41 AM',
        moon_phase: 'Waning Gibbous',
        moon_illumination: 78
      }),
      forecastDay('2026-07-16', {
        sunrise: '05:19 AM',
        sunset: '06:50 PM',
        moonrise: '10:40 PM',
        moonset: '10:44 AM',
        moon_phase: 'Waning Gibbous',
        moon_illumination: 69
      })
    ]
  }
})

describe('weather store setValues', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('keeps hourly data per date in both units', async () => {
    const store = useWeatherStore()
    await store.setValues(response())
    expect(Object.keys(store.hourly)).toEqual(['2026-07-15', '2026-07-16'])
    expect(store.hourly['2026-07-15']).toHaveLength(24)
    expect(store.hourly['2026-07-15'][15]).toMatchObject({ hour: 15, tempC: 29.75, tempF: 86.5, rain: 10 })
  })

  it('records the location date and zone offset', async () => {
    const store = useWeatherStore()
    await store.setValues(response())
    expect(store.today).toBe('2026-07-15')
    expect(store.zoneOffsetMs).toBe(6 * 3600000)
  })

  it('stores the whole astro object, moon phase included', async () => {
    const store = useWeatherStore()
    await store.setValues(response())
    expect(store.astro).toMatchObject({ sunrise: '05:18 AM', moon_phase: 'Waning Gibbous', moon_illumination: 78 })
  })

  it('switching forecast day re-points astro without touching today', async () => {
    const store = useWeatherStore()
    const data = response()
    await store.setValues(data)
    store.setSelectedForecastDate(data.forecast.forecastday[1])
    expect(store.date).toBe('2026-07-16')
    expect(store.today).toBe('2026-07-15')
    expect(store.astro.moon_illumination).toBe(69)
  })
})

describe('UV level', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('rounds into the whole-number bands instead of falling between them', () => {
    const store = useWeatherStore()
    expect(store.getUVIndexLevel(0)).toBe('low')
    expect(store.getUVIndexLevel(0.4)).toBe('low')
    expect(store.getUVIndexLevel(2.6)).toBe('moderate')
    expect(store.getUVIndexLevel(5.6)).toBe('high')
    expect(store.getUVIndexLevel(7.5)).toBe('veryHigh')
    expect(store.getUVIndexLevel(10.6)).toBe('extreme')
    expect(store.getUVIndexLevel(undefined)).toBe('unknown')
  })
})
