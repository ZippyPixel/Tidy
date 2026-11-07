// The only file that talks to the tide library, so changing library touches just this.
import { findStation, nearestStation, stationsNear } from 'slackwater'
import { attributionWithCredit, credits, LICENSE_NAMES, loadStations, PROJECT_CREDIT, qualityFilter } from '@slackwater/database'
import { addDays, dateInZone, zonedMidnight } from '../../src/utils/tideTime.js'
import { dayRange, datumRanges, moonQuarters, round2, skyOnDay, springNeap, tideType, toCm } from './tideSummary.js'

const SEARCH_RADIUS_KM = 300
const NEARBY_RADIUS_KM = 700
const NEARBY_COUNT = 6
const STEP_SECONDS = 600
const SUMMARY_DAYS = 31
const EXTREME_DAYS = 33
const SPRING_NEAP_PADDING = 3
const YEAR_DAYS = 366

// What every lookup may return. CC BY-NC records may not be used in a commercial product,
// and the database also holds current stations and tide stations with nothing to predict from.
const licensed = (station) => station.license?.commercial_use !== false
const hasTideData = (station) =>
  station.kind === 'tide' && (station.harmonic_constituents?.length > 0 || station.offsets !== undefined)
const usable = (station) => licensed(station) && hasTideData(station)

function credit(station) {
  const source = credits.get(station.source.name) ?? null
  return {
    project: PROJECT_CREDIT,
    source,
    attribution: attributionWithCredit(source, station.license)
  }
}

const projectCredit = () => ({ project: PROJECT_CREDIT, source: null, attribution: PROJECT_CREDIT })

function stationSummary(station, distanceKm, extra) {
  return {
    id: station.id,
    name: station.name,
    region: station.region || '',
    country: station.country || '',
    lat: round2(station.latitude),
    lon: round2(station.longitude),
    timezone: station.timezone,
    source: station.source.name,
    license: LICENSE_NAMES[station.license?.type] ?? station.license?.type ?? '',
    distanceKm: distanceKm === null ? null : Math.round(distanceKm),
    ...extra
  }
}

async function nearbyStations(station) {
  const found = await stationsNear({
    lat: station.latitude,
    lon: station.longitude,
    maxDistance: NEARBY_RADIUS_KM,
    maxResults: NEARBY_COUNT + 1,
    filter: usable
  })
  return found
    .filter((s) => s.id !== station.id)
    .slice(0, NEARBY_COUNT)
    .map((s) => ({ id: s.id, name: s.name, km: Math.round(s.distance) }))
}

const toExtreme = (e) => ({ t: Math.round(e.time.getTime() / 1000), level: e.level, high: e.high })

// `now` is epoch seconds: the station's own calendar decides which day is today.
export async function stationTides(station, { now, days = 7, distanceKm = null }) {
  const zone = station.timezone
  const today = dateInZone(now, zone)
  const midnight = (offset) => zonedMidnight(addDays(today, offset - 1), zone)

  const timelineStart = midnight(0)
  const timelineEnd = midnight(days + 1)
  const timeline = await station.getTimelinePrediction({
    start: new Date(timelineStart * 1000),
    end: new Date(timelineEnd * 1000),
    timeFidelity: STEP_SECONDS
  })

  const yearStart = midnight(-SPRING_NEAP_PADDING)
  const yearly = await station.getExtremesPrediction({
    start: new Date(yearStart * 1000),
    end: new Date(midnight(YEAR_DAYS) * 1000)
  })
  const extremes = yearly.extremes.map(toExtreme)

  // index 0 of `ranges` is three days before the first summary
  const ranges = []
  for (let d = -SPRING_NEAP_PADDING; d < YEAR_DAYS - SPRING_NEAP_PADDING; d++) {
    ranges.push(dayRange(extremes, midnight(d), midnight(d + 1)))
  }

  const summaryEnd = midnight(EXTREME_DAYS)
  const quarters = moonQuarters(timelineStart - 10 * 86400, midnight(70))
  const summaries = []
  for (let d = 0; d < SUMMARY_DAYS; d++) {
    const start = midnight(d)
    const index = d + SPRING_NEAP_PADDING
    summaries.push({
      date: addDays(today, d - 1),
      start,
      range: toCm(ranges[index]),
      ...skyOnDay(start, midnight(d + 1), station.latitude, station.longitude, quarters),
      ...springNeap(ranges, index)
    })
  }

  const datums = station.datums || {}
  return {
    station: stationSummary(station, distanceKm, {
      datum: yearly.datum,
      type: station.type,
      tideType: tideType(station.harmonic_constituents),
      ...datumRanges(datums),
      largestRange: round2(Math.max(...ranges)),
      record: station.epoch ? [station.epoch.start.slice(0, 4), station.epoch.end.slice(0, 4)] : null,
      nearby: await nearbyStations(station)
    }),
    credit: credit(station),
    timeline: { start: timelineStart, stepSec: STEP_SECONDS, levels: timeline.timeline.map((p) => toCm(p.level)) },
    extremes: extremes.filter((e) => e.t >= timelineStart && e.t < summaryEnd).map((e) => [e.t, toCm(e.level), e.high ? 1 : 0]),
    days: summaries,
    quarters
  }
}

// null when nothing usable is within the search radius.
export async function nearestLicensedStation(lat, lon) {
  try {
    return await nearestStation({ lat, lon, maxDistance: SEARCH_RADIUS_KM, filter: usable })
  } catch (error) {
    if (/No stations found/.test(error?.message)) return null
    throw error
  }
}

// null for an unknown id, and for one no lookup is allowed to return.
export async function licensedStationById(id) {
  try {
    const station = await findStation(id)
    return usable(station) && qualityFilter(station) ? station : null
  } catch (error) {
    if (/Station not found/.test(error?.message)) return null
    throw error
  }
}

export const noStationNearby = () => ({ station: null, credit: projectCredit() })

const listing = (station, km) => ({
  id: station.id,
  name: station.name,
  region: station.region || '',
  country: station.country || '',
  lat: round2(station.latitude),
  lon: round2(station.longitude),
  ...(km === undefined ? {} : { km: Math.round(km) })
})

export async function searchStations(query) {
  const db = await loadStations()
  return { stations: db.search(query, { filter: usable, maxResults: 20 }).map((s) => listing(s)) }
}

export async function stationsAround(lat, lon) {
  const db = await loadStations()
  return { stations: db.near({ lat, lon, maxResults: 10, filter: usable }).map(([s, km]) => listing(s, km)) }
}

// Every usable station by country, for the globe: [id, name, lat, lon].
export async function stationIndex() {
  const db = await loadStations()
  const rad = Math.PI / 180
  const byCountry = new Map()
  for (const station of db.accepted) {
    if (!usable(station)) continue
    const name = station.country || ''
    if (!byCountry.has(name)) byCountry.set(name, [])
    byCountry.get(name).push(station)
  }
  let count = 0
  const countries = [...byCountry.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, list]) => {
      count += list.length
      // the spherical mean, so a country across the antimeridian still centres on itself
      let x = 0
      let y = 0
      let z = 0
      for (const s of list) {
        const la = s.latitude * rad
        const lo = s.longitude * rad
        x += Math.cos(la) * Math.cos(lo)
        y += Math.cos(la) * Math.sin(lo)
        z += Math.sin(la)
      }
      return {
        name,
        center: [
          Math.round((Math.atan2(y, x) / rad) * 10) / 10,
          Math.round((Math.atan2(z, Math.hypot(x, y)) / rad) * 10) / 10
        ],
        s: list
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((s) => [s.id, s.name, round2(s.latitude), round2(s.longitude)])
      }
    })
  return { count, countries, credit: projectCredit() }
}
