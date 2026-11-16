// Tables for the Sun & Moon page. Kept apart from utils/sky so the preferences plugin can
// read METHODS without pulling the astronomy helpers into the entry chunk.

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
