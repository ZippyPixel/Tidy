// Regenerates src/utils/__tests__/fixtures/tides-sample.json from real Slackwater predictions.
// Adapted from design/tools/gen-tides-data.mjs. It works the figures out on its own rather
// than calling server/utils, so the unit tests compare two independent calculations.
//   node scripts/gen-tides-fixture.mjs
import fs from 'node:fs'
import { attributionWithCredit, credits, LICENSE_NAMES, PROJECT_CREDIT } from '@slackwater/database'
import * as Astronomy from 'astronomy-engine'
import { findStation, stationsNear } from 'slackwater'
import { addDays, dateInZone, zonedMidnight } from '../src/utils/tideTime.js'

const OUT = new URL('../src/utils/__tests__/fixtures/tides-sample.json', import.meta.url)
// The weather fixture's clock: 2026-11-06 13:01 Asia/Dhaka
const NOW = 1793948479
const LOCATION = { name: 'Joar Sahara', country: 'Bangladesh', lat: 23.817, lon: 90.417, timezone: 'Asia/Dhaka' }
const FORWARD_DAYS = 7
const SUMMARY_DAYS = 31
const IDS = [
  'ticon/charchanga-138a-bgd-uhslc_rq',
  'ticon/khal_10-135a-bgd-uhslc_rq',
  'ticon/chittagong-124-bgd-uhslc_fd',
  'ticon/khepupara-139a-bgd-uhslc_rq',
  'ticon/reykjavik-reyk-isl-icg',
  'ticon/sanfrancisco_fort_point-9414920-usa-da_sat',
  'ticon/sydney_fort_denison-60370-aus-bom'
]

const r2 = (x) => Math.round(x * 100) / 100
const cm = (x) => Math.round(x * 100)
const licensed = (s) => s.license?.commercial_use !== false

function km(a, b) {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

function phaseOf(angle, quarter) {
  if (quarter != null) return ['new', 'firstQuarter', 'full', 'lastQuarter'][quarter]
  if (angle < 90) return 'waxingCrescent'
  if (angle < 180) return 'waxingGibbous'
  if (angle < 270) return 'waningGibbous'
  return 'waningCrescent'
}

const out = { now: NOW, nowLabel: '2026-11-06 13:01 Asia/Dhaka', location: LOCATION, defaultStation: IDS[0], stations: {} }

for (const id of IDS) {
  const st = await findStation(id)
  const tz = st.timezone
  const first = addDays(dateInZone(NOW, tz), -1)
  const midnight = (d) => zonedMidnight(addDays(first, d), tz)
  const start = midnight(0)

  const tl = await st.getTimelinePrediction({
    start: new Date(start * 1000),
    end: new Date(midnight(FORWARD_DAYS + 1) * 1000),
    timeFidelity: 600
  })
  const yearly = await st.getExtremesPrediction({ start: new Date(midnight(-3) * 1000), end: new Date(midnight(366) * 1000) })
  const yr = yearly.extremes.map((e) => ({ t: Math.round(e.time.getTime() / 1000), level: e.level, high: e.high }))

  const rangeOf = (d) => {
    const a = midnight(d)
    const b = midnight(d + 1)
    const inDay = yr.filter((e) => e.t >= a && e.t < b)
    const near6 = yr.filter((e) => e.t >= a - 21600 && e.t < b + 21600)
    const pick = (list, high) => list.filter((e) => e.high === high).map((e) => e.level)
    const hs = pick(inDay, true).length ? pick(inDay, true) : pick(near6, true)
    const ls = pick(inDay, false).length ? pick(inDay, false) : pick(near6, false)
    return hs.length && ls.length ? Math.max(...hs) - Math.min(...ls) : 0
  }
  const ranges = new Map()
  for (let d = -3; d < 363; d++) ranges.set(d, rangeOf(d))

  const quarters = []
  let q = Astronomy.SearchMoonQuarter(new Date((start - 864000) * 1000))
  while (q.time.date.getTime() / 1000 < midnight(70)) {
    quarters.push({ quarter: q.quarter, t: Math.round(q.time.date.getTime() / 1000) })
    q = Astronomy.NextMoonQuarter(q)
  }

  const obs = new Astronomy.Observer(st.latitude, st.longitude, 0)
  const days = []
  for (let d = 0; d < SUMMARY_DAYS; d++) {
    const a = midnight(d)
    const b = midnight(d + 1)
    const noon = new Date(((a + b) / 2) * 1000)
    const angle = Astronomy.MoonPhase(noon)
    const rise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, +1, new Date(a * 1000), 1)
    const set = Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, -1, new Date(a * 1000), 1)
    const window = []
    for (let w = d - 3; w <= d + 3; w++) window.push(ranges.get(w))
    days.push({
      date: addDays(first, d),
      start: a,
      range: cm(ranges.get(d)),
      sunrise: rise ? Math.round(rise.date.getTime() / 1000) : null,
      sunset: set ? Math.round(set.date.getTime() / 1000) : null,
      moon: {
        angle: Math.round(angle),
        illum: r2(Astronomy.Illumination(Astronomy.Body.Moon, noon).phase_fraction),
        phase: phaseOf(angle, quarters.find((x) => x.t >= a && x.t < b)?.quarter)
      },
      spring: ranges.get(d) === Math.max(...window),
      neap: ranges.get(d) === Math.min(...window)
    })
  }

  const amp = (n) => st.harmonic_constituents.find((c) => c.name === n)?.amplitude || 0
  const F = (amp('K1') + amp('O1')) / Math.max(1e-6, amp('M2') + amp('S2'))
  const tideType = F < 0.25 ? 'semidiurnal' : F < 1.5 ? 'mixedSemidiurnal' : F < 3 ? 'mixedDiurnal' : 'diurnal'
  const dat = st.datums || {}
  const nearby = await stationsNear({ lat: st.latitude, lon: st.longitude, maxDistance: 700, maxResults: 7, filter: licensed })
  const source = credits.get(st.source.name) ?? null

  out.stations[id] = {
    station: {
      id,
      name: st.name,
      region: st.region || '',
      country: st.country || '',
      lat: r2(st.latitude),
      lon: r2(st.longitude),
      timezone: tz,
      source: st.source.name,
      license: LICENSE_NAMES[st.license?.type] ?? st.license?.type ?? '',
      distanceKm: Math.round(km(LOCATION, { lat: st.latitude, lon: st.longitude })),
      datum: yearly.datum,
      type: st.type,
      tideType,
      meanRange: dat.MHW != null && dat.MLW != null ? r2(dat.MHW - dat.MLW) : null,
      springRange: dat.MHWS != null && dat.MLWS != null ? r2(dat.MHWS - dat.MLWS) : null,
      largestRange: r2(Math.max(...ranges.values())),
      record: st.epoch ? [st.epoch.start.slice(0, 4), st.epoch.end.slice(0, 4)] : null,
      nearby: nearby.filter((s) => s.id !== id).slice(0, 6).map((s) => ({ id: s.id, name: s.name, km: Math.round(s.distance) }))
    },
    credit: { project: PROJECT_CREDIT, source, attribution: attributionWithCredit(source, st.license) },
    timeline: { start, stepSec: 600, levels: tl.timeline.map((p) => cm(p.level)) },
    extremes: yr.filter((e) => e.t >= start && e.t < midnight(33)).map((e) => [e.t, cm(e.level), e.high ? 1 : 0]),
    days,
    quarters
  }
  console.log(st.name.padEnd(28), tz.padEnd(22), tideType.padEnd(18), `${out.stations[id].station.distanceKm} km`, days.filter((x) => x.spring || x.neap).slice(0, 4).map((x) => `${x.date}:${x.spring ? 'S' : 'N'}`).join(' '))
}
fs.writeFileSync(OUT, JSON.stringify(out))
console.log('wrote', OUT.pathname, fs.statSync(OUT).size, 'bytes')
