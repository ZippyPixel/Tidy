import { describe, expect, it } from 'vitest'
import * as A from 'astronomy-engine'
import {
  asrAltitude,
  atMinute,
  compassPoint,
  createSky,
  dayStart,
  daysBetween,
  durationParts,
  formatT,
  minuteOfDay,
  nextDayStart,
  parseT,
  phaseKey,
  roundToMinute,
  sameClockIn,
  shiftDays
} from '@/utils/sky'

const clock = (t, tz) =>
  t == null
    ? null
    : new Date(roundToMinute(t)).toLocaleTimeString('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: '2-digit'
      })

describe('the place clock', () => {
  const tz = 'Asia/Dhaka'

  it('round-trips the URL time in the place’s zone', () => {
    const t = parseT('2026-11-24T21:30', tz)
    expect(t).toBe(Date.UTC(2026, 10, 24, 15, 30))
    expect(formatT(t, tz)).toBe('2026-11-24T21:30')
    expect(parseT('2026-13-01T00:00', tz)).toBeNull()
    expect(parseT('nope', tz)).toBeNull()
  })

  it('sets a minute of the local day and steps days at the same clock time', () => {
    const t = parseT('2026-11-16T15:48', tz)
    expect(minuteOfDay(t, tz)).toBe(15 * 60 + 48)
    expect(formatT(atMinute(t, tz, 0), tz)).toBe('2026-11-16T00:00')
    expect(formatT(atMinute(t, tz, 5000), tz)).toBe('2026-11-16T23:59')
    expect(formatT(shiftDays(t, tz, 1), tz)).toBe('2026-11-17T15:48')
    expect(daysBetween(dayStart(t, tz), shiftDays(t, tz, 5), tz)).toBe(5)
  })

  it('keeps the chosen clock time when the place changes', () => {
    const t = parseT('2026-11-16T21:00', tz)
    expect(formatT(sameClockIn(t, tz, 'Europe/Oslo'), 'Europe/Oslo')).toBe('2026-11-16T21:00')
  })

  it('handles daylight saving days of 23 and 25 hours', () => {
    const la = 'America/Los_Angeles'
    const spring = dayStart(parseT('2026-03-08T12:00', la), la)
    expect((nextDayStart(spring, la) - spring) / 36e5).toBe(23)
    const fall = dayStart(parseT('2026-11-01T12:00', la), la)
    expect((nextDayStart(fall, la) - fall) / 36e5).toBe(25)
    // stepping across the change keeps the wall clock
    expect(formatT(shiftDays(parseT('2026-03-07T09:00', la), la, 1), la)).toBe('2026-03-08T09:00')
    expect(formatT(atMinute(fall, la, 23 * 60), la)).toBe('2026-11-01T23:00')
  })
})

describe('small helpers', () => {
  it('names compass points and phases', () => {
    expect(compassPoint(0)).toBe('N')
    expect(compassPoint(247.5)).toBe('WSW')
    expect(compassPoint(359)).toBe('N')
    expect(phaseKey(78)).toBe('waxingCrescent')
    expect(phaseKey(180)).toBe('fullMoon')
  })

  it('puts Asr at the shadow length', () => {
    // sun overhead at noon: a shadow of 1× the height means 45°
    expect(asrAltitude(90, 1)).toBeCloseTo(45, 6)
    expect(asrAltitude(90, 2)).toBeCloseTo(26.565, 2)
  })

  it('rounds durations to minutes', () => {
    expect(durationParts(658.96 * 6e4)).toEqual({ h: 10, m: 59 })
  })
})

describe('Joar Sahara, 2026-11-16 3:48 PM', () => {
  const tz = 'Asia/Dhaka'
  const sky = createSky(A, { lat: 23.817, lon: 90.417, tz })
  const t = parseT('2026-11-16T15:48', tz)
  const ds = dayStart(t, tz)
  const day = sky.day(ds)
  const now = sky.instant(t)

  it('has the sun’s day', () => {
    expect(clock(day.sun.rise, tz)).toBe('6:13 AM')
    expect(clock(day.sun.noon.t, tz)).toBe('11:43 AM')
    expect(clock(day.sun.set, tz)).toBe('5:12 PM')
    expect(durationParts(day.sun.set - day.sun.rise)).toEqual({ h: 10, m: 59 })
    expect(day.pts).toHaveLength(145)
  })

  it('places the sun and moon', () => {
    expect(Math.round(now.sun.alt)).toBe(17)
    expect(compassPoint(now.sun.az)).toBe('WSW')
    expect(Math.round(now.moon.alt)).toBe(42)
    expect(compassPoint(now.moon.az)).toBe('SSE')
    expect(Math.round(now.lit * 100)).toBe(40)
    expect(phaseKey(now.phase)).toBe('waxingCrescent')
    expect(Math.round(now.elongation)).toBe(78)
  })

  it('has the moon’s day and the next full moon', () => {
    expect(clock(day.moon.rise, tz)).toBe('11:44 AM')
    expect(clock(day.moon.set, tz)).toBe('10:57 PM')
    const full = sky.ahead(ds).quarters.find((q) => q.quarter === 2)
    expect(formatT(full.t, tz).slice(0, 10)).toBe('2026-11-24')
  })

  it('has prayer times (Karachi, Hanafi and Standard)', () => {
    const p = sky.prayer(ds, 0, true)
    expect(clock(p.fajr, tz)).toBe('4:55 AM')
    expect(clock(p.sunrise, tz)).toBe('6:13 AM')
    expect(clock(p.dhuhr, tz)).toBe('11:43 AM')
    expect(clock(p.asr, tz)).toBe('3:37 PM')
    expect(clock(p.maghrib, tz)).toBe('5:12 PM')
    expect(clock(p.isha, tz)).toBe('6:31 PM')
    expect(clock(sky.prayer(ds, 0, false).asr, tz)).toBe('2:50 PM')
  })

  it('has a coming-up list and a calendar month', () => {
    const ahead = sky.ahead(ds)
    expect(ahead.season.key).toBe('decemberSolstice')
    expect(ahead.perigee.t).toBeGreaterThan(ds)
    expect(ahead.apogee.t).toBeGreaterThan(ds)
    const showers = sky.showers(ds)
    expect(showers.map((s) => s.key)).toEqual(['leonids', 'geminids'])
    const cells = sky.month(2026, 10)
    expect(cells.length % 7).toBe(0)
    expect(cells.find((c) => c.mo === 10 && c.d === 1)).toBeTruthy()
  })

  it('caches per day', () => {
    expect(sky.day(ds)).toBe(day)
  })
})

describe('Tromsø polar night, 2026-12-03', () => {
  const tz = 'Europe/Oslo'
  const sky = createSky(A, { lat: 69.65, lon: 18.96, tz })
  const ds = dayStart(parseT('2026-12-03T12:00', tz), tz)

  it('has no sunrise or sunset and shows no Maghrib or Asr', () => {
    const day = sky.day(ds)
    expect(day.sun.rise).toBeNull()
    expect(day.sun.set).toBeNull()
    const p = sky.prayer(ds)
    expect(p.sunrise).toBeNull()
    expect(p.maghrib).toBeNull()
    expect(p.asr).toBeNull()
  })
})

describe('Sydney in daylight saving, 2026-12-21', () => {
  const tz = 'Australia/Sydney'
  const sky = createSky(A, { lat: -33.87, lon: 151.21, tz })
  const ds = dayStart(parseT('2026-12-21T12:00', tz), tz)

  it('reads sunrise and sunset on the summer clock', () => {
    const day = sky.day(ds)
    expect(clock(day.sun.rise, tz)).toBe('5:41 AM')
    expect(clock(day.sun.set, tz)).toBe('8:05 PM')
  })
})
