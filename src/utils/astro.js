// Shared geometry + rise/set-progress helpers for the Sun and Moon arc cards.

// The trajectory is a shallow segment of a *perfect circle* (constant radius),
// drawn across a 200-wide viewBox: `halfWidth` sets the chord, `rise` its height.
export const ARC = { cx: 100, baseY: 62, halfWidth: 86, rise: 59 }

// Derive the underlying circle (radius R, center Y, half-sweep angle) from the
// chord + rise, so the arc keeps uniform curvature instead of looking parabolic.
function circleOf(arc) {
  const R = (arc.halfWidth * arc.halfWidth + arc.rise * arc.rise) / (2 * arc.rise)
  const cy = arc.baseY - arc.rise + R // circle center sits below the horizon
  const phiMax = Math.atan2(arc.halfWidth, R - arc.rise)
  return { R, cy, phiMax }
}

// "05:29 AM" -> minutes since midnight, or null when unparseable ("No moonrise", "", etc.)
export function parseMinutes(str) {
  if (!str || typeof str !== 'string') return null
  const match = str.trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/)
  if (!match) return null
  let hours = Number(match[1]) % 12
  if (/[Pp]/.test(match[3])) hours += 12
  return hours * 60 + Number(match[2])
}

export function nowMinutes(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes()
}

// Fraction (0..1) of the way from rise to set, clamped; handles spans crossing
// midnight (e.g. a moon that sets after 12 AM). Null when an endpoint is missing.
export function progressBetween(riseStr, setStr, now = nowMinutes()) {
  const rise = parseMinutes(riseStr)
  const set = parseMinutes(setStr)
  if (rise === null || set === null) return null
  const crossesMidnight = set <= rise
  const end = crossesMidnight ? set + 1440 : set
  let current = now
  if (crossesMidnight && current < rise) current += 1440
  const frac = (current - rise) / (end - rise)
  return Math.max(0, Math.min(1, frac))
}

// Point on the arc for progress p (0 = rise/left, 1 = set/right), swept at a
// constant angular rate across the circular segment.
export function pointOnArc(p, arc = ARC) {
  const { R, cy, phiMax } = circleOf(arc)
  const phi = phiMax * (2 * p - 1)
  return {
    x: +(arc.cx + R * Math.sin(phi)).toFixed(2),
    y: +(cy - R * Math.cos(phi)).toFixed(2)
  }
}

// SVG path `d` for the arc, using equal radii so it renders as a circular arc.
export function arcPath(arc = ARC) {
  const { R } = circleOf(arc)
  const r = R.toFixed(2)
  return `M ${arc.cx - arc.halfWidth} ${arc.baseY} A ${r} ${r} 0 0 1 ${arc.cx + arc.halfWidth} ${arc.baseY}`
}

// Localized "5:29 AM" from the API string; '--' for missing/unparseable values.
export function formatAstroTime(str, intlTag) {
  const minutes = parseMinutes(str)
  if (minutes === null) return '--'
  const date = new Date()
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return new Intl.DateTimeFormat(intlTag, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date)
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}

// ---------------------------------------------------------------------------
// V3 Sun & Moon card: a 24-hour "day curve" (cosine, peak at mid-span) with the
// rise→set stretch lit. Everything works in minutes since the location's midnight;
// a set after midnight is > 1440 and a rise the day before is < 0.

const DAY = 1440

// Where rise, set and now fall on a 24h window centred on the middle of the span.
// Fractions are 0..1 across the window; `up` is whether the body is above the horizon.
export function celestialWindow(rise, set, now) {
  const start = (rise + set) / 2 - DAY / 2
  const frac = (m) => (m - start) / DAY
  return {
    rise: frac(rise),
    set: frac(set),
    now: Math.max(0, Math.min(1, frac(now))),
    up: now >= rise && now <= set
  }
}

// Height on the curve for window fraction f: 0 at the peak, 1 at the troughs.
export function curveDepth(f) {
  return 1 - (1 + Math.cos(2 * Math.PI * (f - 0.5))) / 2
}

// SVG path for the curve between fractions a and b, in a `width` × `height` box whose
// curve spans y = top .. height - bottom. Sampled, so it scales with any viewBox.
export function curvePath(a, b, { width = 1000, height = 100, top = 0, bottom = 0 } = {}) {
  const n = Math.max(2, Math.ceil((b - a) * 96))
  const span = height - top - bottom
  let d = ''
  for (let i = 0; i <= n; i++) {
    const f = a + ((b - a) * i) / n
    d += `${i ? ' L' : 'M'}${(f * width).toFixed(1)},${(top + span * curveDepth(f)).toFixed(1)}`
  }
  return d
}

// Lit part of a moon disc of radius r, centred at the origin. k is the illuminated
// fraction (0 new .. 1 full); waxing moons are lit on the right.
export function moonLitPath(r, k, waxing) {
  const rx = (r * Math.abs(1 - 2 * k)).toFixed(2)
  const s1 = waxing ? 1 : 0
  const s2 = waxing ? (k > 0.5 ? 1 : 0) : k > 0.5 ? 0 : 1
  return `M0,${-r} A${r},${r} 0 0 ${s1} 0,${r} A${rx},${r} 0 0 ${s2} 0,${-r} Z`
}

const PHASES = {
  'new moon': 'newMoon',
  'waxing crescent': 'waxingCrescent',
  'first quarter': 'firstQuarter',
  'waxing gibbous': 'waxingGibbous',
  'full moon': 'fullMoon',
  'waning gibbous': 'waningGibbous',
  'last quarter': 'lastQuarter',
  'third quarter': 'lastQuarter',
  'waning crescent': 'waningCrescent'
}

// API moon_phase ("Waxing Gibbous") + moon_illumination (0..100) -> i18n key suffix
// (moonPhases.*), lit fraction and side.
export function moonPhase(name, illumination) {
  const key = PHASES[String(name || '').trim().toLowerCase()] || null
  const value = Number(illumination)
  const k = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) / 100 : 0
  const waxing = key ? key.startsWith('waxing') || key === 'firstQuarter' || key === 'newMoon' : true
  return { key, illumination: Math.round(k * 100), k, waxing }
}

// Minutes -> { hours, minutes } for "2h 14m"-style labels (never negative).
export function splitDuration(totalMinutes) {
  const m = Math.max(0, Math.round(totalMinutes))
  return { hours: Math.floor(m / 60), minutes: m % 60 }
}

// The location's wall clock. The API reports its local time alongside the epoch, so
// the difference is the zone offset; adding it to `nowMs` and reading UTC fields gives
// the location's date and time no matter where the browser is.
export function zoneOffsetMs(localtime, localtimeEpoch) {
  // "2026-07-15 5:52" — the API does not zero-pad the hour
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{1,2}):(\d{2})$/.exec(String(localtime || '').trim())
  if (!match || !localtimeEpoch) return null
  const [, y, mo, d, h, mi] = match.map(Number)
  // localtime drops the seconds; every real zone offset is a multiple of 15 minutes
  const quarter = 15 * 60000
  const offset = Date.UTC(y, mo - 1, d, h, mi) - localtimeEpoch * 1000
  return Math.round(offset / quarter) * quarter
}

export function locationClock(offsetMs, nowMs = Date.now()) {
  const d = new Date(nowMs + (offsetMs ?? -new Date(nowMs).getTimezoneOffset() * 60000))
  const pad = (n) => String(n).padStart(2, '0')
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    hour: d.getUTCHours(),
    minutes: d.getUTCHours() * 60 + d.getUTCMinutes()
  }
}
