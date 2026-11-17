/* What to wear, the looks on the /wear hero (design/TidyWear: looks, onDown/onMove/onUp, dotKey).
 * Pure helpers: which outfits to offer, and the swipe and keyboard rules that move between them. */
import { recommend } from '@/utils/wear'

export const MAX_LOOKS = 3

/* Up to three looks for one window: look 1 is the day's pick (the one the dashboard tile shows, shuffle 0),
   then shuffle 1, 2, … through the outfits that fit, never the same outfit twice.
   Returns [{ rec, shuffle }]; empty when there is no summary. */
export function buildLooks(summary, prefs, fmt, max = MAX_LOOKS) {
  if (!summary) return []
  const first = recommend(summary, { ...prefs, shuffle: 0 }, fmt)
  const looks = [{ rec: first, shuffle: 0 }]
  const seen = new Set([JSON.stringify(first.outfit)])
  for (let s = 1; s < first.options && looks.length < max; s++) {
    const rec = recommend(summary, { ...prefs, shuffle: s }, fmt)
    const key = JSON.stringify(rec.outfit)
    if (seen.has(key)) continue
    seen.add(key)
    looks.push({ rec, shuffle: s })
  }
  return looks
}

/* Swipe on touch and pen: nothing happens until the finger has moved 8px; a mostly vertical move is a
   scroll and is left alone; past 48px sideways the swipe commits, otherwise it springs back. At the
   first and last look the character follows the finger at 0.3× (a rubber band). */
export const SWIPE = Object.freeze({ slop: 8, commit: 48, rubber: 0.3 })

// 'wait' (under the slop), 'scroll' (vertical: let the page scroll and stop tracking) or 'drag'
export function swipeIntent(dx, dy) {
  if (Math.abs(dx) < SWIPE.slop && Math.abs(dy) < SWIPE.slop) return 'wait'
  return Math.abs(dy) >= Math.abs(dx) ? 'scroll' : 'drag'
}

// how far the active character moves for a finger at dx, on look `i` of `n`
export function swipeOffset(dx, i, n) {
  const edge = (dx > 0 && i === 0) || (dx < 0 && i === n - 1)
  return edge ? dx * SWIPE.rubber : dx
}

// the look to show when the finger lifts at dx
export function swipeCommit(dx, i, n) {
  if (dx < -SWIPE.commit && i < n - 1) return i + 1
  if (dx > SWIPE.commit && i > 0) return i - 1
  return i
}

/* Arrow keys, Home and End on the dots. Returns the new index, or null for any other key. */
export function lookKey(key, i, n) {
  if (key === 'ArrowRight' || key === 'ArrowDown') return Math.min(n - 1, i + 1)
  if (key === 'ArrowLeft' || key === 'ArrowUp') return Math.max(0, i - 1)
  if (key === 'Home') return 0
  if (key === 'End') return n - 1
  return null
}
