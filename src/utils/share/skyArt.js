// Geometry for the share card's sky art, in the card's 360-unit space (height `hb`: 640
// story, 450 post, 360 square). Seeded, so the same sky draws the same way every time and the
// exported image matches the preview.

/** a small deterministic random generator (mulberry32) */
export function seeded(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const f1 = (n) => n.toFixed(1)

/** a cumulus: a flat pill base and three puffs, all drawn clockwise so they union */
export function cloudPath(x, y, w) {
  const bh = w * 0.2
  const r = bh / 2
  let d = `M${f1(x + r)} ${f1(y - bh)} H${f1(x + w - r)} A${f1(r)} ${f1(r)} 0 0 1 ${f1(x + w - r)} ${f1(y)} H${f1(x + r)} A${f1(r)} ${f1(r)} 0 0 1 ${f1(x + r)} ${f1(y - bh)} Z`
  for (const [fx, fr, fh] of [
    [0.27, 0.17, 0.7],
    [0.5, 0.25, 1],
    [0.73, 0.18, 0.75]
  ]) {
    const cx = x + w * fx
    const rr = w * fr
    const cy = y - bh * 0.5 - rr * fh * 0.6
    d += ` M${f1(cx - rr)} ${f1(cy)} A${f1(rr)} ${f1(rr)} 0 1 1 ${f1(cx + rr)} ${f1(cy)} A${f1(rr)} ${f1(rr)} 0 1 1 ${f1(cx - rr)} ${f1(cy)} Z`
  }
  return d
}

/** one TIDY wave along the bottom, filled down past the edge */
export function wavePath(y, amp, period) {
  let d = `M0 ${y} Q${period / 4} ${y - amp} ${period / 2} ${y}`
  for (let x = period; x <= 360 + period; x += period / 2) d += ` T${x} ${y}`
  return `${d} L360 ${y + 200} L0 ${y + 200} Z`
}

// Clouds sit in set slots around the sun and keep clear of the text column on the left:
// [x, y as a fraction of the height, width, kind (0 small, 1 big, 2 faint)]
const CLOUD_SLOTS = [
  [176, 0.29, 150, 1],
  [238, 0.15, 92, 0],
  [176, 0.05, 70, 0],
  [262, 0.41, 124, 1],
  [-44, 0.47, 112, 2],
  [150, 0.53, 96, 0]
]

// the few bright stars sit right of the text or in the gap above the details
const BRIGHT_STARS = [
  [214, 0.07],
  [338, 0.27],
  [232, 0.46],
  [52, 0.5]
]

export const SUN_X = 286

/** every shape of the sky for a palette (utils/share/skyPalette) at height hb */
export function skyScene(pal, hb) {
  const R = seeded(11 + hb)
  const stars = pal.stars
    ? Array.from({ length: 46 }, () => ({
        x: +(R() * 360).toFixed(1),
        y: +(R() * hb * 0.55).toFixed(1),
        r: +(0.35 + R() * 0.9).toFixed(2),
        o: +(0.3 + R() * 0.6).toFixed(2)
      }))
    : []
  const brightStars = pal.stars
    ? BRIGHT_STARS.map(([x, f]) => {
        const y = +(hb * f).toFixed(1)
        return { x, y, d: `M${x - 4} ${y} H${x + 4} M${x} ${y - 4} V${y + 4}` }
      })
    : []
  const clouds = CLOUD_SLOTS.slice(0, pal.clouds || 0).map(([x0, fy, w0, kind]) => {
    const w = w0 + (R() - 0.5) * 16
    const x = x0 + (R() - 0.5) * 22
    const y = hb * fy + (R() - 0.5) * 10 + w * 0.2
    const o = (kind === 1 ? 0.27 : kind === 2 ? 0.11 : 0.15) * (pal.cloudDark ? 0.65 : 1)
    return {
      d: cloudPath(+x.toFixed(1), +y.toFixed(1), +w.toFixed(1)),
      o: +o.toFixed(2),
      fill: pal.cloudDark ? '#C7D1E0' : '#ffffff'
    }
  })
  const haze = pal.haze
    ? [0.2, 0.36, 0.53, 0.7].map((y, i) => ({
        y: +(hb * y).toFixed(1),
        h: 26 + i * 6,
        o: 0.13 + (i % 2) * 0.05
      }))
    : []
  const drops = pal.drops
    ? Array.from({ length: 46 }, () => {
        const x = R() * 390 - 10
        const y = R() * hb * 0.8
        const l = 9 + R() * 9
        return {
          x1: +x.toFixed(1),
          y1: +y.toFixed(1),
          x2: +(x - l * 0.28).toFixed(1),
          y2: +(y + l).toFixed(1),
          o: +(0.12 + R() * 0.16).toFixed(2)
        }
      })
    : []
  const flakes = pal.flakes
    ? Array.from({ length: 52 }, (_, i) => ({
        x: +(R() * 360).toFixed(1),
        y: +(R() * hb * 0.85).toFixed(1),
        r: +(0.8 + R() * 1.8).toFixed(2),
        o: +(0.35 + R() * 0.5).toFixed(2),
        soft: i % 3 === 0
      }))
    : []
  return {
    stars,
    brightStars,
    clouds,
    haze,
    drops,
    flakes,
    sun: { x: SUN_X, y: pal.low ? Math.round(hb * 0.3) : 96 },
    flashY: Math.round(hb * 0.16),
    waves: [wavePath(hb - 62, 6, 128), wavePath(hb - 42, 5, 100), wavePath(hb - 22, 4, 76)]
  }
}
