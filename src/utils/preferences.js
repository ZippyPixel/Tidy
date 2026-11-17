export const THEME_COOKIE_KEY = 'tidy-theme'

// one year
const MAX_AGE = 60 * 60 * 24 * 365

// Theme and locale live in cookies rather than localStorage so the server can read
// them and render the correct theme/language on the first paint — localStorage is
// invisible to SSR, which would mean a light-mode flash and an i18n hydration
// mismatch. Writes only ever happen client-side, from a user toggling a control.
export function writePreferenceCookie(name, value) {
  // guard on document rather than import.meta.client so this also behaves in plain
  // vitest/jsdom, where Nuxt's build-time constants do not exist
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${MAX_AGE}; SameSite=Lax`
}

// Sun & Moon prayer times: "<method key>|<hanafi|standard>", e.g. "karachi|hanafi"
export const PRAYER_COOKIE_KEY = 'tidy-prayer'

export function parsePrayerCookie(value, methodKeys) {
  const [method, asr] = String(value ?? '').split('|')
  const index = methodKeys.indexOf(method)
  return { method: index >= 0 ? index : 0, hanafi: asr !== 'standard' }
}

export const formatPrayerCookie = (methodKey, hanafi) =>
  `${methodKey}|${hanafi ? 'hanafi' : 'standard'}`

// What to wear: "<man|woman>|<feel -1..1>|<coverage 0|1>|<skirts 0|1>", e.g. "man|0|0|1"
export const WEAR_COOKIE_KEY = 'tidy-wear'
export const WEAR_DEFAULTS = Object.freeze({
  figure: 'man',
  feel: 0,
  coverage: false,
  skirts: true
})

export function parseWearCookie(value) {
  const [figure, feel, coverage, skirts] = String(value ?? '').split('|')
  const f = Number(feel)
  return {
    figure: figure === 'woman' ? 'woman' : 'man',
    feel: f === -1 || f === 1 ? f : 0,
    coverage: coverage === '1',
    skirts: skirts !== '0'
  }
}

export const formatWearCookie = ({ figure, feel, coverage, skirts }) =>
  `${figure}|${feel}|${coverage ? 1 : 0}|${skirts ? 1 : 0}`
