// What the share card shows: the top lines, the details, how many fit, and the moments
// (presets). Pure; the composer and the card both read it.

/** the top of the card, in display order */
export const HEADER_LINES = ['place', 'date', 'temp', 'summary', 'hilo', 'feels']
/** everything but "feels like" */
export const HEADER_DEFAULT = ['place', 'date', 'temp', 'summary', 'hilo']

/** every detail, in chip order */
export const DETAILS = [
  'wind',
  'visibility',
  'uv',
  'aqi',
  'sun',
  'moon',
  'rain',
  'humidity',
  'cloud',
  'golden',
  'tide',
  'wear'
]

/** details that need the weather at that moment (they hide for an old photo) */
export const WEATHER_DETAILS = ['wind', 'visibility', 'uv', 'aqi', 'rain', 'humidity', 'cloud', 'wear']

export const MOMENTS = {
  today: ['wind', 'visibility', 'uv', 'aqi', 'sun', 'moon'],
  beach: ['tide', 'wind', 'uv', 'sun'],
  sky: ['moon', 'sun', 'golden', 'cloud', 'visibility'],
  outfit: ['wear', 'rain', 'uv', 'wind']
}
export const MOMENT_IDS = Object.keys(MOMENTS)

/** where the composer opens from → the moment it starts on */
export const ORIGINS = { dashboard: 'today', tides: 'beach', sky: 'sky', wear: 'outfit' }

export const LOOKS = ['sky', 'photo', 'sticker']
export const FORMATS = ['story', 'post', 'square']

/** the card's height / width; the sticker has no fixed height */
export const RATIOS = { story: 16 / 9, post: 1.25, square: 1 }

/** export pixels: 1080 wide, height from the format (the sticker's is auto) */
export const EXPORT_WIDTH = 1080
export const exportHeight = (format) => Math.round(EXPORT_WIDTH * RATIOS[format])

/**
 * Which top lines show and how big. `hilo` and `feels` share one small line; with the
 * temperature off the summary takes the headline size.
 */
export function headerLayout(header = HEADER_DEFAULT) {
  const has = (id) => header.includes(id)
  const showSub = has('hilo') || has('feels')
  return {
    place: has('place'),
    date: has('date'),
    temp: has('temp'),
    summary: has('summary'),
    hilo: has('hilo'),
    feels: has('feels'),
    top: has('place') || has('date'),
    sub: showSub,
    hero: has('temp') || has('summary') || showSub,
    summaryHero: has('summary') && !has('temp')
  }
}

/** turns one top line on or off, keeping display order */
export function toggleHeaderLine(header, id) {
  if (header.includes(id)) return header.filter((x) => x !== id)
  return HEADER_LINES.filter((k) => k === id || header.includes(k))
}

export const isDefaultHeader = (header) => header.join() === HEADER_DEFAULT.join()

/** how many detail slots a card has: story and sticker 6, post and square 4 */
export const capacity = (look, format) => (look === 'sticker' || format === 'story' ? 6 : 4)

/** "What to wear" spans both columns, so it takes two slots */
export const cost = (id) => (id === 'wear' ? 2 : 1)

export const slotsUsed = (ids) => ids.reduce((n, id) => n + cost(id), 0)

/** the details that fit, in order; one that would overflow is skipped */
export function fitDetails(ids, cap) {
  const out = []
  let used = 0
  for (const id of ids) {
    if (!DETAILS.includes(id) || out.includes(id)) continue
    if (used + cost(id) > cap) continue
    out.push(id)
    used += cost(id)
  }
  return out
}

/** the chip for one detail: on, or disabled because it would not fit */
export function detailChip(ids, id, cap) {
  const on = ids.includes(id)
  return { id, on, disabled: !on && slotsUsed(ids) + cost(id) > cap }
}

/** a moment's details, trimmed to the card */
export const momentDetails = (moment, cap) => fitDetails(MOMENTS[moment] || MOMENTS.today, cap)

/** the moment whose details these are (after trimming), or null once edited by hand */
export function momentFor(ids, cap) {
  return MOMENT_IDS.find((m) => momentDetails(m, cap).join() === ids.join()) || null
}

/** toggles a detail by hand; returns the new details and the moment they still match */
export function toggleDetail(ids, id, cap) {
  const chip = detailChip(ids, id, cap)
  if (chip.disabled) return { details: ids, moment: momentFor(ids, cap) }
  const details = chip.on ? ids.filter((x) => x !== id) : [...ids, id]
  return { details, moment: momentFor(details, cap) }
}
