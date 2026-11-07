import { describe, expect, it } from 'vitest'
import { addDays, dateInZone, zonedMidnight, zoneOffsetMin } from '@/utils/tideTime'

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
})
