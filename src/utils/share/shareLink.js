// The link on a share card, the way back into TIDY (growth loop):
//   /?lat=23.82&lon=90.42&name=Dhaka&country=Bangladesh&tz=Asia/Dhaka&d=2026-11-19&from=share&m=today
// The place keys are the Sun & Moon URL's (utils/skyRoute). City precision rounds to 2
// decimals (about 1 km), region to 1 (about 10 km) with no name; Location off sends no
// place at all. `from=share` is the only marker: no tracking IDs.

import { placeFromQuery } from '@/utils/skyRoute'
import { MOMENT_IDS } from '@/utils/share/shareContent'

export const PLACE_KEYS = ['lat', 'lon', 'name', 'country', 'tz']
/** every key the share link adds, so the dashboard can drop them all */
export const SHARE_KEYS = [...PLACE_KEYS, 'd', 'from', 'm']

const DECIMALS = { city: 2, region: 1 }
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const one = (value) => (Array.isArray(value) ? value[0] : value)

/** a coordinate rounded to `decimals`, as the link writes it ("-0" never appears) */
export function roundCoord(x, decimals) {
  const f = 10 ** decimals
  const r = Math.round(x * f) / f
  return String(Object.is(r, -0) ? 0 : r)
}

/**
 * The link's query. `place` is { name, country, lat, lon, tz }; `precision` is 'city',
 * 'region', or null for Location off.
 */
export function shareQuery({ place, precision, date, moment }) {
  const query = {}
  if (place && precision && DECIMALS[precision] !== undefined) {
    const decimals = DECIMALS[precision]
    query.lat = roundCoord(place.lat, decimals)
    query.lon = roundCoord(place.lon, decimals)
    if (precision === 'city' && place.name) query.name = place.name
    if (place.country) query.country = place.country
    if (place.tz) query.tz = place.tz
  }
  if (date && DATE_RE.test(date)) query.d = date
  query.from = 'share'
  if (moment && MOMENT_IDS.includes(moment)) query.m = moment
  return query
}

/** the whole link: origin (from runtime config) + '/?' + the query */
export function shareUrl(origin, query) {
  const base = String(origin || '').replace(/\/+$/, '')
  return `${base}/?${new URLSearchParams(query).toString()}`
}

/** the site as the card prints it: no scheme, no trailing slash */
export const siteLabel = (origin) =>
  String(origin || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')

/** is this the dashboard opened from a share link? */
export const isShareLink = (query = {}) => one(query.from) === 'share'

/**
 * What a share link asks for: { place, date, moment }, or null when it isn't one. The
 * place is null when the link carries none (Location off) or a broken one.
 */
export function parseShareLink(query = {}) {
  if (!isShareLink(query)) return null
  const d = one(query.d)
  const m = one(query.m)
  return {
    place: placeFromQuery(query),
    date: typeof d === 'string' && DATE_RE.test(d) ? d : null,
    moment: MOMENT_IDS.includes(m) ? m : null
  }
}

/** the query with every share key removed */
export function withoutShare(query = {}) {
  const next = { ...query }
  for (const key of SHARE_KEYS) delete next[key]
  return next
}

/** letters and digits of any script, joined by dashes, lower case */
export function slugify(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

/** tidy-<place-slug>-<yyyy-mm-dd>.png, or tidy-<yyyy-mm-dd>.png with Location off */
export function shareFileName(placeName, date) {
  const slug = slugify(placeName)
  return `tidy-${slug ? `${slug}-` : ''}${date}.png`
}
