import { describe, it, expect } from 'vitest'
import { parseMinutes, progressBetween, pointOnArc, formatAstroTime, ARC } from '@/utils/astro'

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

describe('progressBetween', () => {
  it('reports the fraction elapsed between rise and set', () => {
    // rise 06:00 (360), set 18:00 (1080); now 12:00 (720) -> halfway
    expect(progressBetween('06:00 AM', '06:00 PM', 720)).toBeCloseTo(0.5, 5)
  })

  it('clamps before rise and after set', () => {
    expect(progressBetween('06:00 AM', '06:00 PM', 300)).toBe(0)
    expect(progressBetween('06:00 AM', '06:00 PM', 1200)).toBe(1)
  })

  it('handles spans crossing midnight', () => {
    // rise 09:00 PM (1260), set 03:00 AM next day (180 -> 1620); now 12:00 AM (0 -> 1440) -> halfway
    expect(progressBetween('09:00 PM', '03:00 AM', 0)).toBeCloseTo(0.5, 5)
  })

  it('returns null when an endpoint is missing', () => {
    expect(progressBetween('No moonrise', '06:00 PM', 720)).toBeNull()
  })
})

describe('pointOnArc', () => {
  it('maps progress to the arc endpoints and apex', () => {
    const left = pointOnArc(0)
    expect(left.x).toBeCloseTo(ARC.cx - ARC.halfWidth, 2)
    expect(left.y).toBeCloseTo(ARC.baseY, 2)

    const right = pointOnArc(1)
    expect(right.x).toBeCloseTo(ARC.cx + ARC.halfWidth, 2)
    expect(right.y).toBeCloseTo(ARC.baseY, 2)

    const apex = pointOnArc(0.5)
    expect(apex.x).toBeCloseTo(ARC.cx, 2)
    expect(apex.y).toBeCloseTo(ARC.baseY - ARC.rise, 2)
  })

  it('stays on a constant-radius circle (uniform curvature, not elliptical)', () => {
    const R = (ARC.halfWidth ** 2 + ARC.rise ** 2) / (2 * ARC.rise)
    const cy = ARC.baseY - ARC.rise + R
    for (const p of [0, 0.2, 0.5, 0.8, 1]) {
      const { x, y } = pointOnArc(p)
      const dist = Math.hypot(x - ARC.cx, y - cy)
      expect(dist).toBeCloseTo(R, 1)
    }
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
