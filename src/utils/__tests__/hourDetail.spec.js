import { describe, it, expect } from 'vitest'
import { hourDetail, pressureTrend, uvLevel, visibilityLevel } from '@/utils/hourDetail'
import { normalizeHour, previousHour } from '@/utils/hourly'
import en from '@/i18n/locales/en.json'
import fixture from './fixtures/weatherapi-forecast.json'

const hourly = Object.fromEntries(
  fixture.forecast.forecastday.map((day) => [day.date, day.hour.map(normalizeHour)])
)
const at = (date, h) => hourly[date][h]
const detailAt = (date, h, unit = 'celsius') =>
  hourDetail(at(date, h), previousHour(hourly, date, h), unit)

describe('hourDetail against the real forecast (2026-11-06 13:00)', () => {
  const d = detailAt('2026-11-06', 13)

  it('reads the header in °C', () => {
    expect(d).toMatchObject({ temp: 32, feels: 31.4, condition: 'Sunny' })
  })

  it('labels UV 6 as High, and emphasises it', () => {
    expect(d.uv).toEqual({ value: 6, level: 'high', emphasis: true })
    expect(en.hourly.detail.uvLevels[d.uv.level]).toBe('High')
  })

  it('compares pressure with 12:00 even though 13:00 is the first card of the strip', () => {
    expect(d.pressure).toEqual({ value: 1012, unit: 'hPa', trend: 'falling' })
    expect(en.hourly.detail.trends[d.pressure.trend]).toBe('Falling')
  })

  it('labels 10 km visibility as Clear view', () => {
    expect(d.visibility).toEqual({ value: 10, unit: 'km', level: 'clear' })
    expect(en.hourly.detail.visibilityLevels[d.visibility.level]).toBe('Clear view')
  })

  it('reads rain, wind, humidity and cloud', () => {
    expect(d.rain).toEqual({ value: 1, emphasis: false, amount: null, amountUnit: 'mm' })
    expect(d.wind).toEqual({ value: 14.4, unit: 'kmh', degree: 340, from: 'NNW', gust: 25.2 })
    expect(d.humidity).toEqual({ value: 40, dewPoint: 16.6 })
    expect(d.cloud).toBe(8)
  })

  it('leaves the heat index out in °C, where it is only 0.8° above the temperature', () => {
    expect(d.heatIndex).toBeNull()
  })
})

describe('hourDetail in °F', () => {
  const d = detailAt('2026-11-06', 13, 'fahrenheit')

  it('uses the imperial fields and units', () => {
    expect(d).toMatchObject({ temp: 89.6, feels: 88.5 })
    expect(d.wind).toMatchObject({ value: 8.9, unit: 'mph', gust: 15.7 })
    expect(d.humidity.dewPoint).toBe(62)
    expect(d.visibility).toEqual({ value: 6, unit: 'mi', level: 'clear' })
    expect(d.pressure).toEqual({ value: 29.88, unit: 'inHg', trend: 'falling' })
    expect(d.rain.amountUnit).toBe('in')
  })

  it('shows the heat index, 1.5° above the temperature', () => {
    expect(d.heatIndex).toBe(91.1)
  })
})

describe('hourDetail rain', () => {
  const base = at('2026-11-06', 13)

  it('reports the expected amount only when there is one', () => {
    const wet = { ...base, rain: 60, precipMm: 1.2, precipIn: 0.05 }
    expect(hourDetail(wet, null, 'celsius').rain).toEqual({ value: 60, emphasis: true, amount: 1.2, amountUnit: 'mm' })
    expect(hourDetail(wet, null, 'fahrenheit').rain).toEqual({ value: 60, emphasis: true, amount: 0.05, amountUnit: 'in' })
  })

  it('emphasises from 30%', () => {
    expect(hourDetail({ ...base, rain: 29 }, null, 'celsius').rain.emphasis).toBe(false)
    expect(hourDetail({ ...base, rain: 30 }, null, 'celsius').rain.emphasis).toBe(true)
  })
})

describe('hourDetail heat index threshold', () => {
  const base = at('2026-11-06', 13)

  it('counts exactly 1° despite floating point (91.1 - 90.1)', () => {
    expect(hourDetail({ ...base, tempF: 90.1, heatF: 91.1 }, null, 'fahrenheit').heatIndex).toBe(91.1)
  })

  it('leaves it out just under 1°', () => {
    expect(hourDetail({ ...base, tempF: 90.2, heatF: 91.1 }, null, 'fahrenheit').heatIndex).toBeNull()
  })
})

describe('uvLevel', () => {
  it.each([
    [0, 'low'],
    [2.4, 'low'],
    [2.5, 'moderate'],
    [5.4, 'moderate'],
    [5.6, 'high'],
    [7.4, 'high'],
    [7.6, 'veryHigh'],
    [10.4, 'veryHigh'],
    [10.6, 'extreme']
  ])('daytime UV %s is %s', (uv, level) => {
    expect(uvLevel(uv, true)).toBe(level)
  })

  it('emphasises a value that displays as 6', () => {
    expect(hourDetail({ ...at('2026-11-06', 13), uv: 5.6 }, null, 'celsius').uv.emphasis).toBe(true)
    expect(hourDetail({ ...at('2026-11-06', 13), uv: 5.4 }, null, 'celsius').uv.emphasis).toBe(false)
  })

  it('says none at night, unless the API reports real UV', () => {
    expect(uvLevel(0, false)).toBe('none')
    expect(uvLevel(0.4, false)).toBe('none')
    expect(uvLevel(0.5, false)).toBe('low')
  })
})

describe('visibilityLevel', () => {
  it.each([
    [10, 'clear'],
    [9.9, 'good'],
    [5, 'good'],
    [4.9, 'hazy'],
    [2, 'hazy'],
    [1.9, 'poor']
  ])('%s km is %s', (km, level) => {
    expect(visibilityLevel(km)).toBe(level)
  })
})

describe('pressureTrend', () => {
  it.each([
    [1012, 1014, 'falling'],
    [1013, 1014, 'falling'],
    [1014, 1014, 'steady'],
    [1014.5, 1014, 'steady'],
    [1013.5, 1014, 'steady'],
    [1015, 1014, 'rising']
  ])('%s after %s is %s', (mb, prev, trend) => {
    expect(pressureTrend(mb, prev)).toBe(trend)
  })

  it('has no trend without a previous reading', () => {
    expect(pressureTrend(1012, undefined)).toBeNull()
    expect(hourDetail(at('2026-11-06', 0), null, 'celsius').pressure.trend).toBeNull()
  })
})

describe('previousHour', () => {
  it('finds the hour before, in the same day', () => {
    expect(previousHour(hourly, '2026-11-06', 13).hour).toBe(12)
  })

  it('crosses midnight back into the previous day', () => {
    expect(previousHour(hourly, '2026-11-07', 0)).toMatchObject({ date: '2026-11-06', hour: 23 })
  })

  it('is null before the first hour of the forecast', () => {
    expect(previousHour(hourly, '2026-11-06', 0)).toBeNull()
  })
})
