// GET /api/tide-stations?q=<text>        search, up to 20
// GET /api/tide-stations?near=<lat,lon>  the nearest 10
// GET /api/tide-stations                 every station by country, for the globe
import { parseCoordinates } from '../utils/tideSummary.js'
import { searchStations, stationIndex, stationsAround } from '../utils/tides.js'

const MAX_QUERY = 64
const searchText = (event) => String(getQuery(event).q ?? '').trim().slice(0, MAX_QUERY)
const position = (event) => {
  const [lat, lon] = String(getQuery(event).near ?? '').split(',')
  return parseCoordinates(lat, lon)
}

export default defineCachedEventHandler(
  async (event) => {
    if (getQuery(event).near !== undefined) {
      const near = position(event)
      if (!near) throw createError({ statusCode: 400, statusMessage: 'Pass "near" as lat,lon.' })
      return stationsAround(near.lat, near.lon)
    }
    const text = searchText(event)
    return text ? searchStations(text) : stationIndex()
  },
  {
    name: 'tide-stations',
    maxAge: 60 * 60 * 24,
    swr: false,
    getKey(event) {
      if (getQuery(event).near !== undefined) {
        const near = position(event)
        return near ? `near-${near.lat}-${near.lon}` : 'invalid'
      }
      const text = searchText(event).toLowerCase()
      return text ? `q-${encodeURIComponent(text)}` : 'index'
    }
  }
)
