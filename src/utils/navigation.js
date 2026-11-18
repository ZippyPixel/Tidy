// The header follows the user onto every page, and a search or locate never takes them off
// it. Once a new forecast location has landed, every page that reads the weather store
// (home, What to wear, …) updates by itself. Pages whose URL pins a place drop it here so
// they follow the new location too:
// - Sun & Moon: drop the URL's place, so the page shows the new forecast location (its `t`,
//   the place's wall clock, stays, as when the place is changed on the page itself)
// - Tides: drop the chosen station or place, so the page shows the station nearest the new
//   location (a `?date=` stays)
// - Home opened from a share link: drop the shared place, date and marker (and so the banner)
// A new page with a place in its URL adds its keys to FOLLOWS.
import { SHARE_KEYS } from '@/utils/share/shareLink'

const PLACE_KEYS = ['lat', 'lon', 'name', 'country', 'tz']
const FOLLOWS = {
  '/': SHARE_KEYS,
  '/sun-moon': PLACE_KEYS,
  '/tides': ['station', 'lat', 'lon', 'name']
}

export function followLocation(router) {
  if (!router) return
  const { path, query = {} } = router.currentRoute.value
  const drop = FOLLOWS[path]
  if (!drop || !drop.some((key) => key in query)) return
  const next = { ...query }
  for (const key of drop) delete next[key]
  return router.replace({ query: next })
}
