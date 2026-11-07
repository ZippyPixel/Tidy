// GET /api/tides?lat=&lon=&days=7 or ?station=<id>&days=7
// Predictions for a station, worked out locally from the bundled database.
// { station: null } means nothing usable is within 300 km.
import { parseCoordinates, parseDays } from '../utils/tideSummary.js'
import { licensedStationById, nearestLicensedStation, noStationNearby, stationTides } from '../utils/tides.js'

const nowInSeconds = () => Math.floor(Date.now() / 1000)

export default defineCachedEventHandler(
  async (event) => {
    const query = getQuery(event)
    const days = parseDays(query.days)

    if (query.station) {
      const station = await licensedStationById(String(query.station))
      if (!station) throw createError({ statusCode: 404, statusMessage: 'Unknown tide station.' })
      return stationTides(station, { now: nowInSeconds(), days })
    }

    const position = parseCoordinates(query.lat, query.lon)
    if (!position) {
      throw createError({ statusCode: 400, statusMessage: 'Pass "station", or "lat" and "lon".' })
    }
    const station = await nearestLicensedStation(position.lat, position.lon)
    if (!station) return noStationNearby()
    return stationTides(station, { now: nowInSeconds(), days, distanceKm: station.distance })
  },
  {
    name: 'tides',
    maxAge: 60 * 60,
    // no stale-while-revalidate: a day-old entry would not reach the current moment
    swr: false,
    getKey(event) {
      const query = getQuery(event)
      const days = parseDays(query.days)
      if (query.station) return `station-${encodeURIComponent(String(query.station))}-${days}`
      const position = parseCoordinates(query.lat, query.lon)
      return position ? `position-${position.lat}-${position.lon}-${days}` : 'invalid'
    }
  }
)
