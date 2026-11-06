// Pure helpers behind the Hourly card: normalize API hours, cut a 24h window
// that can run into tomorrow, and weave in sunrise/sunset cards.
import { parseMinutes } from '@/utils/astro'

// One API `forecastday.hour[n]` -> the fields the Hourly card reads, both units kept.
export function normalizeHour(hour) {
  const [date, time = '00:00'] = hour.time.split(' ')
  return {
    date,
    hour: Number(time.split(':')[0]),
    tempC: hour.temp_c,
    tempF: hour.temp_f,
    feelsC: hour.feelslike_c,
    feelsF: hour.feelslike_f,
    rain: hour.chance_of_rain,
    windKph: hour.wind_kph,
    windMph: hour.wind_mph,
    windDegree: hour.wind_degree,
    humidity: hour.humidity,
    code: hour.condition?.code ?? null,
    isDay: hour.is_day === 1
  }
}

// `count` consecutive hours starting at `startDate` `startHour`, crossing into the
// following days of `hourly` ({ [date]: hour[] }) as needed. Ends early if the
// forecast runs out.
export function hourlyWindow(hourly, startDate, startHour, count = 25) {
  const dates = Object.keys(hourly || {}).sort()
  const first = dates.indexOf(startDate)
  if (first === -1) return []
  const points = []
  for (let d = first; d < dates.length && points.length < count; d++) {
    const hours = hourly[dates[d]] || []
    for (const h of hours) {
      if (d === first && h.hour < startHour) continue
      points.push({ ...h, dayOffset: d - first })
      if (points.length === count) break
    }
  }
  return points
}

// Sunrise/sunset events (minutes since midnight, per date) from forecast days.
function sunEvents(forecastDays) {
  const events = []
  for (const day of forecastDays || []) {
    for (const kind of ['sunrise', 'sunset']) {
      const minutes = parseMinutes(day.astro?.[kind])
      if (minutes !== null) events.push({ date: day.date, minutes, kind, time: day.astro[kind] })
    }
  }
  return events
}

const key = (date, minutes) => `${date} ${String(Math.floor(minutes)).padStart(4, '0')}`

// The Summary strip: hour cards in order, a divider where the date changes, and a
// sunrise/sunset card just before the first hour that starts after the event.
// Events earlier than the first hour of the window are left out.
export function hourlyStrip(points, forecastDays) {
  if (!points.length) return []
  const events = sunEvents(forecastDays)
  const items = []
  let prev = null
  for (const p of points) {
    if (prev && p.date !== prev.date) items.push({ type: 'divider', id: `divider-${p.date}` })
    if (prev) {
      const from = key(prev.date, prev.hour * 60)
      const to = key(p.date, p.hour * 60)
      for (const e of events) {
        const k = key(e.date, e.minutes)
        if (k > from && k <= to) items.push({ type: 'event', id: `${e.kind}-${e.date}`, ...e })
      }
    }
    items.push({ type: 'hour', id: `${p.date}-${p.hour}`, ...p })
    prev = p
  }
  return items
}

// The design's curve smoothing: Catmull-Rom through every point, as cubic Béziers.
export function smoothPath(points) {
  if (!points.length) return ''
  const f = (n) => n.toFixed(1)
  let d = `M${f(points[0][0])},${f(points[0][1])}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    d +=
      ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)}` +
      ` ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)}` +
      ` ${f(p2[0])},${f(p2[1])}`
  }
  return d
}

// Y-axis domain and ticks for a temperature-like series (design's ~3-tick rule).
export function temperatureScale(values) {
  const vs = values.filter((v) => v !== null && v !== undefined)
  if (!vs.length) return { min: 0, max: 1, ticks: [] }
  let min = Math.min(...vs)
  let max = Math.max(...vs)
  const pad = (max - min) * 0.08 + 0.3
  min -= pad
  max += pad
  const step = [1, 2, 3, 5, 10].find((s) => (max - min) / s <= 3.2) || 10
  const ticks = []
  for (let t = Math.ceil(min / step) * step; t <= max; t += step) ticks.push(t)
  return { min, max, ticks }
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']

export function compassPoint(degree) {
  return COMPASS[Math.round(degree / 22.5) % 16]
}
