// GET /api/search?q=<partial city name>
// Proxies WeatherAPI's search.json for the header autocomplete.
export default defineEventHandler(async (event) => {
  const { q } = getQuery(event)

  if (!q) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required query parameter "q".' })
  }

  // resolved outside the try so a missing-config 500 is not remapped to an upstream 502
  const key = weatherApiKey(event)
  const base = weatherApiBase(event)

  try {
    return await $fetch(`${base}/search.json`, {
      query: { key, q }
    })
  } catch (error) {
    rethrowUpstream(error, 'City search failed.')
  }
})
