import { describe, expect, it } from 'vitest'
import { addDays, dateInZone, hourInZone, hourTicks, zonedMidnight, zoneOffsetMin } from '@/utils/tideTime'

const NOW = 1793948479 // 2026-11-06 13:01 Asia/Dhaka

describe('station-zone calendar', () => {
  it('reads the date and offset in the zone, not the runner’s', () => {
    expect(dateInZone(NOW, 'Asia/Dhaka')).toBe('2026-11-06')
    expect(dateInZone(NOW, 'Pacific/Pago_Pago')).toBe('2026-11-05')
    expect(zoneOffsetMin(NOW, 'Asia/Dhaka')).toBe(360)
    expect(zoneOffsetMin(NOW, 'Asia/Kolkata')).toBe(330)
  })

  it('adds days across a month and a year', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
  })

  it('finds midnight in the zone', () => {
    expect(zonedMidnight('2026-11-06', 'Asia/Dhaka')).toBe(Date.UTC(2026, 10, 5, 18) / 1000)
  })

  it('gives daylight saving days their real length', () => {
    const zone = 'America/Los_Angeles'
    const hours = (date) => (zonedMidnight(addDays(date, 1), zone) - zonedMidnight(date, zone)) / 3600
    expect(hours('2026-03-08')).toBe(23)
    expect(hours('2026-11-01')).toBe(25)
    expect(hours('2026-11-02')).toBe(24)
  })

  it('reads the hour on the zone’s clock', () => {
    expect(hourInZone(NOW, 'Asia/Dhaka')).toBe(13)
  })
})

describe('hourTicks', () => {
  const day = zonedMidnight('2026-11-06', 'Asia/Dhaka')

  it('marks every 6 h through a day', () => {
    expect(hourTicks(day, day + 86400, 'Asia/Dhaka', 6).map((t) => t.hour)).toEqual([0, 6, 12, 18, 0])
  })

  it('starts at the next whole hour', () => {
    expect(hourTicks(NOW, NOW + 3 * 3600, 'Asia/Dhaka', 1).map((t) => t.hour)).toEqual([14, 15, 16])
  })

  it('stays on whole hours in a half-hour zone', () => {
    const ticks = hourTicks(NOW, NOW + 6 * 3600, 'Asia/Kolkata', 6)
    expect(ticks.map((t) => t.hour)).toEqual([18])
    expect(zoneOffsetMin(ticks[0].time, 'Asia/Kolkata')).toBe(330)
  })

  it('follows the clock through a 25-hour day', () => {
    const zone = 'America/Los_Angeles'
    const start = zonedMidnight('2026-11-01', zone)
    const ticks = hourTicks(start, start + 25 * 3600, zone, 6)
    expect(ticks.map((t) => t.hour)).toEqual([0, 6, 12, 18, 0])
    expect(ticks[1].time - ticks[0].time).toBe(7 * 3600)
  })
})
