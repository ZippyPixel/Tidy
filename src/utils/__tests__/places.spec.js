import { describe, expect, it } from 'vitest'
import { placeIndex } from '../../../server/utils/places.js'
import fixture from './fixtures/places.json'

describe('places index', () => {
  const index = placeIndex()

  it('matches the design fixture', () => {
    expect(index.count).toBe(fixture.count)
    expect(index.countries).toHaveLength(fixture.countries.length)
    expect(index.countries.map((c) => c.code)).toEqual(fixture.countries.map((c) => c.code))
  })

  it('places Dhaka Division at Dhaka with its zone', () => {
    const bd = index.countries.find((c) => c.code === 'BD')
    const dhaka = bd.s.find((s) => s[0] === 'Dhaka Division')
    expect(dhaka[1]).toBeCloseTo(23.71, 1)
    expect(dhaka[2]).toBeCloseTo(90.41, 1)
    expect(index.zones[dhaka[3]]).toBe('Asia/Dhaka')
  })

  it('credits GeoNames and is built once', () => {
    expect(index.credit).toBe('GeoNames (CC BY 4.0)')
    expect(placeIndex()).toBe(index)
  })
})
