// The Sun & Moon page is a function of one place and one instant, and both live in the URL:
//   /sun-moon?t=2026-11-24T21:30&lat=69.65&lon=18.96&name=Troms&country=Norway&tz=Europe/Oslo
// `t` is the place's wall clock, so changing place while keeping `t` keeps the chosen clock
// time (9 PM here becomes 9 PM there). No `t` = live; no lat/lon = the forecast location.

const PLACE_KEYS = ['lat', 'lon', 'name', 'country', 'tz']
const MAX_NAME = 80

const one = (value) => (Array.isArray(value) ? value[0] : value)
const text = (value) => {
  const v = one(value)
  return typeof v === 'string' ? v.trim().slice(0, MAX_NAME) : ''
}

export function isTimeZone(tz) {
  if (typeof tz !== 'string' || !tz) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** the place in the URL, or null when it is missing or not a real place */
export function placeFromQuery(query = {}) {
  const lat = Number(one(query.lat))
  const lon = Number(one(query.lon))
  const tz = text(query.tz)
  if (one(query.lat) == null || one(query.lon) == null) return null
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)
    return null
  if (!isTimeZone(tz)) return null
  return {
    name: text(query.name) || `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
    country: text(query.country),
    lat,
    lon,
    tz
  }
}

/** the weather store's coords as a place */
export function homePlace(coords) {
  if (
    !coords ||
    !Number.isFinite(coords.lat) ||
    !Number.isFinite(coords.lon) ||
    !isTimeZone(coords.tzId)
  )
    return null
  return {
    name: coords.name,
    country: coords.country || '',
    lat: coords.lat,
    lon: coords.lon,
    tz: coords.tzId
  }
}

export const timeFromQuery = (query = {}) => {
  const t = one(query.t)
  return typeof t === 'string' && t ? t : null
}

/** the query with a new place (null = back to the forecast location), keeping everything else */
export function withPlace(query, place) {
  const next = { ...query }
  for (const key of PLACE_KEYS) delete next[key]
  if (!place) return next
  const round = (x) => String(Math.round(x * 1e4) / 1e4)
  return {
    ...next,
    lat: round(place.lat),
    lon: round(place.lon),
    name: place.name,
    ...(place.country ? { country: place.country } : {}),
    tz: place.tz
  }
}

/** the query with a new time ('YYYY-MM-DDTHH:mm' in the place's zone; null = live) */
export function withTime(query, t) {
  const next = { ...query }
  delete next.t
  return t ? { ...next, t } : next
}

/** same place? (the URL rounds coordinates, so compare loosely) */
export const samePlace = (a, b) =>
  !!a && !!b && Math.abs(a.lat - b.lat) < 1e-3 && Math.abs(a.lon - b.lon) < 1e-3 && a.tz === b.tz
