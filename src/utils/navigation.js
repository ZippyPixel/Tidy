// The header follows the user onto other pages (About), but only home shows weather:
// once a search or locate has landed new data, take them back there.
export function showWeather(router) {
  if (!router || router.currentRoute.value.path === '/') return
  return router.push('/')
}
