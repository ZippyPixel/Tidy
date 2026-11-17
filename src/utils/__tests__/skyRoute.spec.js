import { describe, expect, it } from 'vitest'
import {
  homePlace,
  placeFromQuery,
  samePlace,
  timeFromQuery,
  withPlace,
  withTime
} from '@/utils/skyRoute'

const TROMSO = { name: 'Troms', country: 'Norway', lat: 69.65, lon: 18.96, tz: 'Europe/Oslo' }

describe('sky route', () => {
  it('reads a place from the query and rejects broken ones', () => {
    expect(
      placeFromQuery({
        lat: '69.65',
        lon: '18.96',
        name: 'Troms',
        country: 'Norway',
        tz: 'Europe/Oslo'
      })
    ).toEqual(TROMSO)
    expect(placeFromQuery({ lat: '69.65', lon: '18.96', tz: 'Europe/Oslo' }).name).toBe(
      '69.65, 18.96'
    )
    expect(placeFromQuery({ lat: '91', lon: '0', tz: 'UTC' })).toBeNull()
    expect(placeFromQuery({ lat: 'x', lon: '0', tz: 'UTC' })).toBeNull()
    expect(placeFromQuery({ lat: '1', lon: '0', tz: 'Mars/Olympus' })).toBeNull()
    expect(placeFromQuery({})).toBeNull()
  })

  it('turns weather coords into a place', () => {
    expect(
      homePlace({
        name: 'Joar Sahara',
        country: 'Bangladesh',
        lat: 23.817,
        lon: 90.417,
        tzId: 'Asia/Dhaka'
      })
    ).toEqual({
      name: 'Joar Sahara',
      country: 'Bangladesh',
      lat: 23.817,
      lon: 90.417,
      tz: 'Asia/Dhaka'
    })
    expect(homePlace(null)).toBeNull()
  })

  it('writes and clears the place, keeping the time', () => {
    const q = withPlace({ t: '2026-11-24T21:30' }, TROMSO)
    expect(q).toEqual({
      t: '2026-11-24T21:30',
      lat: '69.65',
      lon: '18.96',
      name: 'Troms',
      country: 'Norway',
      tz: 'Europe/Oslo'
    })
    expect(withPlace(q, null)).toEqual({ t: '2026-11-24T21:30' })
    expect(placeFromQuery(q)).toEqual(TROMSO)
  })

  it('writes and clears the time, keeping the place', () => {
    const q = withTime(withPlace({}, TROMSO), '2026-12-03T12:00')
    expect(timeFromQuery(q)).toBe('2026-12-03T12:00')
    expect(withTime(q, null)).toEqual(withPlace({}, TROMSO))
    expect(timeFromQuery({})).toBeNull()
  })

  it('compares places loosely', () => {
    expect(samePlace(TROMSO, { ...TROMSO, lat: 69.65001 })).toBe(true)
    expect(samePlace(TROMSO, { ...TROMSO, tz: 'UTC' })).toBe(false)
  })
})

describe('prayer cookie', async () => {
  const { formatPrayerCookie, parsePrayerCookie } = await import('@/utils/preferences')
  const keys = ['karachi', 'mwl', 'egyptian', 'isna']

  it('defaults to Karachi and Hanafi, and round-trips', () => {
    expect(parsePrayerCookie(undefined, keys)).toEqual({ method: 0, hanafi: true })
    expect(parsePrayerCookie('nope|x', keys)).toEqual({ method: 0, hanafi: true })
    expect(parsePrayerCookie(formatPrayerCookie('isna', false), keys)).toEqual({
      method: 3,
      hanafi: false
    })
  })
})
