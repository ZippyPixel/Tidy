// The share card's sun detail: the dashboard's CelestialArc in miniature. A 24-hour day
// curve (peak at solar noon) in a 100 × 40 box, the sunrise→sunset stretch lit, the sun now.
// Times are minutes since the place's midnight.

import { celestialWindow, curveDepth, curvePath } from '@/utils/astro'

export const ARC_BOX = { width: 100, height: 40, top: 5, bottom: 4 }
const SPAN = ARC_BOX.height - ARC_BOX.top - ARC_BOX.bottom

/** null without both times (polar day or night) */
export function sunArc(rise, set, now) {
  if (rise == null || set == null) return null
  const win = celestialWindow(rise, set, now ?? rise)
  const pct = (f) => +(f * 100).toFixed(2)
  return {
    full: curvePath(0, 1, ARC_BOX),
    lit: curvePath(win.rise, win.set, ARC_BOX),
    // percent of the box, for the HTML dot (keeps its shape however the box stretches)
    dot: {
      x: pct(win.now),
      y: +(((ARC_BOX.top + SPAN * curveDepth(win.now)) / ARC_BOX.height) * 100).toFixed(2)
    },
    up: win.up,
    // where the times go: centred under the ends of the lit stretch
    riseX: pct(win.rise),
    setX: pct(win.set)
  }
}
