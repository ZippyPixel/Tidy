import { describe, expect, it } from 'vitest'
import { recommend } from '@/utils/wear'
import {
  buildLooks,
  lookKey,
  MAX_LOOKS,
  swipeCommit,
  swipeIntent,
  swipeOffset
} from '@/utils/wearLooks'

const S = (over = {}) => ({
  feels: 28,
  feelsMin: 26,
  feelsMax: 30,
  rain: 0,
  rainH: null,
  precip: 0,
  snow: 0,
  wind: 10,
  gust: 14,
  uv: 0,
  uvH: null,
  isDay: true,
  kind: 'clear',
  haze: 0,
  from: Date.UTC(2026, 6, 14, 12) / 1000,
  fromH: 12,
  toH: 22,
  ...over
})

describe('buildLooks', () => {
  it('offers at most three looks, never the same outfit twice', () => {
    for (const feels of [-5, 3, 12, 18, 28, 35])
      for (const prefs of [{}, { figure: 'woman' }, { style: 'both' }, { coverage: true }]) {
        const looks = buildLooks(S({ feels, feelsMin: feels, feelsMax: feels }), prefs)
        expect(looks.length).toBeGreaterThan(0)
        expect(looks.length).toBeLessThanOrEqual(MAX_LOOKS)
        const keys = looks.map((l) => JSON.stringify(l.rec.outfit))
        expect(new Set(keys).size).toBe(keys.length)
      }
  })

  it("look 1 is the dashboard tile's pick", () => {
    const s = S()
    for (const prefs of [{}, { figure: 'woman', feel: 1 }, { style: 'traditional' }]) {
      const [first] = buildLooks(s, prefs)
      expect(first.shuffle).toBe(0)
      expect(first.rec.outfit).toEqual(recommend(s, prefs).outfit)
    }
  })

  it('ignores a shuffle left in the settings', () => {
    expect(buildLooks(S(), { shuffle: 2 })[0].rec.outfit).toEqual(recommend(S()).outfit)
  })

  it("keeps each look's shuffle so other views can dress the same way", () => {
    for (const l of buildLooks(S(), { style: 'both' }))
      expect(recommend(S(), { style: 'both', shuffle: l.shuffle }).outfit).toEqual(l.rec.outfit)
  })

  it('starts again from the new settings when they change', () => {
    const before = buildLooks(S(), { figure: 'man' })
    const after = buildLooks(S(), { figure: 'woman' })
    expect(after[0].rec.outfit).toEqual(recommend(S(), { figure: 'woman' }).outfit)
    expect(after[0].rec.outfit).not.toEqual(before[0].rec.outfit)
    const off = before[0].rec.outfit.bottom
    for (const l of buildLooks(S(), { exclude: [off] })) expect(l.rec.outfit.bottom).not.toBe(off)
  })

  it('one look when only one outfit fits, none without a summary', () => {
    const looks = buildLooks(S({ feels: -8, feelsMin: -8, feelsMax: -8 }), { style: 'traditional' })
    expect(looks).toHaveLength(1)
    expect(buildLooks(null, {})).toEqual([])
  })
})

describe('swipe', () => {
  it('waits for 8px of movement, and leaves vertical drags to the page', () => {
    expect(swipeIntent(5, 3)).toBe('wait')
    expect(swipeIntent(-7, 7)).toBe('wait')
    expect(swipeIntent(9, 2)).toBe('drag')
    expect(swipeIntent(-12, 4)).toBe('drag')
    expect(swipeIntent(4, 20)).toBe('scroll')
    expect(swipeIntent(10, -10)).toBe('scroll')
  })

  it('commits past 48px, otherwise springs back', () => {
    expect(swipeCommit(-49, 0, 3)).toBe(1)
    expect(swipeCommit(-48, 0, 3)).toBe(0)
    expect(swipeCommit(30, 1, 3)).toBe(1)
    expect(swipeCommit(60, 1, 3)).toBe(0)
  })

  it('stops at the first and last look', () => {
    expect(swipeCommit(120, 0, 3)).toBe(0)
    expect(swipeCommit(-120, 2, 3)).toBe(2)
  })

  it('follows the finger, with a 0.3 rubber band at the ends', () => {
    expect(swipeOffset(-40, 0, 3)).toBe(-40)
    expect(swipeOffset(40, 1, 3)).toBe(40)
    expect(swipeOffset(40, 0, 3)).toBeCloseTo(12)
    expect(swipeOffset(-40, 2, 3)).toBeCloseTo(-12)
  })
})

describe('lookKey', () => {
  it('arrows, Home and End move between the dots and stop at the ends', () => {
    expect(lookKey('ArrowRight', 0, 3)).toBe(1)
    expect(lookKey('ArrowDown', 2, 3)).toBe(2)
    expect(lookKey('ArrowLeft', 0, 3)).toBe(0)
    expect(lookKey('ArrowUp', 2, 3)).toBe(1)
    expect(lookKey('Home', 2, 3)).toBe(0)
    expect(lookKey('End', 0, 3)).toBe(2)
    expect(lookKey('Enter', 1, 3)).toBeNull()
  })
})
