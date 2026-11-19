// The share card's sky: which palette a moment gets, from the WeatherAPI condition code and
// the time of day (design/TidyShareCard.dc.html). Pure, so the card, the export and the
// tests agree. Times are minutes since the place's midnight.

// Dawn and dusk are this many minutes either side of sunrise and sunset
export const TWILIGHT_MIN = 45

// Every sky keeps white text readable: its lower half is a mid tone and the shade does the rest.
// a → b → c is top to bottom; `sun` draws the sun, `low` puts it near the horizon.
export const PALETTES = {
  day: { a: '#174F9E', b: '#2E76C9', c: '#5A97DA', sun: true, glow: '#FFE7A3', core: '#FFF7DC', clouds: 2 },
  partly: { a: '#1A549F', b: '#3479C6', c: '#6A9ED8', sun: true, glow: '#FFE7A3', core: '#FFF7DC', clouds: 4 },
  cloudy: { a: '#45556B', b: '#64768D', c: '#8495A9', clouds: 6 },
  fog: { a: '#515C6A', b: '#6A7685', c: '#8B96A3', haze: true },
  rain: { a: '#222F41', b: '#384860', c: '#576A82', clouds: 5, cloudDark: true, drops: true },
  storm: { a: '#11161F', b: '#272F40', c: '#46526A', clouds: 5, cloudDark: true, drops: true, flash: true },
  snow: { a: '#526379', b: '#6D7E94', c: '#93A2B4', clouds: 3, flakes: true },
  dawn: { a: '#1F2D62', b: '#7A5286', c: '#D88C5D', sun: true, low: true, glow: '#FFC98A', core: '#FFE6C0', clouds: 2 },
  dusk: { a: '#18204A', b: '#6E3D67', c: '#D0764A', sun: true, low: true, glow: '#FFB070', core: '#FFDCB0', clouds: 2 },
  night: { a: '#050915', b: '#0E1A3D', c: '#22355C', moon: true, stars: true, glow: '#9FB6FF' },
  nightCloudy: { a: '#0C1019', b: '#19202E', c: '#2D3748', moon: true, moonDim: true, clouds: 5, cloudDark: true, glow: '#7F8FB8' }
}

const STORM = [1087, 1273, 1276, 1279, 1282]
const FOG = [1030, 1135, 1147]
const SNOW = [
  1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252,
  1255, 1258, 1261, 1264
]

/** the kind of weather a WeatherAPI condition code is */
export function conditionKind(code) {
  const c = Number(code) || 1000
  if (c === 1000) return 'clear'
  if (c === 1003) return 'partly'
  if (c === 1006 || c === 1009) return 'cloudy'
  if (FOG.includes(c)) return 'fog'
  if (STORM.includes(c)) return 'storm'
  if (SNOW.includes(c)) return 'snow'
  return 'rain'
}

/** 'dawn' | 'day' | 'dusk' | 'night' for minutes since midnight; no rise or set = day */
export function timeOfDay(now, rise, set) {
  if (rise == null || set == null) return 'day'
  if (Math.abs(now - rise) < TWILIGHT_MIN) return 'dawn'
  if (Math.abs(now - set) < TWILIGHT_MIN) return 'dusk'
  return now > rise && now < set ? 'day' : 'night'
}

/**
 * The palette key for a condition and a time of day, and whether the storm flash shows.
 * Rain at night takes the storm palette without the flash.
 */
export function paletteKey(code, tod) {
  const kind = conditionKind(code)
  const night = tod === 'night'
  if (kind === 'storm') return { key: 'storm', flash: true }
  if (kind === 'rain') return night ? { key: 'storm', flash: false } : { key: 'rain', flash: false }
  if (kind === 'snow' || kind === 'fog' || kind === 'cloudy')
    return { key: night ? 'nightCloudy' : kind, flash: false }
  if (tod === 'day') return { key: kind === 'partly' ? 'partly' : 'day', flash: false }
  return { key: tod, flash: false }
}

/** '#rrggbb' a fraction f of the way to '#rrggbb' b */
export function mixHex(a, b, f) {
  const parse = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const A = parse(a)
  const B = parse(b)
  return (
    '#' +
    A.map((v, i) =>
      Math.round(v + (B[i] - v) * f)
        .toString(16)
        .padStart(2, '0')
    ).join('')
  )
}

export const hexAlpha = (hex, alpha) =>
  `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',')},${alpha})`

/**
 * Everything the sky art needs: the palette, its four gradient stops (so the gradient
 * stays smooth) and the shade tint (the sky's own darkest colour, not black).
 */
export function skyPalette({ code, now, rise, set }) {
  const tod = timeOfDay(now, rise, set)
  const { key, flash } = paletteKey(code, tod)
  const pal = { core: '#ffffff', glow: '#ffffff', ...PALETTES[key] }
  return {
    ...pal,
    key,
    tod,
    flash: !!pal.flash && flash,
    stops: [pal.a, mixHex(pal.a, pal.b, 0.45), pal.b, pal.c],
    shade: mixHex(pal.a, '#000000', 0.42)
  }
}
