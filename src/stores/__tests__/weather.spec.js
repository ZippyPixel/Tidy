import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import useWeatherStore from '@/stores/weather'
import fixture from '@/utils/__tests__/fixtures/weatherapi-forecast.json'

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

describe('current conditions for the detail modals', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('keeps the raw current reading and the next 24 hours from the location clock', async () => {
    const store = useWeatherStore()
    await store.setValues(fixture)
    expect(store.current.wind_kph).toBe(10.8)
    expect(store.next24Hours).toHaveLength(24)
    expect(store.next24Hours[0]).toMatchObject({ date: '2026-11-06', hour: 13 })
    expect(store.next24Hours[23]).toMatchObject({ date: '2026-11-07', hour: 12 })
  })

  it('is empty before the first fetch', () => {
    const store = useWeatherStore()
    expect(store.current).toBeNull()
    expect(store.next24Hours).toEqual([])
  })

  it('stays on the current reading when a forecast day is selected', async () => {
    const store = useWeatherStore()
    await store.setValues(fixture)
    store.setSelectedForecastDate(fixture.forecast.forecastday[2])
    expect(store.current.last_updated).toBe('2026-11-06 12:45')
    expect(store.next24Hours[0].date).toBe('2026-11-06')
  })
})

describe('weatherPending (when cards show their skeleton)', () => {
  let store
  let resolveFetch

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useWeatherStore()
    vi.stubGlobal(
      '$fetch',
      vi.fn(() => new Promise((resolve) => (resolveFetch = resolve)))
    )
  })

  afterEach(() => vi.unstubAllGlobals())

  it('is pending before anything has been asked for', () => {
    expect(store.weatherPending).toBe(true)
  })

  it('is pending on the first load, and not once it lands', async () => {
    const load = store.getCityWeather('Dhaka')
    expect(store.weatherPending).toBe(true)
    resolveFetch(response())
    await load
    expect(store.weatherPending).toBe(false)
  })

  it('stops waiting when there is no location to wait for', async () => {
    vi.stubGlobal('navigator', {})
    await expect(store.detectUserLocation()).rejects.toThrow()
    expect(store.weatherPending).toBe(false)
  })

  it('is pending again when the city changes', async () => {
    const first = store.getCityWeather('Dhaka')
    resolveFetch(response())
    await first
    const next = store.getCityWeather('Chittagong')
    expect(store.weatherPending).toBe(true)
    resolveFetch(response())
    await next
    expect(store.weatherPending).toBe(false)
  })

  it('is not pending for a refresh of the same city, and keeps the old numbers', async () => {
    const first = store.getCityWeather('Dhaka')
    resolveFetch(response())
    await first
    const refresh = store.refetchWeather()
    expect(store.isLoading).toBe(true)
    expect(store.weatherPending).toBe(false)
    expect(store.location).toBe('Chhota Magbazar, Bangladesh')
    resolveFetch(response())
    await refresh
  })

  it('refetches the city still on its way, not the one on screen', async () => {
    const first = store.getCityWeather('Dhaka')
    resolveFetch(response())
    await first
    store.getCityWeather('Chittagong')
    store.refetchWeather()
    expect(store.pendingQuery).toBe('Chittagong')
    expect($fetch).toHaveBeenLastCalledWith('/api/forecast', expect.objectContaining({
      query: expect.objectContaining({ q: 'Chittagong' })
    }))
  })
})
