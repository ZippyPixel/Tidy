import { describe, expect, it } from 'vitest'

import { EPA_LEVELS, UV_LEVELS } from '@/constants/levelColors'
import {
  beaufortLabel,
  dewPointComfort,
  epaCategory,
  humidityColumns,
  lowestVisibility,
  pollutants,
  pressureChange,
  pressureOutlook,
  pressurePosition,
  rainBestChance,
  rainColumns,
  readings,
  uvColumns,
  uvPeak,
  visibilityPosition,
  windColumns
} from '@/utils/conditionDetail'
import { uvLevelOf, visibilityLevel } from '@/utils/hourDetail'
import { hourlyWindow, normalizeHour } from '@/utils/hourly'
import fixture from '@/utils/__tests__/fixtures/weatherapi-forecast.json'

const hourly = Object.fromEntries(fixture.forecast.forecastday.map((d) => [d.date, d.hour.map(normalizeHour)]))
const DATE = '2026-11-06'
const hours = hourlyWindow(hourly, DATE, 13, 24)
const { current } = fixture
const today = fixture.forecast.forecastday[0]

describe('the 13:00 2026-11-06 snapshot', () => {
  it('reads as a light breeze', () => {
    expect(beaufortLabel(current.wind_kph)).toBe('lightBreeze')
  })

  it('feels humid', () => {
    expect(dewPointComfort(current.dewpoint_c)).toBe('humid')
  })

  it('has a clear view', () => {
    expect(visibilityLevel(current.vis_km)).toBe('clear')
  })

  it('is falling by 3 hPa over 3 h', () => {
    expect(pressureOutlook(current.pressure_mb, hours)).toEqual({ trend: 'falling', change: -3 })
  })

  it('has a UV high of 7, High', () => {
    expect(Math.round(today.day.uv)).toBe(7)
    expect(uvLevelOf(today.day.uv).key).toBe('high')
  })

  it('has EPA 2, Moderate', () => {
    expect(epaCategory(current.air_quality['us-epa-index'])).toMatchObject({ index: 2, key: 'moderate' })
  })

  it('finds the strongest UV left today, not the one already past', () => {
    // 6.7 was at noon; the window starts at 1 PM
    expect(uvPeak(hours, DATE)).toMatchObject({ uv: 6, hour: { date: DATE, hour: 13 } })
  })

  it('finds rain unlikely: the best chance stays under 10%', () => {
    expect(rainBestChance(hours)).toMatchObject({ chance: 9, likely: false, hour: { date: '2026-11-07', hour: 6 } })
  })

  it('finds the lowest visibility ahead', () => {
    expect(lowestVisibility(current.vis_km, hours)).toMatchObject({ visKm: 4.9, date: '2026-11-07', hour: 3 })
  })
})

describe('beaufortLabel', () => {
  it.each([
    [0, 'calm'],
    [1, 'lightAir'],
    [6, 'lightBreeze'],
    [12, 'gentleBreeze'],
    [20, 'moderateBreeze'],
    [29, 'freshBreeze'],
    [39, 'strongBreeze'],
    [50, 'nearGale'],
    [62, 'gale'],
    [75, 'strongGale'],
    [89, 'storm'],
    [103, 'violentStorm']
  ])('%d km/h is %s', (kph, label) => {
    expect(beaufortLabel(kph)).toBe(label)
  })
})

describe('dewPointComfort', () => {
  it.each([
    [9.9, 'dry'],
    [10, 'comfortable'],
    [16, 'slightlyHumid'],
    [19, 'humid'],
    [22, 'muggy'],
    [25, 'oppressive']
  ])('%d° is %s', (dew, label) => {
    expect(dewPointComfort(dew)).toBe(label)
  })
})

describe('pressureOutlook', () => {
  const at = (mb) => [{}, {}, {}, { pressureMb: mb }]

  it.each([
    [1014, 'rising', 1],
    [1013.5, 'steady', 0.5],
    [1012.5, 'steady', -0.5],
    [1012, 'falling', -1]
  ])('from 1013 to %d is %s', (mb, trend, change) => {
    expect(pressureOutlook(1013, at(mb))).toEqual({ trend, change })
  })

  it('has no trend without a reading 3 h ahead', () => {
    expect(pressureOutlook(1013, [{}, {}])).toEqual({ trend: null, change: null })
  })
})

describe('pressureChange', () => {
  it('rounds hPa', () => {
    expect(pressureChange(-3.4, 'celsius')).toEqual({ negative: true, value: 3 })
  })

  it('converts to inHg with two decimals', () => {
    expect(pressureChange(-3, 'fahrenheit')).toEqual({ negative: true, value: 0.09 })
    expect(pressureChange(2, 'fahrenheit')).toEqual({ negative: false, value: 0.06 })
  })
})

describe('positions on the scales', () => {
  it('runs the pressure gauge from 970 to 1050 hPa', () => {
    expect(pressurePosition(970)).toBe(0)
    expect(pressurePosition(1010)).toBe(50)
    expect(pressurePosition(1050)).toBe(100)
  })

  it('clamps the pressure gauge', () => {
    expect(pressurePosition(900)).toBe(0)
    expect(pressurePosition(1100)).toBe(100)
  })

  it('runs the visibility scale to 12 km and stops there', () => {
    expect(visibilityPosition(6)).toBe(50)
    expect(visibilityPosition(30)).toBe(100)
  })

  it('centres the EPA marker on its segment', () => {
    expect(epaCategory(1).position).toBeCloseTo(100 / 12)
    expect(epaCategory(6).position).toBeCloseTo(100 - 100 / 12)
  })
})

describe('uvLevelOf', () => {
  it.each([
    [2.4, 'low'],
    [2.5, 'moderate'],
    [5.4, 'moderate'],
    [5.6, 'high'],
    [7.6, 'veryHigh'],
    [10.6, 'extreme'],
    [14, 'extreme']
  ])('rounds %d to %s', (uv, key) => {
    expect(uvLevelOf(uv).key).toBe(key)
  })

  it('walks the five colour-coded levels in order', () => {
    expect(UV_LEVELS.map((level) => level.key)).toEqual(['low', 'moderate', 'high', 'veryHigh', 'extreme'])
  })
})

describe('uvPeak', () => {
  it('has no peak when the sun has gone for the day', () => {
    expect(uvPeak([{ date: DATE, hour: 20, uv: 0 }], DATE)).toBeNull()
  })

  it('ignores tomorrow', () => {
    const later = [
      { date: DATE, hour: 23, uv: 1 },
      { date: '2026-11-07', hour: 12, uv: 9 }
    ]
    expect(uvPeak(later, DATE).uv).toBe(1)
  })
})

describe('rainBestChance', () => {
  it('counts 10% as likely', () => {
    expect(rainBestChance([{ rain: 10 }]).likely).toBe(true)
  })

  it('knows when the best chance is right now', () => {
    expect(rainBestChance([{ rain: 50 }, { rain: 20 }]).isNow).toBe(true)
    expect(rainBestChance([{ rain: 20 }, { rain: 50 }]).isNow).toBe(false)
  })
})

describe('lowestVisibility', () => {
  it('is null when nothing ahead is below the current reading', () => {
    expect(lowestVisibility(5, [{ visKm: 5 }, { visKm: 8 }])).toBeNull()
  })
})

describe('epaCategory', () => {
  it('names all six levels, keeping 3 apart from 4', () => {
    expect([1, 2, 3, 4, 5, 6].map((i) => epaCategory(i).key)).toEqual([
      'good',
      'moderate',
      'sensitive',
      'unhealthy',
      'veryUnhealthy',
      'hazardous'
    ])
  })

  it('carries the level colour', () => {
    expect(epaCategory(2).color).toBe(EPA_LEVELS[1].color)
  })

  it('clamps out-of-range numbers', () => {
    expect(epaCategory(0).index).toBe(1)
    expect(epaCategory(9).index).toBe(6)
  })

  it('is null without a reading, rather than claiming Good', () => {
    expect(epaCategory(undefined)).toBeNull()
  })
})

describe('pollutants', () => {
  it('lists the six in order, tenths below 100 and whole numbers from it', () => {
    expect(pollutants(current.air_quality)).toEqual([
      { name: 'PM2.5', value: 40 },
      { name: 'PM10', value: 43.5 },
      { name: 'O₃', value: 184 },
      { name: 'NO₂', value: 5.7 },
      { name: 'SO₂', value: 11 },
      { name: 'CO', value: 407 }
    ])
  })

  it('keeps a missing pollutant as null', () => {
    expect(pollutants({ pm2_5: 1 })[1].value).toBeNull()
  })
})

describe('bar strips', () => {
  it('makes 12 columns from 24 hours, Now first', () => {
    const columns = humidityColumns(hours)
    expect(columns).toHaveLength(12)
    expect(columns[0]).toMatchObject({ hour: 13, isNow: true, value: 40, height: 40 })
    expect(columns[1]).toMatchObject({ hour: 15, isNow: false })
  })

  it('scales wind to the strongest column and follows the unit', () => {
    const kph = windColumns(hours, 'celsius')
    const mph = windColumns(hours, 'fahrenheit')
    expect(kph[0]).toMatchObject({ value: 14, degree: 340 })
    expect(mph[0].value).toBe(9)
    expect(Math.max(...kph.map((c) => c.height))).toBe(100)
  })

  it('takes the higher chance of the two hours in a slot', () => {
    const slots = rainColumns(
      [
        { date: DATE, hour: 0, rain: 10, precipMm: 0, cloud: 0, isDay: true },
        { date: DATE, hour: 1, rain: 35, precipMm: 0, cloud: 0, isDay: true }
      ]
    )
    expect(slots[0]).toMatchObject({ value: 35, emphasis: true, icon: 'sun' })
  })

  it('emphasises a chance from 30%', () => {
    const at = (rain) => rainColumns([{ date: DATE, hour: 0, rain, precipMm: 0, cloud: 0, isDay: true }])[0].emphasis
    expect(at(29)).toBe(false)
    expect(at(30)).toBe(true)
  })

  it.each([
    [{ rain: 40 }, 'rain'],
    [{ precipMm: 0.2 }, 'rain'],
    [{ cloud: 60 }, 'cloud'],
    [{}, 'sun'],
    [{ isDay: false }, 'moon']
  ])('picks the condition icon for %o', (patch, icon) => {
    const hour = { date: DATE, hour: 0, rain: 0, precipMm: 0, cloud: 0, isDay: true, ...patch }
    expect(rainColumns([hour])[0].icon).toBe(icon)
  })

  it('draws no bar for no rain, and a visible one for very little', () => {
    const at = (precipMm) => rainColumns([{ date: DATE, hour: 0, rain: 0, precipMm, cloud: 0, isDay: true }])[0].height
    expect(at(0)).toBeNull()
    expect(at(0.01)).toBe(6)
  })

  it('colours UV bars by level and caps them at 11', () => {
    const at = (uv) => uvColumns([{ date: DATE, hour: 12, uv, isDay: true }])[0]
    expect(at(6.7)).toMatchObject({ value: 7, color: UV_LEVELS[2].color })
    expect(at(14).height).toBe(100)
  })
})

describe('readings', () => {
  it('uses metric fields in °C', () => {
    expect(readings(current, today.day, 'celsius')).toEqual({
      speed: 11,
      gust: 19,
      maxWind: 15,
      speedUnit: 'kmh',
      precip: 0,
      precipUnit: 'mm',
      visibility: 10,
      visibilityUnit: 'km',
      pressure: 1014,
      pressureUnit: 'hPa',
      dewPoint: 19
    })
  })

  it('uses the _f, mph, miles, inches and inHg fields in °F', () => {
    expect(readings(current, today.day, 'fahrenheit')).toEqual({
      speed: 7,
      gust: 12,
      maxWind: 9,
      speedUnit: 'mph',
      precip: 0,
      precipUnit: 'in',
      visibility: 6,
      visibilityUnit: 'mi',
      pressure: 29.94,
      pressureUnit: 'inHg',
      dewPoint: 67
    })
  })
})
