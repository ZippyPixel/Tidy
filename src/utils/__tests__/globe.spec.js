import { describe, expect, it } from 'vitest'
import {
  camera,
  clampZoom,
  flattenIndex,
  hitTest,
  landPoints,
  normalizeName,
  pointSet,
  project,
  shortestTurn
} from '@/utils/globe'

const CENTRE = { lon: 90, lat: 0 }
const cam = camera(CENTRE, 200, 200, 100)

describe('project', () => {
  it('puts the view centre in the middle, facing us', () => {
    const p = project(cam, { lon: 90, lat: 0 })
    expect(p.x).toBeCloseTo(200)
    expect(p.y).toBeCloseTo(200)
    expect(p.depth).toBeCloseTo(1)
  })

  it('has east on the right and north on top', () => {
    expect(project(cam, { lon: 180, lat: 0 }).x).toBeCloseTo(300)
    expect(project(cam, { lon: 90, lat: 90 }).y).toBeCloseTo(100)
  })

  it('hides the far side', () => {
    expect(project(cam, { lon: -90, lat: 0 }).depth).toBeLessThan(0)
  })
})

describe('hitTest', () => {
  const near = { lon: 90, lat: 0 }
  const far = { lon: -90, lat: 0 }
  const set = pointSet([far, near])

  it('finds a dot under the pointer, skipping the far side', () => {
    expect(hitTest(cam, set, 200, 200, 'mouse')).toBe(1)
  })

  it('gives a finger more reach than a mouse', () => {
    expect(hitTest(cam, set, 215, 200, 'mouse')).toBe(-1)
    expect(hitTest(cam, set, 215, 200, 'touch')).toBe(1)
  })

  it('misses empty ocean', () => {
    expect(hitTest(cam, set, 20, 20, 'touch')).toBe(-1)
  })
})

describe('shortestTurn', () => {
  it('goes the short way across the date line', () => {
    expect(shortestTurn(170, -170)).toBe(20)
    expect(shortestTurn(-170, 170)).toBe(-20)
    expect(shortestTurn(0, 90)).toBe(90)
  })
})

describe('data', () => {
  it('reads the land dots', () => {
    expect(landPoints({ dots: [900, 235, -100, 50], scale: 10 })).toEqual([
      { lon: 90, lat: 23.5 },
      { lon: -10, lat: 5 }
    ])
  })

  it('flattens the station index', () => {
    const index = { countries: [{ name: 'Iceland', s: [['ticon/r', 'Reykjavik', 64.15, -21.94]] }] }
    expect(flattenIndex(index)).toEqual([{ id: 'ticon/r', name: 'Reykjavik', country: 'Iceland', lat: 64.15, lon: -21.94 }])
  })

  it('ignores accents and case in names', () => {
    expect(normalizeName('Reykjavík')).toBe('reykjavik')
  })

  it('keeps the zoom in range', () => {
    expect(clampZoom(0.5)).toBe(1)
    expect(clampZoom(9)).toBe(5)
  })
})
