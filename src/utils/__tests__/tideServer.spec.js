// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import { loadStations } from '@slackwater/database'
import {
  licensedStationById,
  nearestLicensedStation,
  searchStations,
  stationIndex,
  stationsAround,
  stationTides
} from '../../../server/utils/tides'
import sample from './fixtures/tides-sample.json'

const ID = sample.defaultStation
const expected = sample.stations[ID]
const { lat, lon } = sample.location

describe('stationTides against the independently generated fixture', () => {
  let payload

  beforeAll(async () => {
    const station = await nearestLicensedStation(lat, lon)
    payload = await stationTides(station, { now: sample.now, distanceKm: station.distance })
  }, 30000)

  it('finds Charchanga as the nearest station', () => {
    expect(payload.station.id).toBe(ID)
    expect(payload.station.name).toBe('Charchanga')
    expect(payload.station.distanceKm).toBe(189)
  })

  it('produces the same station facts', () => {
    expect(payload.station).toEqual(expected.station)
  })

  it('produces the same timeline, extremes, days and quarters', () => {
    expect(payload.timeline).toEqual(expected.timeline)
    expect(payload.extremes).toEqual(expected.extremes)
    expect(payload.days).toEqual(expected.days)
    expect(payload.quarters).toEqual(expected.quarters)
  })

  it('keeps yesterday to today+6 at 10-minute steps, with 31 days of summaries', () => {
    expect(payload.timeline.levels).toHaveLength(8 * 144 + 1)
    expect(payload.days).toHaveLength(31)
    expect(payload.days[0].date).toBe('2026-11-05')
    expect(payload.days[1].date).toBe('2026-11-06')
  })

  it('credits the source with the licence named', () => {
    expect(payload.credit).toEqual(expected.credit)
    expect(payload.credit.attribution).toContain('TICON-4')
    expect(payload.credit.attribution).toContain('CC BY 4.0')
    expect(payload.credit.project).toContain('Slackwater')
  })

  it('reproduces San Francisco, in a zone with daylight saving', async () => {
    const id = 'ticon/sanfrancisco_fort_point-9414920-usa-da_sat'
    const other = await stationTides(await licensedStationById(id), { now: sample.now })
    expect(other.days).toEqual(sample.stations[id].days)
    expect(other.extremes).toEqual(sample.stations[id].extremes)
  }, 30000)
})

describe('lookups', () => {
  let nonCommercial

  beforeAll(async () => {
    const db = await loadStations()
    nonCommercial = db.accepted.find((s) => s.license.commercial_use === false)
  })

  it('returns null past 300 km instead of throwing', async () => {
    expect(await nearestLicensedStation(47.5, 19.04)).toBeNull()
  })

  it('returns null for an unknown id', async () => {
    expect(await licensedStationById('nope')).toBeNull()
  })

  it('refuses a non-commercial station by id', async () => {
    expect(await licensedStationById(nonCommercial.id)).toBeNull()
  })

  it('never offers a non-commercial station by position', async () => {
    const near = await nearestLicensedStation(nonCommercial.latitude, nonCommercial.longitude)
    expect(near?.id).not.toBe(nonCommercial.id)
    const around = await stationsAround(nonCommercial.latitude, nonCommercial.longitude)
    expect(around.stations.map((s) => s.id)).not.toContain(nonCommercial.id)
  })

  it('leaves non-commercial stations out of search and the index', async () => {
    const found = await searchStations(nonCommercial.name)
    expect(found.stations.map((s) => s.id)).not.toContain(nonCommercial.id)

    const index = await stationIndex()
    const ids = index.countries.flatMap((c) => c.s.map((s) => s[0]))
    expect(ids).not.toContain(nonCommercial.id)
    expect(ids).toHaveLength(index.count)
  })

  describe('only tide stations with data', () => {
    const usable = (s) => s.kind === 'tide' && (s.harmonic_constituents.length > 0 || s.offsets !== undefined)
    let current
    let noData

    beforeAll(async () => {
      const db = await loadStations()
      const licensed = db.accepted.filter((s) => s.license.commercial_use !== false)
      current = licensed.find((s) => s.kind === 'current')
      noData = licensed.find((s) => s.kind === 'tide' && !usable(s))
    })

    it('counts 6,096 stations in 120 countries', async () => {
      const index = await stationIndex()
      expect(index.count).toBe(6096)
      expect(index.countries).toHaveLength(120)
    })

    it('leaves the rest out of the index', async () => {
      const index = await stationIndex()
      const ids = index.countries.flatMap((c) => c.s.map((s) => s[0]))
      expect(ids).not.toContain(current.id)
      expect(ids).not.toContain(noData.id)
    })

    it('leaves the rest out of search', async () => {
      for (const station of [current, noData]) {
        const found = await searchStations(station.name)
        expect(found.stations.map((s) => s.id)).not.toContain(station.id)
      }
    })

    it('leaves the rest out of near and nearest', async () => {
      for (const station of [current, noData]) {
        const around = await stationsAround(station.latitude, station.longitude)
        expect(around.stations.map((s) => s.id)).not.toContain(station.id)
        const near = await nearestLicensedStation(station.latitude, station.longitude)
        expect(near?.id).not.toBe(station.id)
      }
    })

    it('treats them as unknown by id', async () => {
      expect(await licensedStationById(current.id)).toBeNull()
      expect(await licensedStationById(noData.id)).toBeNull()
    })
  })

  it('finds a station by search and by position, in the same shape', async () => {
    const { stations } = await searchStations('Chitt')
    expect(stations[0]).toMatchObject({ name: 'Chittagong', country: 'Bangladesh' })
    const around = await stationsAround(lat, lon)
    expect(around.stations).toHaveLength(10)
    expect(around.stations[0]).toMatchObject({ id: ID, km: 189 })
  })
})
