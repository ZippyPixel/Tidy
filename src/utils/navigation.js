// The header follows the user onto every page. Once a search or locate has landed a new
// forecast location, each page follows it in its own way:
// - Sun & Moon: drop the URL's place, so the page shows the new forecast location (its `t`,
//   the place's wall clock, stays, as when the place is changed on the page itself)
// - Tides: drop the chosen station or place, so the page shows the station nearest the new
//   location (a `?date=` stays)
// - anywhere else (About, …): back home, the only page that shows weather
const PLACE_KEYS = ['lat', 'lon', 'name', 'country', 'tz']
const FOLLOWS = {
  '/sun-moon': PLACE_KEYS,
  '/tides': ['station', 'lat', 'lon', 'name']
}

export function followLocation(router) {
  if (!router) return
  const { path, query = {} } = router.currentRoute.value
  if (path === '/') return
  const drop = FOLLOWS[path]
  if (!drop) return router.push('/')
  if (!drop.some((key) => key in query)) return
  const next = { ...query }
  for (const key of drop) delete next[key]
  return router.replace({ query: next })
}
