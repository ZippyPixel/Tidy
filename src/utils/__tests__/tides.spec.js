import { describe, expect, it } from 'vitest'
import {
  chartModel,
  chartWindow,
  creditParts,
  dayIndexAt,
  durationParts,
  extremeAfter,
  extremesOnDay,
  gaugeFraction,
  gaugeWaterPath,
  haversineKm,
  isInland,
  isRising,
  levelAt,
  metresToUnit,
  nextDayFlagged,
  nextExtreme,
  nextSyzygy,
  offsetParts,
  sparkPath,
  weekRows
} from '@/utils/tides'
import { dateInZone } from '@/utils/tideTime'
import sample from './fixtures/tides-sample.json'

const t = sample.stations[sample.defaultStation]
const now = sample.now
const zone = t.station.timezone
const clock = (epoch) =>
  new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit', hour12: true }).format(
    (Math.round(epoch / 60) * 60) * 1000
  )

describe('Charchanga at 2026-11-06 13:01 Asia/Dhaka', () => {
  it('is falling at about 2.86 m', () => {
    expect(t.station.name).toBe('Charchanga')
    expect(isRising(t, now)).toBe(false)
    expect(levelAt(t, now)).toBeCloseTo(2.86, 2)
  })

  it('next low is 6:40 PM at 0.77 m, in 5h 39m', () => {
    const next = nextExtreme(t, now)
    expect(next.high).toBe(false)
    expect(clock(next.time).replace(/\s/, ' ')).toBe('6:40 PM')
    expect(next.level).toBeCloseTo(0.77, 2)
    expect(durationParts(next.time - now)).toEqual({ hours: 5, minutes: 39 })
  })

  it('then high at 12:43 AM', () => {
    const after = extremeAfter(t, nextExtreme(t, now))
    expect(after.high).toBe(true)
    expect(clock(after.time).replace(/\s/, ' ')).toBe('12:43 AM')
  })

  it('next spring is Tue Nov 10 and next neap Thu Nov 19', () => {
    const today = dayIndexAt(t, now)
    const spring = t.days[nextDayFlagged(t, 'spring', today)].date
    const neap = t.days[nextDayFlagged(t, 'neap', today)].date
    expect(spring).toBe('2026-11-10')
    expect(neap).toBe('2026-11-19')
    expect(new Date(`${spring}T12:00Z`).getUTCDay()).toBe(2)
    expect(new Date(`${neap}T12:00Z`).getUTCDay()).toBe(4)
  })

  it('today is the second summary, with its highs and lows in order', () => {
    const today = dayIndexAt(t, now)
    expect(today).toBe(1)
    expect(t.days[today].date).toBe(dateInZone(now, zone))
    const extremes = extremesOnDay(t, today)
    expect(extremes.map((e) => e.high)).toEqual([true, false, true, false])
    expect(extremes[3].time).toBe(nextExtreme(t, now).time)
  })
})

describe('levelAt', () => {
  it('interpolates between the 10-minute points', () => {
    const { start, stepSec, levels } = t.timeline
    expect(levelAt(t, start)).toBe(levels[0] / 100)
    expect(levelAt(t, start + stepSec / 2)).toBeCloseTo((levels[0] + levels[1]) / 200, 5)
  })

  it('holds at the ends instead of running off the timeline', () => {
    const { start, stepSec, levels } = t.timeline
    expect(levelAt(t, start - 86400)).toBe(levels[0] / 100)
    expect(levelAt(t, start + stepSec * levels.length * 2)).toBe(levels[levels.length - 1] / 100)
  })
})

describe('units', () => {
  it('converts to the chosen unit', () => {
    expect(metresToUnit(2, 'celsius')).toBe(2)
    expect(metresToUnit(1, 'fahrenheit')).toBeCloseTo(3.281, 3)
  })
})

describe('durationParts', () => {
  it('rounds to the minute and never goes negative', () => {
    expect(durationParts(90)).toEqual({ hours: 0, minutes: 2 })
    expect(durationParts(3600)).toEqual({ hours: 1, minutes: 0 })
    expect(durationParts(-100)).toEqual({ hours: 0, minutes: 0 })
  })
})

describe('gauge', () => {
  it('sits between today’s low and high, and never empties', () => {
    const fraction = gaugeFraction(t, now)
    expect(fraction).toBeGreaterThan(0.06)
    expect(fraction).toBeLessThanOrEqual(0.96)
    expect(gaugeWaterPath(0.5, 32, 132)).toContain('M0,66.0')
    expect(gaugeWaterPath(0.5, 32, 132)).toMatch(/L32,132 L0,132 Z$/)
  })
})

describe('nextDayFlagged', () => {
  it('reports -1 when none is left', () => {
    expect(nextDayFlagged({ days: [{ spring: false }] }, 'spring', 0)).toBe(-1)
  })
})

describe('nextSyzygy', () => {
  it('skips the quarter moons', () => {
    const next = nextSyzygy(t, now)
    expect([0, 2]).toContain(next.quarter)
    expect(next.t).toBeGreaterThan(now)
  })
})

describe('station distance', () => {
  it('measures great-circle km', () => {
    expect(Math.round(haversineKm(sample.location, t.station))).toBe(189)
  })

  it('calls 50 km or more inland, and an unknown distance not', () => {
    expect(isInland({ distanceKm: 189 })).toBe(true)
    expect(isInland({ distanceKm: 50 })).toBe(true)
    expect(isInland({ distanceKm: 49 })).toBe(false)
    expect(isInland({ distanceKm: null })).toBe(false)
  })
})

describe('offsetParts', () => {
  it('splits a UTC offset', () => {
    expect(offsetParts(360)).toEqual({ hours: 6, minutes: 0, negative: false })
    expect(offsetParts(-210)).toEqual({ hours: 3, minutes: 30, negative: true })
  })
})

describe('weekRows', () => {
  const rows = weekRows(t, now)

  it('has seven days, today first', () => {
    expect(rows).toHaveLength(7)
    expect(rows[0].date).toBe('2026-11-06')
    expect(rows[0].isToday).toBe(true)
    expect(rows[1].isToday).toBe(false)
  })

  it('marks the spring day from the data', () => {
    expect(rows.find((r) => r.spring).date).toBe('2026-11-10')
    expect(rows.some((r) => r.neap)).toBe(false)
  })

  it('places every bar on one shared scale', () => {
    for (const r of rows) {
      expect(r.left).toBeGreaterThanOrEqual(0)
      expect(r.right).toBeGreaterThanOrEqual(0)
      expect(r.left + r.right).toBeLessThan(100)
    }
    expect(Math.min(...rows.map((r) => r.left))).toBe(0)
    expect(Math.min(...rows.map((r) => r.right))).toBe(0)
  })

  it('draws a spark curve for a row', () => {
    expect(sparkPath(t, rows[0].index, 0, 3).startsWith('M0.0,')).toBe(true)
  })
})

describe('chart window', () => {
  it('Day view is the station’s calendar day, stepping from yesterday', () => {
    expect(chartWindow(t, { view: 'day', day: 0, now }).from).toBe(t.days[1].start)
    expect(chartWindow(t, { view: 'day', day: -1, now }).from).toBe(t.days[0].start)
    expect(chartWindow(t, { view: 'day', day: 6, now }).from).toBe(t.days[7].start)
  })

  it('Week view runs today to today+6', () => {
    const { from, to } = chartWindow(t, { view: 'week', now })
    expect(from).toBe(t.days[1].start)
    expect(to).toBe(t.days[8].start)
  })

  it('the card starts three hours ago and spans a day', () => {
    const { from, to } = chartWindow(t, { view: 'card', now })
    expect(from).toBe(now - 3 * 3600)
    expect(to - from).toBe(24 * 3600)
  })

  it('a daylight saving day keeps its 25 hours', () => {
    const start = 1793088000
    const dst = {
      ...t,
      timeline: { ...t.timeline, start: start - 86400 },
      days: [{ start, date: '2026-11-01' }, { start: start + 25 * 3600, date: '2026-11-02' }]
    }
    const { from, to } = chartWindow(dst, { view: 'day', day: 0, now: start + 3600 })
    expect(to - from).toBe(25 * 3600)
  })
})

describe('chartModel', () => {
  const day = chartModel(t, { view: 'day', day: 0, now })

  it('keeps the same level scale on every day of the week', () => {
    const yOf = (offset) => {
      const model = chartModel(t, { view: 'day', day: offset, now })
      return model.grid.map((g) => g.y)
    }
    expect(yOf(-1)).toEqual(yOf(0))
    expect(yOf(6)).toEqual(yOf(0))
  })

  it('draws the curve and closes the area in the 1000 x 100 box', () => {
    expect(day.line.startsWith('M0.0,')).toBe(true)
    expect(day.area).toMatch(/L1000,100 L0,100 Z$/)
  })

  it('puts now where the clock is, and only on today', () => {
    expect(day.now.x).toBeCloseTo(((now - day.from) / (day.to - day.from)) * 100, 3)
    expect(chartModel(t, { view: 'day', day: 1, now }).now).toBeNull()
  })

  it('has today’s four highs and lows, all on the chart', () => {
    expect(day.marks.map((m) => m.high)).toEqual([true, false, true, false])
    for (const m of day.marks) {
      expect(m.x).toBeGreaterThan(0)
      expect(m.x).toBeLessThan(100)
      expect(m.y).toBeGreaterThan(0)
      expect(m.y).toBeLessThan(100)
    }
  })

  it('bands the night from sunset to the next sunrise, within the chart', () => {
    expect(day.nights.length).toBeGreaterThanOrEqual(2)
    for (const n of day.nights) {
      expect(n.x).toBeGreaterThanOrEqual(0)
      expect(n.x + n.width).toBeLessThanOrEqual(1000.001)
    }
  })

  it('skips a night the sun never ends, as in the polar summer', () => {
    const polar = { ...t, days: t.days.map((d) => ({ ...d, sunset: null, sunrise: null })) }
    expect(chartModel(polar, { view: 'day', day: 0, now }).nights).toEqual([])
  })

  it('separates days only in the views that span them', () => {
    expect(day.separators).toEqual([])
    expect(chartModel(t, { view: 'week', now }).separators).toHaveLength(6)
  })

  it('labels the level scale in whole steps of the chosen unit', () => {
    expect(day.grid.length).toBeGreaterThanOrEqual(4)
    expect(day.grid.every((g) => Number.isInteger(g.value * 2))).toBe(true)
    expect(day.grid[0].value).toBeGreaterThan(day.grid[1].value)
    const feet = chartModel(t, { view: 'day', day: 0, now, unit: 'fahrenheit' })
    expect(feet.grid.every((g) => Number.isInteger(g.value))).toBe(true)
    expect(chartModel(t, { view: 'card', now }).grid).toEqual([])
  })

  it('reads a scrubbed time back to the curve', () => {
    const scrub = day.at(day.from + 3600)
    expect(scrub.x).toBeCloseTo((3600 / (day.to - day.from)) * 100, 3)
  })
})

describe('creditParts', () => {
  it('turns URLs into links, leaving their punctuation out', () => {
    expect(creditParts('Slackwater database (https://example.org/a). Source: https://doi.org/10.17882/109129.')).toEqual([
      { text: 'Slackwater database (' },
      { text: 'https://example.org/a', href: 'https://example.org/a' },
      { text: '). Source: ' },
      { text: 'https://doi.org/10.17882/109129', href: 'https://doi.org/10.17882/109129' },
      { text: '.' }
    ])
  })

  it('leaves plain text alone', () => {
    expect(creditParts('NOAA')).toEqual([{ text: 'NOAA' }])
  })
})
