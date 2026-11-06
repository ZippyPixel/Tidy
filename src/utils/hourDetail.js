// Pure view-model behind the hour detail modal. Returns numbers and i18n key
// suffixes (hourly.detail.*); formatting and translation stay in the component.
import { UV_LEVELS } from '@/constants/levelColors'
import { compassPoint } from '@/utils/hourly'

// Rounded to a tenth so float noise (91.1 - 90.1) cannot move a threshold.
const difference = (a, b) => Math.round((a - b) * 10) / 10

// The bands are whole numbers, so round first: 5.6 reads as 6, and 6 is high.
export function uvLevelOf(uv) {
  const rounded = Math.round(uv)
  return UV_LEVELS.find((level) => rounded < level.max) ?? UV_LEVELS[UV_LEVELS.length - 1]
}

export function uvLevel(uv, isDay) {
  if (!isDay && uv < 0.5) return 'none'
  return uvLevelOf(uv).key
}

export function visibilityLevel(km) {
  if (km >= 10) return 'clear'
  if (km >= 5) return 'good'
  if (km >= 2) return 'hazy'
  return 'poor'
}

// Against the previous hour, always in mb so both unit modes agree.
export function pressureTrend(mb, previousMb) {
  if (typeof previousMb !== 'number') return null
  const change = difference(mb, previousMb)
  if (change >= 1) return 'rising'
  if (change <= -1) return 'falling'
  return 'steady'
}

// `hour` and `previous` are normalizeHour() output; `previous` is null before the
// first hour of the forecast.
export function hourDetail(hour, previous, unit) {
  const celsius = unit === 'celsius'
  const temp = celsius ? hour.tempC : hour.tempF
  const heat = celsius ? hour.heatC : hour.heatF
  return {
    temp,
    feels: celsius ? hour.feelsC : hour.feelsF,
    condition: hour.conditionText,
    rain: {
      value: hour.rain,
      emphasis: hour.rain >= 30,
      amount: hour.precipMm > 0 ? (celsius ? hour.precipMm : hour.precipIn) : null,
      amountUnit: celsius ? 'mm' : 'in'
    },
    wind: {
      value: celsius ? hour.windKph : hour.windMph,
      unit: celsius ? 'kmh' : 'mph',
      degree: hour.windDegree,
      from: compassPoint(hour.windDegree),
      gust: celsius ? hour.gustKph : hour.gustMph
    },
    humidity: { value: hour.humidity, dewPoint: celsius ? hour.dewC : hour.dewF },
    uv: { value: hour.uv, level: uvLevel(hour.uv, hour.isDay), emphasis: Math.round(hour.uv) >= 6 },
    visibility: {
      value: celsius ? hour.visKm : hour.visMi,
      unit: celsius ? 'km' : 'mi',
      level: visibilityLevel(hour.visKm)
    },
    pressure: {
      value: celsius ? hour.pressureMb : hour.pressureIn,
      unit: celsius ? 'hPa' : 'inHg',
      trend: pressureTrend(hour.pressureMb, previous?.pressureMb)
    },
    cloud: hour.cloud,
    // compared in the displayed unit, as the design does: the same hour can clear
    // 1° in °F and not in °C
    heatIndex: difference(heat, temp) >= 1 ? heat : null
  }
}
