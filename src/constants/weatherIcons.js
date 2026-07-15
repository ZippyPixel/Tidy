import clearDay from '@/assets/weather-icons/8030067.svg'
import clearNight from '@/assets/weather-icons/8030068.svg'
import cloudy from '@/assets/weather-icons/8030069.svg'
import cloudWind from '@/assets/weather-icons/8030070.svg'
import fog from '@/assets/weather-icons/8030071.svg'
import mistDay from '@/assets/weather-icons/8030072.svg'
import mistNight from '@/assets/weather-icons/8030073.svg'
import heavyRain from '@/assets/weather-icons/8030074.svg'
import thunderstorm from '@/assets/weather-icons/8030075.svg'
import partlyCloudyDay from '@/assets/weather-icons/8030076.svg'
import partlyCloudyNight from '@/assets/weather-icons/8030077.svg'
import rainShowerDay from '@/assets/weather-icons/8030080.svg'
import rainShowerNight from '@/assets/weather-icons/8030081.svg'
import snow from '@/assets/weather-icons/8030082.svg'
import lightRain from '@/assets/weather-icons/8030087.svg'
import sleet from '@/assets/weather-icons/8030088.svg'
import heavySnow from '@/assets/weather-icons/8030089.svg'

/**
 * WeatherAPI condition codes grouped by visual (see .claude/weather-api-response.md
 * for the full code list). Map by condition.code, never by condition.text —
 * the API text drifts from the docs and is localized.
 */
const CONDITION_ICON_GROUPS = [
  { day: clearDay, night: clearNight, codes: [1000] },
  { day: partlyCloudyDay, night: partlyCloudyNight, codes: [1003] },
  { day: cloudy, night: cloudy, codes: [1006, 1009] },
  // mist, haze, smoke, dust in the air
  { day: mistDay, night: mistNight, codes: [1012, 1015, 1030, 1033, 1036, 1039, 1042, 1045, 1048] },
  // blowing dust / sandstorms
  { day: cloudWind, night: cloudWind, codes: [1018, 1021, 1024, 1027] },
  { day: fog, night: fog, codes: [1135, 1147] },
  // patchy rain, drizzle and light showers
  { day: rainShowerDay, night: rainShowerNight, codes: [1063, 1150, 1180, 1240] },
  { day: lightRain, night: lightRain, codes: [1153, 1183, 1186, 1189] },
  { day: heavyRain, night: heavyRain, codes: [1192, 1195, 1243, 1246] },
  // sleet, freezing rain/drizzle, ice pellets
  { day: sleet, night: sleet, codes: [1069, 1072, 1168, 1171, 1198, 1201, 1204, 1207, 1237, 1249, 1252, 1261, 1264] },
  { day: snow, night: snow, codes: [1066, 1210, 1213, 1216, 1219, 1255] },
  { day: heavySnow, night: heavySnow, codes: [1114, 1117, 1222, 1225, 1258] },
  { day: thunderstorm, night: thunderstorm, codes: [1087, 1273, 1276, 1279, 1282] }
]

const DAY_ICONS = {}
const NIGHT_ICONS = {}
CONDITION_ICON_GROUPS.forEach((group) => {
  group.codes.forEach((code) => {
    DAY_ICONS[code] = group.day
    NIGHT_ICONS[code] = group.night
  })
})

/**
 * Resolve the icon URL for a WeatherAPI condition code.
 * Falls back to partly cloudy for unknown/missing codes.
 * @param {number} code condition.code from the API
 * @param {boolean} isDay true for day icons (API is_day === 1)
 */
export function getWeatherIcon(code, isDay = true) {
  const icons = isDay ? DAY_ICONS : NIGHT_ICONS
  return icons[code] || (isDay ? partlyCloudyDay : partlyCloudyNight)
}

export const MAPPED_CONDITION_CODES = Object.keys(DAY_ICONS).map(Number)
