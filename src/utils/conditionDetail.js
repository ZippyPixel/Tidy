// Pure derivations behind the Current Conditions detail modals. Returns numbers and
// i18n key suffixes (conditionDetail.*); formatting and translation stay in components.
// `hours` is the hourlyWindow() of normalizeHour() points starting at the current hour.
import { EPA_LEVELS } from '@/constants/levelColors'
import { pressureTrend, uvLevelOf } from '@/utils/hourDetail'

const BEAUFORT = [
  [1, 'calm'],
  [6, 'lightAir'],
  [12, 'lightBreeze'],
  [20, 'gentleBreeze'],
  [29, 'moderateBreeze'],
  [39, 'freshBreeze'],
  [50, 'strongBreeze'],
  [62, 'nearGale'],
  [75, 'gale'],
  [89, 'strongGale'],
  [103, 'storm'],
  [Infinity, 'violentStorm']
]

const DEW_POINT_COMFORT = [
  [10, 'dry'],
  [16, 'comfortable'],
  [19, 'slightlyHumid'],
  [22, 'humid'],
  [25, 'muggy'],
  [Infinity, 'oppressive']
]

const firstBelow = (table, value) => table.find(([limit]) => value < limit)[1]
const clamp = (value) => Math.max(0, Math.min(100, value))

export const beaufortLabel = (kph) => firstBelow(BEAUFORT, kph)

export const dewPointComfort = (dewC) => firstBelow(DEW_POINT_COMFORT, dewC)

// The dew points the explanation names: 16° and 21° C, in the chosen unit.
export const dewPointGuide = (unit) => (unit === 'celsius' ? { comfortable: 16, muggy: 21 } : { comfortable: 61, muggy: 70 })

// The strongest UV still ahead today; null once the sun has gone.
export function uvPeak(hours, date) {
  const peak = hours.filter((h) => h.date === date).reduce((best, h) => (best && best.uv >= h.uv ? best : h), null)
  return peak && peak.uv > 0 ? { uv: peak.uv, hour: peak } : null
}

export function rainBestChance(hours) {
  if (!hours.length) return { chance: 0, hour: null, isNow: false, likely: false }
  const index = hours.reduce((best, h, i) => (h.rain > hours[best].rain ? i : best), 0)
  const chance = hours[index].rain
  return { chance, hour: hours[index], isNow: index === 0, likely: chance >= 10 }
}

// The hour with the worst visibility ahead, when it is worse than right now.
export function lowestVisibility(km, hours) {
  const lowest = hours.reduce((best, h) => (best && best.visKm <= h.visKm ? best : h), null)
  return lowest && lowest.visKm < km ? lowest : null
}

export const visibilityPosition = (km) => (Math.min(km, 12) / 12) * 100

// Current reading against the forecast 3 h ahead, always in mb so both units agree.
export function pressureOutlook(mb, hours) {
  const ahead = hours[3]
  if (!ahead) return { trend: null, change: null }
  return {
    trend: pressureTrend(ahead.pressureMb, mb),
    change: Math.round((ahead.pressureMb - mb) * 10) / 10
  }
}

export function pressureChange(change, unit) {
  const size = Math.abs(change)
  return {
    negative: change < 0,
    value: unit === 'celsius' ? Math.round(size) : Number((size * 0.02953).toFixed(2))
  }
}

export const pressurePosition = (mb) => clamp(((mb - 970) * 100) / 80)

// Null without a reading: "Good" would be a claim about air we know nothing about.
export function epaCategory(index) {
  if (typeof index !== 'number' || Number.isNaN(index)) return null
  const clamped = Math.max(1, Math.min(EPA_LEVELS.length, index))
  return {
    ...EPA_LEVELS[clamped - 1],
    index: clamped,
    position: ((clamped - 0.5) / EPA_LEVELS.length) * 100
  }
}

const roundPollutant = (value) => {
  if (value === null || value === undefined) return null
  return value >= 100 ? Math.round(value) : Math.round(value * 10) / 10
}

export function pollutants(airQuality = {}) {
  return [
    ['PM2.5', airQuality.pm2_5],
    ['PM10', airQuality.pm10],
    ['O₃', airQuality.o3],
    ['NO₂', airQuality.no2],
    ['SO₂', airQuality.so2],
    ['CO', airQuality.co]
  ].map(([name, value]) => ({ name, value: roundPollutant(value) }))
}

// Bar strips: one column per two hours. A bar too short to see stays visible (6%);
// nothing at all is a flat dash, reported as null.
const barHeight = (percent) => (percent <= 0.5 ? null : Math.max(6, percent))

function slots(hours) {
  return hours
    .map((hour, i) => ({ hour, next: hours[i + 1] }))
    .filter((_, i) => i % 2 === 0)
    .map((slot, i) => ({
      ...slot,
      column: { key: `${slot.hour.date}-${slot.hour.hour}`, hour: slot.hour.hour, isNow: i === 0 },
      max: (read) => Math.max(read(slot.hour), slot.next ? read(slot.next) : -Infinity)
    }))
}

export function humidityColumns(hours) {
  return slots(hours).map(({ hour, column }) => ({ ...column, value: hour.humidity, height: hour.humidity }))
}

export function windColumns(hours, unit) {
  const all = slots(hours)
  const strongest = Math.max(1, ...all.map(({ hour }) => hour.windKph))
  return all.map(({ hour, column }) => ({
    ...column,
    value: Math.round(unit === 'celsius' ? hour.windKph : hour.windMph),
    degree: hour.windDegree,
    height: barHeight((hour.windKph / strongest) * 100)
  }))
}

function conditionIcon(hour, chance) {
  if (Math.max(hour.rain, chance >= 40 ? chance : 0) >= 40 || hour.precipMm >= 0.2) return 'rain'
  if (hour.cloud >= 60) return 'cloud'
  return hour.isDay ? 'sun' : 'moon'
}

export function rainColumns(hours) {
  const all = slots(hours)
  const wettest = Math.max(1, ...all.map(({ max }) => max((h) => h.precipMm)))
  return all.map(({ hour, column, max }) => {
    const chance = max((h) => h.rain)
    return {
      ...column,
      value: chance,
      emphasis: chance >= 30,
      icon: conditionIcon(hour, chance),
      height: barHeight((max((h) => h.precipMm) / wettest) * 100)
    }
  })
}

export function uvColumns(hours) {
  return slots(hours).map(({ hour, column, max }) => {
    const uv = max((h) => h.uv)
    return {
      ...column,
      value: Math.round(uv),
      icon: hour.isDay ? 'sun' : 'moon',
      color: uvLevelOf(uv).color,
      height: barHeight((Math.min(uv, 11) / 11) * 100)
    }
  })
}

// `current` and `day` are raw API objects: the tile and hero values in the chosen unit.
export function readings(current, day, unit) {
  const celsius = unit === 'celsius'
  return {
    speed: Math.round(celsius ? current.wind_kph : current.wind_mph),
    gust: Math.round(celsius ? current.gust_kph : current.gust_mph),
    maxWind: Math.round(celsius ? day.maxwind_kph : day.maxwind_mph),
    speedUnit: celsius ? 'kmh' : 'mph',
    precip: celsius ? day.totalprecip_mm : day.totalprecip_in,
    precipUnit: celsius ? 'mm' : 'in',
    visibility: Math.round(celsius ? current.vis_km : current.vis_miles),
    visibilityUnit: celsius ? 'km' : 'mi',
    pressure: celsius ? Math.round(current.pressure_mb) : current.pressure_in,
    pressureUnit: celsius ? 'hPa' : 'inHg',
    dewPoint: Math.round(celsius ? current.dewpoint_c : current.dewpoint_f)
  }
}
