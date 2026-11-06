import { describe, it, expect } from 'vitest'
import {
  parseMinutes,
  formatAstroTime,
  celestialWindow,
  curveDepth,
  curvePath,
  moonLitPath,
  moonPhase,
  splitDuration,
  zoneOffsetMs,
  locationClock,
  sunState,
  moonState
} from '@/utils/astro'

describe('parseMinutes', () => {
  it('parses AM/PM times to minutes since midnight', () => {
    expect(parseMinutes('05:29 AM')).toBe(5 * 60 + 29)
    expect(parseMinutes('6:23 PM')).toBe(18 * 60 + 23)
    expect(parseMinutes('12:00 AM')).toBe(0)
    expect(parseMinutes('12:30 PM')).toBe(12 * 60 + 30)
  })

  it('returns null for missing/unparseable values', () => {
    expect(parseMinutes('No moonrise')).toBeNull()
    expect(parseMinutes('')).toBeNull()
    expect(parseMinutes(undefined)).toBeNull()
  })
})



describe('formatAstroTime', () => {
  it('formats with the given locale, Bengali using Bengali digits', () => {
    expect(formatAstroTime('05:29 AM', 'en-US')).toBe('5:29 AM')
    expect(formatAstroTime('05:29 AM', 'bn-BD')).toContain('৫')
  })

  it('falls back to -- for missing values', () => {
    expect(formatAstroTime('No moonset', 'en-US')).toBe('--')
  })
})

describe('V3 day curve', () => {
  it('centres the window on the middle of the span', () => {
    // sun 06:00 -> 18:00, now 12:00
    const w = celestialWindow(360, 1080, 720)
    expect(w.rise).toBeCloseTo(0.25, 5)
    expect(w.set).toBeCloseTo(0.75, 5)
    expect(w.now).toBeCloseTo(0.5, 5)
    expect(w.up).toBe(true)
  })

  it('handles a moon that sets tomorrow and clamps now', () => {
    const w = celestialWindow(17 * 60, 28 * 60, 10 * 60)
    expect(w.up).toBe(false)
    expect(w.now).toBeGreaterThanOrEqual(0)
    expect(w.set - w.rise).toBeCloseTo(11 / 24, 5)
  })

  it('peaks in the middle and touches bottom at the edges', () => {
    expect(curveDepth(0.5)).toBeCloseTo(0, 5)
    expect(curveDepth(0)).toBeCloseTo(1, 5)
    expect(curveDepth(1)).toBeCloseTo(1, 5)
  })

  it('samples a path inside the box', () => {
    const d = curvePath(0, 1, { width: 1000, height: 100, top: 20, bottom: 8 })
    expect(d.startsWith('M0.0,92.0')).toBe(true)
    expect(d).toContain('L500.0,20.0')
    expect(d.endsWith('L1000.0,92.0')).toBe(true)
  })
})

describe('moon phase', () => {
  it('maps API phase names to i18n keys and side', () => {
    expect(moonPhase('Waxing Gibbous', '97')).toEqual({ key: 'waxingGibbous', illumination: 97, k: 0.97, waxing: true })
    expect(moonPhase('Last Quarter', 52)).toMatchObject({ key: 'lastQuarter', waxing: false })
    expect(moonPhase('Something else', 'x')).toMatchObject({ key: null, illumination: 0 })
  })

  it('draws a closed lit path', () => {
    expect(moonLitPath(9, 0.5, true)).toMatch(/^M0,-9 A9,9 0 0 1 0,9 A0.00,9 0 0 \d 0,-9 Z$/)
  })
})

describe('location clock', () => {
  it('derives the zone offset from localtime and epoch', () => {
    // 2026-07-15 15:52 in Dhaka (UTC+6) is 09:52 UTC
    const epoch = Date.UTC(2026, 6, 15, 9, 52, 59) / 1000
    expect(zoneOffsetMs('2026-07-15 15:52', epoch)).toBe(6 * 3600000)
    expect(zoneOffsetMs('2026-07-15 5:52', Date.UTC(2026, 6, 14, 23, 52) / 1000)).toBe(6 * 3600000)
    expect(zoneOffsetMs('', epoch)).toBeNull()
  })

  it('reads the location date and time, not the browser one', () => {
    const now = Date.UTC(2026, 6, 15, 20, 30)
    expect(locationClock(6 * 3600000, now)).toEqual({ date: '2026-07-16', hour: 2, minutes: 150 })
    expect(locationClock(-5 * 3600000, now)).toEqual({ date: '2026-07-15', hour: 15, minutes: 930 })
  })

  it('splits durations', () => {
    expect(splitDuration(134)).toEqual({ hours: 2, minutes: 14 })
    expect(splitDuration(-5)).toEqual({ hours: 0, minutes: 0 })
  })
})

describe('sunState', () => {
  const sun = { rise: 348, set: 1071 } // 5:48 AM, 5:51 PM

  it('counts down to sunset during the day', () => {
    const s = sunState({ ...sun, now: 937 })
    expect(s.status).toEqual({ key: 'setsIn', minutes: 134 })
    expect(s.daylight).toBe(723)
    expect(s.window.up).toBe(true)
  })

  it('counts down to the next sunrise after dark', () => {
    expect(sunState({ ...sun, now: 1360, nextRise: 349 }).status).toEqual({ key: 'risesIn', minutes: 429 })
    expect(sunState({ ...sun, now: 200 }).status).toEqual({ key: 'risesIn', minutes: 148 })
  })

  it('has no countdown for another day', () => {
    expect(sunState({ ...sun }).status).toBeNull()
    expect(sunState({ ...sun }).live).toBe(false)
  })
})

describe('moonState', () => {
  it('moves a set before the rise to tomorrow', () => {
    // rises 5:04 PM, sets 4:27 AM; it is 3:37 PM
    const m = moonState({ rise: 1024, set: 267, now: 937 })
    expect(m.set).toEqual({ minutes: 267 + 1440, day: 'tomorrow', known: true })
    expect(m.status).toEqual({ key: 'risesIn', minutes: 87 })
  })

  it('treats a morning moon as up since yesterday', () => {
    const m = moonState({ rise: 1024, set: 267, now: 120 })
    expect(m.rise.day).toBe('yesterday')
    expect(m.rise.known).toBe(false)
    expect(m.window.up).toBe(true)
    expect(m.status).toEqual({ key: 'setsIn', minutes: 147 })
  })

  it('notes a missing moonrise with tomorrow’s rise', () => {
    const m = moonState({ rise: null, set: 800, now: 900, nextRise: 14 })
    expect(m.note).toEqual({ key: 'noMoonriseNext', time: 14 })
    expect(m.rise.known).toBe(false)
    expect(m.status).toEqual({ key: 'risesIn', minutes: 14 + 1440 - 900 })
  })

  it('takes a missing moonset from tomorrow', () => {
    const m = moonState({ rise: 1400, set: null, now: 600, nextSet: 690 })
    expect(m.set).toEqual({ minutes: 690 + 1440, day: 'tomorrow', known: true })
  })
})
