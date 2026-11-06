import { describe, it, expect } from 'vitest'
import {
  normalizeHour,
  hourlyWindow,
  hourlyStrip,
  smoothPath,
  temperatureScale,
  compassPoint
} from '@/utils/hourly'

const apiHour = (date, h, extra = {}) => ({
  time: `${date} ${String(h).padStart(2, '0')}:00`,
  temp_c: 20 + h / 2,
  temp_f: 68 + h,
  feelslike_c: 21,
  feelslike_f: 70,
  chance_of_rain: h,
  wind_kph: 10,
  wind_mph: 6.2,
  wind_degree: 90,
  humidity: 80,
  condition: { code: 1000 },
  is_day: h >= 6 && h < 18 ? 1 : 0,
  ...extra
})

const day = (date) => Array.from({ length: 24 }, (_, h) => normalizeHour(apiHour(date, h)))
const hourly = { '2026-07-15': day('2026-07-15'), '2026-07-16': day('2026-07-16') }

describe('normalizeHour', () => {
  it('keeps the fields the hour detail modal reads, in both units', () => {
    const hour = normalizeHour(
      apiHour('2026-07-15', 9, {
        condition: { code: 1000, text: 'Sunny ' },
        precip_mm: 1.2,
        precip_in: 0.05,
        gust_kph: 25.2,
        gust_mph: 15.7,
        dewpoint_c: 16.6,
        dewpoint_f: 62,
        uv: 6,
        vis_km: 10,
        vis_miles: 6,
        pressure_mb: 1012,
        pressure_in: 29.88,
        cloud: 8,
        heatindex_c: 32.8,
        heatindex_f: 91.1
      })
    )
    expect(hour).toMatchObject({
      conditionText: 'Sunny',
      precipMm: 1.2,
      precipIn: 0.05,
      gustKph: 25.2,
      gustMph: 15.7,
      dewC: 16.6,
      dewF: 62,
      uv: 6,
      visKm: 10,
      visMi: 6,
      pressureMb: 1012,
      pressureIn: 29.88,
      cloud: 8,
      heatC: 32.8,
      heatF: 91.1
    })
  })

  it('keeps both units and flattens the fields the card reads', () => {
    expect(normalizeHour(apiHour('2026-07-15', 9))).toEqual({
      date: '2026-07-15',
      hour: 9,
      tempC: 24.5,
      tempF: 77,
      feelsC: 21,
      feelsF: 70,
      rain: 9,
      windKph: 10,
      windMph: 6.2,
      windDegree: 90,
      humidity: 80,
      code: 1000,
      isDay: true
    })
  })
})

describe('hourlyWindow', () => {
  it('starts at the given hour and runs into the next day', () => {
    const points = hourlyWindow(hourly, '2026-07-15', 15)
    expect(points).toHaveLength(25)
    expect(points[0]).toMatchObject({ date: '2026-07-15', hour: 15, dayOffset: 0 })
    expect(points[9]).toMatchObject({ date: '2026-07-16', hour: 0, dayOffset: 1 })
    expect(points[24]).toMatchObject({ date: '2026-07-16', hour: 15 })
  })

  it('stops when the forecast runs out', () => {
    expect(hourlyWindow(hourly, '2026-07-16', 10)).toHaveLength(14)
  })

  it('is empty for an unknown date', () => {
    expect(hourlyWindow(hourly, '2026-08-01', 0)).toEqual([])
  })
})

describe('hourlyStrip', () => {
  const days = [
    { date: '2026-07-15', astro: { sunrise: '05:48 AM', sunset: '05:51 PM' } },
    { date: '2026-07-16', astro: { sunrise: '05:49 AM', sunset: '05:50 PM' } }
  ]

  it('puts events before the first hour after them and a divider at midnight', () => {
    const items = hourlyStrip(hourlyWindow(hourly, '2026-07-15', 15), days)
    const ids = items.map((i) => i.id)
    expect(ids.indexOf('sunset-2026-07-15')).toBe(ids.indexOf('2026-07-15-18') - 1)
    expect(ids.indexOf('divider-2026-07-16')).toBe(ids.indexOf('2026-07-16-0') - 1)
    expect(ids.indexOf('sunrise-2026-07-16')).toBe(ids.indexOf('2026-07-16-6') - 1)
    // today's sunrise is before the window starts
    expect(ids).not.toContain('sunrise-2026-07-15')
  })

  it('skips missing event times', () => {
    const items = hourlyStrip(hourlyWindow(hourly, '2026-07-15', 15), [
      { date: '2026-07-15', astro: { sunrise: '05:48 AM', sunset: 'No sunset' } }
    ])
    expect(items.some((i) => i.type === 'event')).toBe(false)
  })
})

describe('chart helpers', () => {
  it('draws a smooth path through every point', () => {
    expect(smoothPath([])).toBe('')
    const d = smoothPath([
      [0, 10],
      [10, 0],
      [20, 10]
    ])
    expect(d.startsWith('M0.0,10.0')).toBe(true)
    expect(d.match(/C/g)).toHaveLength(2)
    expect(d.endsWith('20.0,10.0')).toBe(true)
  })

  it('pads the temperature domain and keeps ticks inside it', () => {
    const { min, max, ticks } = temperatureScale([26, 27, null, 35])
    expect(min).toBeLessThan(26)
    expect(max).toBeGreaterThan(35)
    expect(ticks.length).toBeGreaterThanOrEqual(2)
    expect(ticks.length).toBeLessThanOrEqual(4)
    ticks.forEach((t) => expect(t >= min && t <= max).toBe(true))
  })

  it('names compass points', () => {
    expect(compassPoint(0)).toBe('N')
    expect(compassPoint(225)).toBe('SW')
    expect(compassPoint(359)).toBe('N')
  })
})
