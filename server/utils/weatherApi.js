export const FORECAST_DAYS = 7

// The upstream base URL comes from NUXT_WEATHER_API_BASE via runtimeConfig, so it can
// be pointed at a mock or a proxy per environment without a rebuild. It is resolved
// only in server/, so it never reaches the browser bundle. https (not http) because
// the server makes the call now — that also removes the mixed-content problem the
// client-side http:// calls had.
export function weatherApiBase(event) {
  const base = useRuntimeConfig(event).weatherApiBase
  if (!base) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Weather API base URL is not configured. Set NUXT_WEATHER_API_BASE.'
    })
  }
  // trailing slashes would produce '//forecast.json' against strict upstreams
  return base.replace(/\/+$/, '')
}

export function weatherApiKey(event) {
  const key = useRuntimeConfig(event).weatherApiKey
  if (!key) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Weather API key is not configured. Set NUXT_WEATHER_API_KEY.'
    })
  }
  return key
}

// Re-throw upstream failures without echoing the request URL, which carries the key.
// The cause is logged server-side first, because the 502 the browser sees cannot
// distinguish a bad host from a timeout from an expired key. Only these hand-picked
// fields are safe to print: ofetch builds error.message as `[GET] "<full url>": ...`,
// so logging error.message or error.stack would put the API key in the logs.
export function rethrowUpstream(error, fallbackMessage) {
  console.error('[weatherApi] upstream request failed', {
    status: error?.statusCode ?? null,
    // network-level failures (unknown host, DNS, connection refused) land here
    cause: error?.cause?.code ?? error?.cause?.cause?.code ?? null,
    upstreamCode: error?.data?.error?.code ?? null,
    upstreamMessage: error?.data?.error?.message ?? null
  })

  throw createError({
    statusCode: error?.statusCode === 400 || error?.statusCode === 404 ? 404 : 502,
    statusMessage: error?.data?.error?.message || fallbackMessage
  })
}
