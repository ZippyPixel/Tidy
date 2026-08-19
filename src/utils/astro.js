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
