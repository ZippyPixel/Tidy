// Sun & Moon page: the place's clock and every astronomy-engine call. Pure apart from the
// per-place cache inside createSky(). Times are epoch milliseconds; a "wall" time is the
// place's local clock written as if it were UTC (Date.UTC(y, mo, d, h, mi)).
// Local days come from the IANA zone (utils/tideTime), so a daylight saving day of 23 or
// 25 hours starts and ends at its real midnights.
import { addDays, dateInZone, zoneOffsetMin, zonedMidnight } from './tideTime.js'

export const DAY_MS = 864e5
const MIN_MS = 6e4
const RAD = Math.PI / 180

/** Fajr and Isha angles below the horizon; Karachi is the default */
export const METHODS = [
  { key: 'karachi', fajr: 18, isha: 18 },
  { key: 'mwl', fajr: 18, isha: 17 },
  { key: 'egyptian', fajr: 19.5, isha: 17.5 },
  { key: 'isna', fajr: 15, isha: 15 }
]

/** meteor showers: [key, month (0-based), day, peak rate per hour in a dark sky] */
export const SHOWERS = [
  ['quadrantids', 0, 3, 110],
  ['lyrids', 3, 22, 18],
  ['etaAquariids', 4, 6, 50],
  ['deltaAquariids', 6, 30, 25],
  ['perseids', 7, 12, 100],
  ['orionids', 9, 21, 20],
  ['leonids', 10, 17, 15],
  ['geminids', 11, 14, 150],
  ['ursids', 11, 22, 10]
]

export const PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']

/* ---------------- the place's clock ---------------- */

export const offsetMs = (t, tz) => zoneOffsetMin(t / 1000, tz) * MIN_MS

/** a wall-clock time in the zone to the real instant */
export function wallToT(wall, tz) {
  return wall - offsetMs(wall - offsetMs(wall, tz), tz)
}

/** the local date 'YYYY-MM-DD' */
export const localDate = (t, tz) => dateInZone(t / 1000, tz)

/** the instant of the local midnight that starts t's day */
export const dayStart = (t, tz) => zonedMidnight(localDate(t, tz), tz) * 1000

/** start of the next local day (23, 24 or 25 hours later) */
export const nextDayStart = (ds, tz) => zonedMidnight(addDays(localDate(ds, tz), 1), tz) * 1000

/** start of the local day `n` days after ds's */
export const dayStartAt = (ds, tz, n) => zonedMidnight(addDays(localDate(ds, tz), n), tz) * 1000

export function parts(t, tz) {
  const d = new Date(t + offsetMs(t, tz))
  return {
    y: d.getUTCFullYear(),
    mo: d.getUTCMonth(),
    d: d.getUTCDate(),
    h: d.getUTCHours(),
    mi: d.getUTCMinutes()
  }
}

export const minuteOfDay = (t, tz) => {
  const p = parts(t, tz)
  return p.h * 60 + p.mi
}

/** the same local date at wall-clock minute m (0–1439) */
export function atMinute(t, tz, m) {
  const p = parts(t, tz)
  const clamped = Math.max(0, Math.min(1439, Math.round(m)))
  return wallToT(Date.UTC(p.y, p.mo, p.d) + clamped * MIN_MS, tz)
}

/** n days later at the same wall-clock time */
export function shiftDays(t, tz, n) {
  const p = parts(t, tz)
  return wallToT(Date.UTC(p.y, p.mo, p.d + n, p.h, p.mi), tz)
}

/** the same wall-clock time in another zone: 9 PM here becomes 9 PM there */
export function sameClockIn(t, fromTz, toTz) {
  return wallToT(t + offsetMs(t, fromTz), toTz)
}

/** whole local days from ds to t's day (by date, so DST days count as one) */
export function daysBetween(ds, t, tz) {
  const a = localDate(ds, tz).split('-').map(Number)
  const b = localDate(t, tz).split('-').map(Number)
  return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / DAY_MS)
}

const T_PATTERN = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)$/

/** '2026-11-24T21:30' (the place's clock) to an instant, or null */
export function parseT(str, tz) {
  const m = T_PATTERN.exec(String(str ?? ''))
  if (!m) return null
  const [y, mo, d, h, mi] = m.slice(1).map(Number)
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null
  return wallToT(Date.UTC(y, mo - 1, d, h, mi), tz)
}

export function formatT(t, tz) {
  const p = parts(t, tz)
  const two = (n) => String(n).padStart(2, '0')
  return `${p.y}-${two(p.mo + 1)}-${two(p.d)}T${two(p.h)}:${two(p.mi)}`
}

/* ---------------- small geometry ---------------- */

const COMPASS = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW'
]
export const compassPoint = (az) => COMPASS[Math.round((((az % 360) + 360) % 360) / 22.5) % 16]

/** "Where to look" compass (240 × 240, rim radius 92): overhead in the centre, the horizon
    on the rim, a body below the horizon just outside it */
export const COMPASS_R = 92
export function compassXY(alt, az) {
  const r = alt >= 0 ? COMPASS_R * (1 - alt / 90) : COMPASS_R + 9
  return [120 + r * Math.sin(az * RAD), 120 - r * Math.cos(az * RAD)]
}

/** the lit edge's direction as seen from here: bearing from the moon to the sun, clockwise from up */
export function moonTilt(sun, moon) {
  const dAz = (sun.az - moon.az) * RAD
  const aS = sun.alt * RAD
  const aM = moon.alt * RAD
  return (
    Math.atan2(
      Math.sin(dAz) * Math.cos(aS),
      Math.cos(aM) * Math.sin(aS) - Math.sin(aM) * Math.cos(aS) * Math.cos(dAz)
    ) / RAD
  )
}

/** i18n key for the phase angle (MoonPhase: 0 = new, 180 = full) */
export function phaseKey(phase) {
  if (phase < 6 || phase > 354) return 'newMoon'
  if (phase < 84) return 'waxingCrescent'
  if (phase < 96) return 'firstQuarter'
  if (phase < 174) return 'waxingGibbous'
  if (phase < 186) return 'fullMoon'
  if (phase < 264) return 'waningGibbous'
  if (phase < 276) return 'lastQuarter'
  return 'waningCrescent'
}

/** i18n key for how light it is from the sun's height */
export function lightKey(sunAlt) {
  if (sunAlt > 6) return 'daylight'
  if (sunAlt > -0.833) return 'goldenHour'
  if (sunAlt > -6) return 'twilight'
  if (sunAlt > -18) return 'deepTwilight'
  return 'night'
}

/** i18n key for a planet's brightness from its magnitude */
export function brightnessKey(mag) {
  if (mag < -3) return 'brilliant'
  if (mag < -1) return 'veryBright'
  if (mag < 1) return 'bright'
  if (mag < 2.5) return 'easy'
  return 'faint'
}

/** Asr: the sun's height when a shadow is `factor` times an object's height longer than at noon */
export function asrAltitude(noonAlt, factor) {
  return Math.atan(1 / (factor + Math.tan((90 - noonAlt) * RAD))) / RAD
}

/** the next event after t among [kind, time] pairs, or undefined */
export function nextEvent(events, t) {
  return events.filter((e) => e[1] != null && e[1] > t).sort((a, b) => a[1] - b[1])[0]
}

/* ---------------- astronomy (A = astronomy-engine) ---------------- */

/**
 * One place's sky. Everything that depends only on the local day is cached per day;
 * instant(t) is cheap enough to run every animation frame while dragging.
 */
export function createSky(A, place) {
  const { lat, lon, tz } = place
  const obs = new A.Observer(lat, lon, 0)
  const cache = new Map()
  const memo = (key, fn) => {
    if (!cache.has(key)) cache.set(key, fn())
    return cache.get(key)
  }
  const D = (ms) => new Date(ms)
  const attempt = (fn) => {
    try {
      return fn()
    } catch {
      return null
    }
  }

  function hor(body, t) {
    const d = D(t)
    const eq = A.Equator(body, d, obs, true, true)
    const h = A.Horizon(d, obs, eq.ra, eq.dec, 'normal')
    return { alt: h.altitude, az: h.azimuth, dist: eq.dist }
  }

  function day(ds) {
    return memo('d' + ds, () => {
      const end = nextDayStart(ds, tz)
      const inDay = (x) => (x != null && x >= ds && x < end ? x : null)
      const rs = (b, dir) =>
        attempt(() => inDay(A.SearchRiseSet(b, obs, dir, D(ds), 1)?.date.getTime() ?? null))
      const al = (dir, alt) =>
        attempt(() =>
          inDay(A.SearchAltitude('Sun', obs, dir, D(ds), 1, alt)?.date.getTime() ?? null)
        )
      const tr = (b) =>
        attempt(() => {
          const r = A.SearchHourAngle(b, obs, 0, D(ds))
          const t = r.time.date.getTime()
          return t < end ? { t, alt: r.hor.altitude } : null
        })
      const sun = {
        rise: rs('Sun', 1),
        set: rs('Sun', -1),
        noon: tr('Sun'),
        astroDawn: al(1, -18),
        civilDawn: al(1, -6),
        blueEnd: al(1, -4),
        goldenEnd: al(1, 6),
        goldenStart: al(-1, 6),
        blueStart: al(-1, -4),
        civilDusk: al(-1, -6),
        astroDusk: al(-1, -18)
      }
      const moon = { rise: rs('Moon', 1), set: rs('Moon', -1), high: tr('Moon') }
      // every 10 minutes of the wall clock, so x matches the slider even on a DST day
      const p = parts(ds, tz)
      const wall0 = Date.UTC(p.y, p.mo, p.d)
      const pts = []
      for (let i = 0; i <= 144; i++) {
        const t = i === 144 ? end : wallToT(wall0 + i * 10 * MIN_MS, tz)
        const s = hor('Sun', t)
        const m = hor('Moon', t)
        pts.push([s.alt, s.az, m.alt, m.az])
      }
      const planets = PLANETS.map((b) => ({ b, rise: rs(b, 1), set: rs(b, -1) }))
      return { ds, end, sun, moon, pts, planets }
    })
  }

  function ahead(ds) {
    return memo('a' + ds, () => {
      const out = {
        quarters: [],
        lunar: null,
        solar: null,
        season: null,
        perigee: null,
        apogee: null
      }
      attempt(() => {
        let q = A.SearchMoonQuarter(D(ds))
        for (let i = 0; i < 4; i++) {
          out.quarters.push({ quarter: q.quarter, t: q.time.date.getTime() })
          q = A.NextMoonQuarter(q)
        }
      })
      attempt(() => {
        const e = A.SearchLunarEclipse(D(ds))
        const t = e.peak.date.getTime()
        out.lunar = { kind: e.kind, t, up: hor('Moon', t).alt > 0 }
      })
      attempt(() => {
        const e = A.SearchLocalSolarEclipse(D(ds), obs)
        out.solar = {
          kind: e.kind,
          t: e.peak.time.date.getTime(),
          alt: e.peak.altitude,
          cover: e.obscuration ?? null
        }
      })
      attempt(() => {
        const y = new Date(ds).getUTCFullYear()
        const all = []
        for (const yy of [y, y + 1]) {
          const s = A.Seasons(yy)
          all.push(
            ['marchEquinox', s.mar_equinox],
            ['juneSolstice', s.jun_solstice],
            ['septemberEquinox', s.sep_equinox],
            ['decemberSolstice', s.dec_solstice]
          )
        }
        out.season =
          all.map(([key, tm]) => ({ key, t: tm.date.getTime() })).find((s) => s.t >= ds) ?? null
      })
      attempt(() => {
        let a = A.SearchLunarApsis(D(ds))
        for (let i = 0; i < 2; i++) {
          const o = { t: a.time.date.getTime(), km: a.dist_km }
          if (a.kind === 0) out.perigee = o
          else out.apogee = o
          a = A.NextLunarApsis(a)
        }
      })
      return out
    })
  }

  /** calendar month (mo 0-based): 35 or 42 cells from the Sunday before the 1st, with the moon at local noon */
  function month(y, mo) {
    return memo('m' + y + '-' + mo, () => {
      const first = new Date(Date.UTC(y, mo, 1)).getUTCDay()
      const cells = []
      for (let i = 0; i < 42; i++) {
        const u = Date.UTC(y, mo, 1 - first + i)
        const d = new Date(u)
        const noon = D(wallToT(u + 12 * 36e5, tz))
        cells.push({
          u,
          y: d.getUTCFullYear(),
          mo: d.getUTCMonth(),
          d: d.getUTCDate(),
          k: A.Illumination('Moon', noon).phase_fraction,
          wax: A.MoonPhase(noon) < 180
        })
      }
      return cells.slice(0, cells[35].mo === mo ? 42 : 35)
    })
  }

  /** prayer times; method is an index into METHODS. null where the sun never reaches the angle */
  function prayer(ds, method = 0, hanafi = true) {
    return memo(`p${ds}|${method}|${hanafi}`, () => {
      const today = day(ds)
      const { fajr: fa, isha: ia } = METHODS[method] ?? METHODS[0]
      const limit = today.end + 6 * 36e5
      const al = (dir, alt, from) =>
        attempt(() => {
          const x = A.SearchAltitude('Sun', obs, dir, D(from), 1, alt)?.date.getTime() ?? null
          return x != null && x < limit ? x : null
        })
      const noon = today.sun.noon
      const asr =
        noon && noon.alt > 0 ? al(-1, asrAltitude(noon.alt, hanafi ? 2 : 1), noon.t) : null
      return {
        fajr: al(1, -fa, ds),
        sunrise: today.sun.rise,
        dhuhr: noon ? noon.t : null,
        asr,
        maghrib: today.sun.set,
        isha: noon ? al(-1, -ia, noon.t) : null
      }
    })
  }

  /** the next two meteor shower peaks (11 PM local) from ds, with the moon's lit fraction then */
  function showers(ds) {
    return memo('s' + ds, () => {
      const y = parts(ds, tz).y
      const list = []
      for (const yy of [y, y + 1]) {
        for (const [key, mo, d, zhr] of SHOWERS) {
          const t = wallToT(Date.UTC(yy, mo, d, 23), tz)
          if (t >= ds) list.push({ key, t, zhr })
        }
      }
      return list
        .sort((a, b) => a.t - b.t)
        .slice(0, 2)
        .map((s) => ({ ...s, moon: A.Illumination('Moon', D(s.t)).phase_fraction }))
    })
  }

  /** positions at one instant: not cached */
  function instant(t) {
    const d = D(t)
    const sun = hor('Sun', t)
    const moon = hor('Moon', t)
    const phase = A.MoonPhase(d)
    const ill = A.Illumination('Moon', d)
    const planets = PLANETS.map((b) => {
      const h = hor(b, t)
      const mag = attempt(() => A.Illumination(b, d).mag) ?? 0
      return { b, alt: h.alt, az: h.az, mag }
    })
    return {
      t,
      sun,
      moon,
      phase,
      lit: ill.phase_fraction,
      waxing: phase < 180,
      elongation: A.AngleFromSun('Moon', d),
      moonKm: ill.geo_dist * A.KM_PER_AU,
      sunKm: sun.dist * A.KM_PER_AU,
      tilt: moonTilt(sun, moon),
      planets
    }
  }

  return { place, tz, hor, day, ahead, month, prayer, showers, instant }
}

/** times are shown rounded to the nearest minute, so 11:43:40 reads 11:44 */
export const roundToMinute = (t) => (t == null ? null : Math.round(t / MIN_MS) * MIN_MS)

/** a duration in whole minutes, rounded: { h, m } */
export function durationParts(ms) {
  const total = Math.max(0, Math.round(ms / MIN_MS))
  return { h: Math.floor(total / 60), m: total % 60 }
}
