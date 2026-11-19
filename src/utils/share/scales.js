// The DetailScale tracks on the share card: segments with small gaps and a ringed marker,
// no labels. Colours are the published ones in constants/levelColors.

import { EPA_LEVELS, UV_LEVELS } from '@/constants/levelColors'

// the marker never sits on the track's rounded ends
const clampLeft = (pct) => Math.max(4, Math.min(96, pct))

// UV bands 0–2, 3–5, 6–7, 8–10, 11+ drawn as widths on a 12-step track
const UV_WIDTHS = [3, 3, 2, 3, 1]
const UV_STEPS = UV_WIDTHS.reduce((a, b) => a + b, 0)

/** the UV index on the track; the marker is filled with its level's colour */
export function uvScale(index) {
  const uv = Math.max(0, Math.round(Number(index) || 0))
  const level = UV_LEVELS.find((l) => uv < l.max) || UV_LEVELS[UV_LEVELS.length - 1]
  return {
    level: level.key,
    segments: UV_LEVELS.map((l, i) => ({ flex: UV_WIDTHS[i], color: l.color })),
    marker: { left: clampLeft(((Math.min(uv, 11.5) + 0.5) / UV_STEPS) * 100), color: level.color }
  }
}

/** the US EPA index (1–6) on six equal segments; the marker takes the category colour */
export function aqiScale(epaIndex) {
  const i = Math.max(1, Math.min(6, Math.round(Number(epaIndex)) || 1)) - 1
  return {
    level: EPA_LEVELS[i].key,
    segments: EPA_LEVELS.map((l) => ({ flex: 1, color: l.color })),
    marker: { left: clampLeft(((i + 0.5) / EPA_LEVELS.length) * 100), color: EPA_LEVELS[i].color }
  }
}

export const VISIBILITY_MAX_KM = 12

/**
 * Visibility: poor 2, hazy 3, good 5, clear 2. The first three are the ink at falling
 * opacity, clear is primary blue. `dark` is the sticker's dark ink.
 */
export function visibilityScale(km, { dark = false } = {}) {
  const ink = (a) => (dark ? `rgba(17,24,39,${a})` : `rgba(255,255,255,${a})`)
  const value = Math.max(0, Number(km) || 0)
  return {
    segments: [
      { flex: 2, color: ink(0.78) },
      { flex: 3, color: ink(0.56) },
      { flex: 5, color: ink(0.36) },
      { flex: 2, color: dark ? 'hsl(214 72% 44%)' : 'hsl(214 88% 72%)' }
    ],
    marker: {
      left: clampLeft((Math.min(value, VISIBILITY_MAX_KM) / VISIBILITY_MAX_KM) * 100),
      color: dark ? '#111827' : 'rgba(10,14,22,0.55)'
    }
  }
}
