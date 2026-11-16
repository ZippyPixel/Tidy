// Places for the Sun & Moon location finder: every country with its first-level divisions
// (GeoNames admin-1), each placed at its capital or largest city, with an IANA time zone.
// Same shape as the tide-stations index. Built once per server process on first use, the way
// design/tools/gen-places.cjs does it. Names and coordinates: GeoNames (CC BY 4.0) via the
// cities.json and all-the-cities packages; time zones: tz-lookup (CC0).
// Static imports so Nitro traces the packages (and all-the-cities' cities.pbf) into .output.
// The route module is loaded lazily, so the parse happens on the first /api/places call.
import admin1 from 'cities.json/admin1.json'
import cities from 'all-the-cities'
import tzlookup from 'tz-lookup'

const RAD = Math.PI / 180
const round2 = (x) => Math.round(x * 100) / 100

export const PLACES_CREDIT = 'GeoNames (CC BY 4.0)'

export function buildPlaces({ admin1, cities, tzlookup }) {
  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
  const rank = (c) =>
    (c.featureCode === 'PPLC' ? 3e9 : c.featureCode === 'PPLA' ? 2e9 : 0) + (c.population || 0)
  const best = new Map()
  const capital = new Map()
  for (const c of cities) {
    const key = c.country + '.' + c.adminCode
    if (!best.has(key) || rank(c) > rank(best.get(key))) best.set(key, c)
    if (
      c.featureCode === 'PPLC' &&
      (!capital.has(c.country) || c.population > capital.get(c.country).population)
    ) {
      capital.set(c.country, c)
    }
  }

  const zones = []
  const zoneIndex = new Map()
  const zi = (z) => {
    if (!zoneIndex.has(z)) {
      zoneIndex.set(z, zones.length)
      zones.push(z)
    }
    return zoneIndex.get(z)
  }
  const byCountry = new Map()
  const add = (cc, name, c) => {
    const [lon, lat] = c.loc.coordinates
    if (!byCountry.has(cc)) byCountry.set(cc, [])
    byCountry.get(cc).push([name, round2(lat), round2(lon), zi(tzlookup(lat, lon)), c.name])
  }
  for (const a of admin1) {
    const c = best.get(a.code)
    if (c) add(a.code.split('.')[0], a.name, c)
  }
  // countries without divisions (Monaco, Vatican, …) get their capital
  for (const [cc, c] of capital) if (!byCountry.has(cc)) add(cc, c.name, c)

  let count = 0
  const countries = [...byCountry.entries()]
    .map(([code, s]) => {
      count += s.length
      // the spherical mean, so a country across the antimeridian still centres on itself
      let x = 0
      let y = 0
      let z = 0
      for (const p of s) {
        const la = p[1] * RAD
        const lo = p[2] * RAD
        x += Math.cos(la) * Math.cos(lo)
        y += Math.cos(la) * Math.sin(lo)
        z += Math.sin(la)
      }
      let name = code
      try {
        name = regionNames.of(code) || code
      } catch {
        // an unknown code keeps its letters
      }
      return {
        name,
        code,
        center: [
          Math.round((Math.atan2(y, x) / RAD) * 10) / 10,
          Math.round((Math.atan2(z, Math.hypot(x, y)) / RAD) * 10) / 10
        ],
        s: s.sort((a, b) => a[0].localeCompare(b[0]))
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return { count, credit: PLACES_CREDIT, zones, countries }
}

let built = null

/** the whole index, built on first call and kept for the life of the process */
export function placeIndex() {
  if (!built) {
    built = buildPlaces({ admin1, cities, tzlookup })
  }
  return built
}
