// Pure helpers behind the tides card and page. `t` is an /api/tides payload and `now`
// epoch seconds. Returns numbers and i18n key suffixes; formatting stays in tideMixin.
const SCALE = 100
const METRES_TO_FEET = 3.28084
const DAY = 86400

export const INLAND_KM = 50

const HERO_DIGITS = { celsius: 2, fahrenheit: 1 }

export const metresToUnit = (metres, unit) => (unit === 'celsius' ? metres : metres * METRES_TO_FEET)
export const unitKey = (unit) => (unit === 'celsius' ? 'm' : 'ft')
export const heroDigits = (unit) => HERO_DIGITS[unit]

const cmToMetres = (cm) => cm / SCALE

function levelCm(t, epoch) {
  const { start, stepSec, levels } = t.timeline
  const position = (epoch - start) / stepSec
  const low = Math.max(0, Math.min(levels.length - 2, Math.floor(position)))
  const fraction = Math.max(0, Math.min(1, position - low))
  return levels[low] + (levels[low + 1] - levels[low]) * fraction
}

export const levelAt = (t, epoch) => cmToMetres(levelCm(t, epoch))

export const isRising = (t, epoch) => levelAt(t, epoch + 300) > levelAt(t, epoch)

const toExtreme = ([time, cm, high]) => ({ time, level: cmToMetres(cm), high: high === 1 })

export function nextExtreme(t, now) {
  const found = t.extremes.find((e) => e[0] > now)
  return found ? toExtreme(found) : null
}

export function extremeAfter(t, extreme) {
  return extreme ? nextExtreme(t, extreme.time) : null
}

// Which summary `epoch` falls in; the first or last one when it is outside them all.
export function dayIndexAt(t, epoch) {
  let index = 0
  for (let i = 0; i < t.days.length; i++) if (t.days[i].start <= epoch) index = i
  return index
}

const dayEnd = (t, index) => t.days[index + 1]?.start ?? t.days[index].start + DAY

export function extremesOnDay(t, index) {
  const from = t.days[index].start
  const to = dayEnd(t, index)
  return t.extremes.filter((e) => e[0] >= from && e[0] < to).map(toExtreme)
}

// "5h 39m": rounded to the minute, never negative.
export function durationParts(seconds) {
  const minutes = Math.max(0, Math.round(seconds / 60))
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 }
}

// Where the water sits between today's lowest low and highest high, 0..1. Held off the
// very ends so the gauge always shows some water and some air.
export function gaugeFraction(t, now) {
  const today = extremesOnDay(t, dayIndexAt(t, now))
  const level = levelAt(t, now)
  const levels = (high) => today.filter((e) => e.high === high).map((e) => e.level)
  const low = Math.min(...levels(false), level)
  const high = Math.max(...levels(true), level)
  return Math.max(0.06, Math.min(0.96, (level - low) / Math.max(0.01, high - low)))
}

// The water in a gauge of the given size, with a small wave on its surface.
export function gaugeWaterPath(fraction, width, height) {
  const y = height * (1 - fraction)
  const quarter = width / 8
  const stops = [2, 3, 4].map((n) => `T${quarter * 2 * n},${y.toFixed(1)}`).join(' ')
  return `M0,${y.toFixed(1)} Q${quarter},${(y - 2.2).toFixed(1)} ${quarter * 2},${y.toFixed(1)} ${stops} L${width},${height} L0,${height} Z`
}

// The next spring (or neap) day from today, or -1 when none is in the summaries.
export function nextDayFlagged(t, flag, fromIndex) {
  for (let i = fromIndex; i < t.days.length; i++) if (t.days[i][flag]) return i
  return -1
}

// New and full moons are what the tides follow; the quarters in between are skipped.
export function nextSyzygy(t, now) {
  return t.quarters.find((q) => q.t > now && (q.quarter === 0 || q.quarter === 2)) ?? null
}

export function haversineKm(a, b) {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}

export const isInland = (station) => station.distanceKm !== null && station.distanceKm >= INLAND_KM

// 360 -> { hours: 6, minutes: 0, negative: false }
export function offsetParts(offsetMin) {
  const size = Math.abs(offsetMin)
  return { hours: Math.floor(size / 60), minutes: size % 60, negative: offsetMin < 0 }
}

// One row per day, today first. `left`/`right` place the range bar on a scale shared by
// the whole week, so a big tide looks big next to a small one.
export function weekRows(t, now, count = 7) {
  const from = dayIndexAt(t, now)
  const indexes = []
  for (let i = from; i < Math.min(t.days.length, from + count); i++) indexes.push(i)
  const all = indexes.flatMap((i) => extremesOnDay(t, i))
  const ofKind = (high) => all.filter((e) => e.high === high).map((e) => e.level)
  const weekLow = ofKind(false).length ? Math.min(...ofKind(false)) : 0
  const weekHigh = ofKind(true).length ? Math.max(...ofKind(true)) : weekLow
  const span = Math.max(0.01, weekHigh - weekLow)
  return indexes.map((index) => {
    const extremes = extremesOnDay(t, index)
    const highs = extremes.filter((e) => e.high)
    const lows = extremes.filter((e) => !e.high)
    const low = lows.length ? Math.min(...lows.map((e) => e.level)) : weekLow
    const high = highs.length ? Math.max(...highs.map((e) => e.level)) : weekHigh
    return {
      index,
      weekLow,
      weekHigh,
      date: t.days[index].date,
      isToday: index === from,
      spring: t.days[index].spring,
      neap: t.days[index].neap,
      highs,
      lows,
      range: high - low,
      left: ((low - weekLow) / span) * 100,
      right: ((weekHigh - high) / span) * 100
    }
  })
}

// A small day curve for a week row, in a viewBox of width x height.
export function sparkPath(t, index, low, high, width = 120, height = 36) {
  const span = Math.max(0.01, high - low)
  const start = t.days[index].start
  const length = dayEnd(t, index) - start
  let path = ''
  for (let k = 0; k <= 72; k++) {
    const level = levelAt(t, start + (length * k) / 72)
    path += `${k ? ' L' : 'M'}${((k / 72) * width).toFixed(1)},${(height - 2 - ((level - low) / span) * (height - 4)).toFixed(1)}`
  }
  return path
}

// A credit line split around its URLs, so they can be links.
export function creditParts(text) {
  return text
    .split(/(https?:\/\/[^\s),]*[^\s),.])/)
    .filter(Boolean)
    .map((part) => (/^https?:\/\//.test(part) ? { text: part, href: part } : { text: part }))
}

// ---- the chart: everything in a 1000 x 100 box the SVG stretches to fit, and percentages
// for the markers and labels the page draws on top ----
const BOX_W = 1000
const BOX_H = 100
const INSETS = {
  // top and bottom room as a fraction of the height, for the labels by each marker
  day: [0.18, 0.18],
  week: [0.06, 0.06],
  card: [0.2, 0.22]
}

export function chartWindow(t, { view, day = 0, now }) {
  const lastPoint = t.timeline.start + (t.timeline.levels.length - 1) * t.timeline.stepSec
  const today = dayIndexAt(t, now)
  let from
  let to
  if (view === 'card') {
    from = now - 3 * 3600
    to = from + 24 * 3600
  } else if (view === 'week') {
    from = t.days[today].start
    to = dayEnd(t, today + 6)
  } else {
    const index = Math.max(0, Math.min(t.days.length - 1, today + day))
    from = t.days[index].start
    to = dayEnd(t, index)
  }
  return { from: Math.max(t.timeline.start, from), to: Math.min(lastPoint, to) }
}

// The Day and Week views take the scale from the whole timeline, so stepping between days
// never rescales the curve. The card has only its own 24 hours to fit.
function levelBounds(t, from, to) {
  const { start, stepSec, levels } = t.timeline
  const first = Math.max(0, Math.floor((from - start) / stepSec))
  const last = Math.min(levels.length - 1, Math.ceil((to - start) / stepSec))
  let low = Infinity
  let high = -Infinity
  for (let i = first; i <= last; i++) {
    low = Math.min(low, levels[i])
    high = Math.max(high, levels[i])
  }
  return { low: cmToMetres(low), high: cmToMetres(high) }
}

function gridStep(span) {
  if (span <= 3) return 0.5
  if (span <= 6) return 1
  if (span <= 12) return 2
  return 5
}

export function chartModel(t, { view, day = 0, now, unit = 'celsius' }) {
  const { from, to } = chartWindow(t, { view, day, now })
  const { start, stepSec, levels } = t.timeline
  const bounds =
    view === 'card' ? levelBounds(t, from, to) : levelBounds(t, start, start + (levels.length - 1) * stepSec)
  const [insetTop, insetBottom] = INSETS[view]
  const fractionX = (epoch) => (epoch - from) / (to - from)
  const fractionY = (level) => {
    const position = (level - bounds.low) / Math.max(0.01, bounds.high - bounds.low)
    return 1 - insetBottom - position * (1 - insetTop - insetBottom)
  }
  const point = (epoch, level) => `${(fractionX(epoch) * BOX_W).toFixed(1)},${(fractionY(level) * BOX_H).toFixed(2)}`

  const points = [point(from, levelAt(t, from))]
  for (let i = Math.ceil((from - start) / stepSec); i <= Math.floor((to - start) / stepSec); i++) {
    const epoch = start + i * stepSec
    if (epoch > from && epoch < to) points.push(point(epoch, cmToMetres(levels[i])))
  }
  points.push(point(to, levelAt(t, to)))
  const line = `M${points.join(' L')}`

  const nights = []
  for (let i = 0; i < t.days.length - 1; i++) {
    const { sunset } = t.days[i]
    const { sunrise } = t.days[i + 1]
    if (sunset === null || sunrise === null) continue
    const x0 = Math.max(0, fractionX(sunset))
    const x1 = Math.min(1, fractionX(sunrise))
    if (x1 > x0) nights.push({ x: x0 * BOX_W, width: (x1 - x0) * BOX_W })
  }

  const separators = t.days
    .filter((d) => d.start > from && d.start < to)
    .map((d) => fractionX(d.start) * BOX_W)

  const grid = []
  if (view !== 'card') {
    const low = metresToUnit(bounds.low, unit)
    const high = metresToUnit(bounds.high, unit)
    const step = gridStep(high - low)
    for (let value = Math.ceil(low / step) * step; value <= high + 1e-6; value += step) {
      const metres = unit === 'celsius' ? value : value / METRES_TO_FEET
      const y = fractionY(metres)
      // ceil of a small negative is -0, which would print as "-0"
      if (y > 0.02 && y < 0.98) grid.push({ value: value === 0 ? 0 : value, y: y * 100 })
    }
    grid.sort((a, b) => a.y - b.y)
  }

  const marks = t.extremes
    .filter((e) => e[0] > from && e[0] < to)
    .map(toExtreme)
    .map((e) => {
      const x = fractionX(e.time) * 100
      return { ...e, x, y: fractionY(e.level) * 100, anchor: x < 7 ? 'start' : x > 93 ? 'end' : 'middle' }
    })

  const hasNow = now > from && now < to
  return {
    from,
    to,
    line,
    area: `${line} L${BOX_W},${BOX_H} L0,${BOX_H} Z`,
    nights,
    separators,
    grid,
    marks,
    now: hasNow ? { x: fractionX(now) * 100, y: fractionY(levelAt(t, now)) * 100 } : null,
    // where a time and its level fall, for the scrub readout
    at: (epoch) => ({ x: fractionX(epoch) * 100, y: fractionY(levelAt(t, epoch)) * 100 })
  }
}
