// Internal Nitro endpoints. The upstream WeatherAPI URL, the key, and the day count
// all live in server/ and never reach the browser — see server/api/*.get.js
export const API_ENDPOINTS = {
  WEATHER: '/api/forecast',
  SEARCH: '/api/search'
}
