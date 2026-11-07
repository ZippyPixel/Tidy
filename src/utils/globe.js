// Orthographic projection for the station globe. Pure, so the canvas stays a thin painter.
const RAD = Math.PI / 180

export const MAX_ZOOM = 5
export const MIN_ZOOM = 1
export const ZOOM_STEP = 1.6
const TOUCH_RADIUS = 18
const MOUSE_RADIUS = 10

// Typed arrays of the angles, computed once: the globe redraws them every frame.
export function pointSet(points) {
  const count = points.length
  const lambda = new Float32Array(count)
  const sinLat = new Float32Array(count)
  const cosLat = new Float32Array(count)
  points.forEach(({ lat, lon }, i) => {
    lambda[i] = lon * RAD
    sinLat[i] = Math.sin(lat * RAD)
    cosLat[i] = Math.cos(lat * RAD)
  })
  return { count, lambda, sinLat, cosLat }
}

// globe-land.json: flat [lon * scale, lat * scale, ...]
export function landPoints({ dots, scale = 10 }) {
  const points = []
  for (let i = 0; i < dots.length; i += 2) points.push({ lon: dots[i] / scale, lat: dots[i + 1] / scale })
  return points
}

export function camera(view, cx, cy, radius) {
  const lambda0 = view.lon * RAD
  const phi0 = view.lat * RAD
  return { cx, cy, radius, lambda0, sinPhi0: Math.sin(phi0), cosPhi0: Math.cos(phi0) }
}

// `depth` above 0 faces the viewer.
export function projectAngles(cam, lambda, sinLat, cosLat) {
  const delta = lambda - cam.lambda0
  const cosDelta = Math.cos(delta)
  return {
    depth: cam.sinPhi0 * sinLat + cam.cosPhi0 * cosLat * cosDelta,
    x: cam.cx + cam.radius * cosLat * Math.sin(delta),
    y: cam.cy - cam.radius * (cam.cosPhi0 * sinLat - cam.sinPhi0 * cosLat * cosDelta)
  }
}

export function project(cam, { lat, lon }) {
  return projectAngles(cam, lon * RAD, Math.sin(lat * RAD), Math.cos(lat * RAD))
}

// The index of the closest visible point, or -1 if none is within reach of the pointer.
export function hitTest(cam, set, x, y, pointerType) {
  const reach = pointerType === 'touch' ? TOUCH_RADIUS : MOUSE_RADIUS
  let best = -1
  let bestDistance = reach * reach
  for (let i = 0; i < set.count; i++) {
    const p = projectAngles(cam, set.lambda[i], set.sinLat[i], set.cosLat[i])
    if (p.depth <= 0) continue
    const distance = (p.x - x) ** 2 + (p.y - y) ** 2
    if (distance < bestDistance) {
      bestDistance = distance
      best = i
    }
  }
  return best
}

// The short way round, so a fly-to across the date line doesn't circle the globe.
export function shortestTurn(fromLon, toLon) {
  return ((((toLon - fromLon) % 360) + 540) % 360) - 180
}

export const clampDragLat = (lat) => Math.max(-75, Math.min(75, lat))
export const clampFlyLat = (lat) => Math.max(-70, Math.min(70, lat))
export const clampZoom = (zoom) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))

// Accent-insensitive, so "Reykjavik" finds "Reykjavík".
export function normalizeName(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

// /api/tide-stations index -> { id, name, country, lat, lon }[]
export function flattenIndex(index) {
  return index.countries.flatMap((country) =>
    country.s.map(([id, name, lat, lon]) => ({ id, name, country: country.name, lat, lon }))
  )
}
