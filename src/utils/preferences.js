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
