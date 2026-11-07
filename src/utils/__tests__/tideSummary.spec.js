import { describe, expect, it } from 'vitest'
import {
  datumRanges,
  dayRange,
  moonPhase,
  parseCoordinates,
  parseDays,
  skyOnDay,
  springNeap,
  tideType
} from '../../../server/utils/tideSummary'

const c = (name, amplitude) => ({ name, amplitude })

describe('tideType', () => {
  it.each([
    [[c('M2', 1), c('S2', 0.5), c('K1', 0.1), c('O1', 0.1)], 'semidiurnal'],
    [[c('M2', 1), c('K1', 0.5), c('O1', 0.5)], 'mixedSemidiurnal'],
    [[c('M2', 0.5), c('K1', 0.5), c('O1', 0.5)], 'mixedDiurnal'],
    [[c('M2', 0.1), c('K1', 0.5), c('O1', 0.5)], 'diurnal']
  ])('names the form factor', (constituents, expected) => {
    expect(tideType(constituents)).toBe(expected)
  })

  it('does not divide by zero', () => {
    expect(tideType([])).toBe('semidiurnal')
    expect(tideType([c('K1', 1)])).toBe('diurnal')
  })
})

describe('moonPhase', () => {
  it('names the quarter on its day, otherwise the stretch', () => {
    expect(moonPhase(10, 0)).toBe('new')
    expect(moonPhase(180, 2)).toBe('full')
    expect(moonPhase(45)).toBe('waxingCrescent')
    expect(moonPhase(135)).toBe('waxingGibbous')
    expect(moonPhase(225)).toBe('waningGibbous')
    expect(moonPhase(324)).toBe('waningCrescent')
  })
})

describe('dayRange', () => {
  const e = (t, level, high) => ({ t, level, high })

  it('is the highest high minus the lowest low inside the day', () => {
    expect(dayRange([e(10, 3, true), e(20, 1, false), e(30, 2.5, true), e(40, 0.5, false)], 0, 100)).toBe(2.5)
  })

  it('borrows a missing low from within 6 h outside the day', () => {
    expect(dayRange([e(-3600, 0.5, false), e(10, 3, true)], 0, 100)).toBe(2.5)
  })

  it('does not reach further than 6 h, and has no range without both', () => {
    expect(dayRange([e(-30000, 0.5, false), e(10, 3, true)], 0, 100)).toBe(0)
  })
})

describe('springNeap', () => {
  const ranges = [2, 2.2, 2.5, 3, 2.4, 2, 1.5, 1, 1.4, 2]

  it('marks the biggest and smallest day within three days', () => {
    expect(springNeap(ranges, 3)).toEqual({ spring: true, neap: false })
    expect(springNeap(ranges, 7)).toEqual({ spring: false, neap: true })
    expect(springNeap(ranges, 4)).toEqual({ spring: false, neap: false })
  })
})

describe('skyOnDay', () => {
  const start = Date.UTC(2026, 10, 5, 18) / 1000

  it('has a sunrise and sunset through the day', () => {
    const sky = skyOnDay(start, start + 86400, 22.22, 91.05, [])
    expect(sky.sunrise).toBeGreaterThan(start)
    expect(sky.sunset).toBeGreaterThan(sky.sunrise)
    expect(sky.moon.phase).toBe('waningCrescent')
  })

  it('reports null for the polar night', () => {
    const polar = Date.UTC(2026, 11, 21) / 1000
    const sky = skyOnDay(polar, polar + 86400, 78.2, 15.6, [])
    expect(sky.sunrise).toBeNull()
    expect(sky.sunset).toBeNull()
  })
})

describe('datumRanges', () => {
  it('leaves out a range the station has no datums for', () => {
    expect(datumRanges({ MHW: 3, MLW: 1, MHWS: 3.5 })).toEqual({ meanRange: 2, springRange: null })
    expect(datumRanges(undefined)).toEqual({ meanRange: null, springRange: null })
  })
})

describe('request parsing', () => {
  it('rounds good coordinates and refuses bad ones', () => {
    expect(parseCoordinates('23.8171', '90.4169')).toEqual({ lat: 23.82, lon: 90.42 })
    expect(parseCoordinates('0', '0')).toEqual({ lat: 0, lon: 0 })
    expect(parseCoordinates('91', '0')).toBeNull()
    expect(parseCoordinates('0', '181')).toBeNull()
    expect(parseCoordinates('abc', '0')).toBeNull()
    expect(parseCoordinates('', '')).toBeNull()
    expect(parseCoordinates(undefined, '0')).toBeNull()
  })

  it('clamps days', () => {
    expect(parseDays(undefined)).toBe(7)
    expect(parseDays('3')).toBe(3)
    expect(parseDays('999')).toBe(14)
    expect(parseDays('0')).toBe(7)
    expect(parseDays('x')).toBe(7)
  })
})
