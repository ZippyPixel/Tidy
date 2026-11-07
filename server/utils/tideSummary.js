// Pure calculations behind /api/tides: no tide library in here. Extremes are
// { t: epoch seconds, level: metres, high: boolean }.
import * as Astronomy from 'astronomy-engine'

const BORROW = 6 * 3600

export const toCm = (metres) => Math.round(metres * 100)
export const round2 = (x) => Math.round(x * 100) / 100
const round3 = (x) => Math.round(x * 1000) / 1000

// Form factor: daily over twice-daily constituents, the standard way to name a tide.
export function tideType(constituents = []) {
  const amp = (name) => constituents.find((c) => c.name === name)?.amplitude || 0
  const form = (amp('K1') + amp('O1')) / Math.max(1e-6, amp('M2') + amp('S2'))
  if (form < 0.25) return 'semidiurnal'
  if (form < 1.5) return 'mixedSemidiurnal'
  if (form < 3) return 'mixedDiurnal'
  return 'diurnal'
}

const QUARTER_PHASES = ['new', 'firstQuarter', 'full', 'lastQuarter']

export function moonPhase(angle, quarterToday = null) {
  if (quarterToday !== null) return QUARTER_PHASES[quarterToday]
  if (angle < 90) return 'waxingCrescent'
  if (angle < 180) return 'waxingGibbous'
  if (angle < 270) return 'waningGibbous'
  return 'waningCrescent'
}

// Highest high minus lowest low in [from, to). A day can miss a high or a low as the
// tide drifts later, so the nearest one within 6 h outside the day stands in for it.
export function dayRange(extremes, from, to) {
  const inside = extremes.filter((e) => e.t >= from && e.t < to)
  const levels = (list, high) => list.filter((e) => e.high === high).map((e) => e.level)
  const nearby = extremes.filter((e) => e.t >= from - BORROW && e.t < to + BORROW)
  let highs = levels(inside, true)
  let lows = levels(inside, false)
  if (!highs.length) highs = levels(nearby, true)
  if (!lows.length) lows = levels(nearby, false)
  if (!highs.length || !lows.length) return 0
  return Math.max(...highs) - Math.min(...lows)
}

// The biggest and smallest day within three days either side.
export function springNeap(ranges, index) {
  const nearby = ranges.slice(Math.max(0, index - 3), index + 4)
  return {
    spring: ranges[index] === Math.max(...nearby),
    neap: ranges[index] === Math.min(...nearby)
  }
}

export function moonQuarters(from, to) {
  const quarters = []
  let quarter = Astronomy.SearchMoonQuarter(new Date(from * 1000))
  while (quarter.time.date.getTime() / 1000 < to) {
    quarters.push({ quarter: quarter.quarter, t: Math.round(quarter.time.date.getTime() / 1000) })
    quarter = Astronomy.NextMoonQuarter(quarter)
  }
  return quarters
}

function riseSet(observer, direction, from) {
  const found = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, direction, new Date(from * 1000), 1)
  return found ? Math.round(found.date.getTime() / 1000) : null
}

// Sun and moon for one local day; sunrise and sunset are null through polar day and night.
export function skyOnDay(start, end, lat, lon, quarters) {
  const observer = new Astronomy.Observer(lat, lon, 0)
  const noon = new Date(((start + end) / 2) * 1000)
  const angle = Astronomy.MoonPhase(noon)
  const quarterToday = quarters.find((q) => q.t >= start && q.t < end)?.quarter ?? null
  return {
    sunrise: riseSet(observer, +1, start),
    sunset: riseSet(observer, -1, start),
    moon: {
      angle: Math.round(angle),
      illum: round2(Astronomy.Illumination(Astronomy.Body.Moon, noon).phase_fraction),
      phase: moonPhase(angle, quarterToday)
    }
  }
}

// Heights above the chart datum, from the station's published datums.
export function datumRanges(datums = {}) {
  const span = (high, low) => (datums[high] != null && datums[low] != null ? round2(datums[high] - datums[low]) : null)
  return { meanRange: span('MHW', 'MLW'), springRange: span('MHWS', 'MLWS') }
}

export function parseCoordinates(lat, lon) {
  const latitude = Number(lat)
  const longitude = Number(lon)
  if (lat === '' || lon === '' || lat == null || lon == null) return null
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  // about 110 m: fine enough to keep the distance right, coarse enough to share a cache entry
  return { lat: round3(latitude), lon: round3(longitude) }
}

export function parseDays(days, fallback = 7) {
  const parsed = Math.trunc(Number(days))
  return Number.isFinite(parsed) && parsed >= 1 ? Math.min(parsed, 14) : fallback
}
