// GET /api/places   every country and its first-level divisions, for the Sun & Moon location finder
// { count, credit, zones, countries: [{ name, code, center: [lon, lat], s: [[name, lat, lon, zone, city]] }] }
import { placeIndex } from '../utils/places.js'

export default defineCachedEventHandler(() => placeIndex(), {
  name: 'places',
  maxAge: 60 * 60 * 24,
  swr: false,
  getKey: () => 'index'
})
