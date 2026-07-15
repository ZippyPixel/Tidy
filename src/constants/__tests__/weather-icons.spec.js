import { describe, it, expect } from 'vitest'
import { getWeatherIcon, MAPPED_CONDITION_CODES } from '@/constants/weatherIcons'

// every condition code WeatherAPI can return
// (https://www.weatherapi.com/docs/weather_conditions.json)
const ALL_API_CODES = [
  1000, 1003, 1006, 1009, 1012, 1015, 1018, 1021, 1024, 1027, 1030, 1033,
  1036, 1039, 1042, 1045, 1048, 1063, 1066, 1069, 1072, 1087, 1114, 1117,
  1135, 1147, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195,
  1198, 1201, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1240,
  1243, 1246, 1249, 1252, 1255, 1258, 1261, 1264, 1273, 1276, 1279, 1282
]

describe('getWeatherIcon', () => {
  it('maps every WeatherAPI condition code', () => {
    expect([...MAPPED_CONDITION_CODES].sort()).toEqual([...ALL_API_CODES].sort())
    ALL_API_CODES.forEach((code) => {
      expect(getWeatherIcon(code, true)).toBeTruthy()
      expect(getWeatherIcon(code, false)).toBeTruthy()
    })
  })

  it('returns different day and night icons for clear sky', () => {
    expect(getWeatherIcon(1000, true)).not.toBe(getWeatherIcon(1000, false))
    expect(getWeatherIcon(1003, true)).not.toBe(getWeatherIcon(1003, false))
  })

  it('shares one icon between day and night for cloudy conditions', () => {
    expect(getWeatherIcon(1006, true)).toBe(getWeatherIcon(1006, false))
  })

  it('falls back to partly cloudy for unknown or missing codes', () => {
    expect(getWeatherIcon(9999, true)).toBe(getWeatherIcon(1003, true))
    expect(getWeatherIcon(null, false)).toBe(getWeatherIcon(1003, false))
  })
})
