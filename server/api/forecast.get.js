// GET /api/forecast?q=<query>&lang=<locale>
// Proxies WeatherAPI's forecast.json so the API key stays server-side.
export default defineEventHandler(async (event) => {
  const { q, lang } = getQuery(event)

  if (!q) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required query parameter "q".' })
  }

  // resolved outside the try so a missing-config 500 is not remapped to an upstream 502
  const key = weatherApiKey(event)
  const base = weatherApiBase(event)

  try {
    return await $fetch(`${base}/forecast.json`, {
      query: {
        key,
        q,
        days: FORECAST_DAYS,
        aqi: 'yes',
        alerts: 'yes',
        // the API returns English when lang is omitted
        ...(lang && lang !== 'en' ? { lang } : {})
      }
    })
  } catch (error) {
    rethrowUpstream(error, 'Weather forecast lookup failed.')
  }
})
