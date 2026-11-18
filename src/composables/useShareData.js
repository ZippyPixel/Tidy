import { computed } from 'vue'
import useWeatherStore from '@/stores/weather'
import useTidesStore from '@/stores/tides'
import useUnitStore from '@/stores/unit'
import useWearStore from '@/stores/wear'
import weatherMixin from '@/mixins/weatherMixin'
import { currentIntlTag } from '@/i18n'
import { moonPhase, parseMinutes } from '@/utils/astro'
import { dateInZone, zoneOffsetMin } from '@/utils/tideTime'
import { heroDigits, isRising, levelAt, metresToUnit, unitKey } from '@/utils/tides'
import { recommend, wearText, windows } from '@/utils/wear'

const { formatTemp, formatNumber, formatHour } = weatherMixin.methods
const DAY_MIN = 1440

/** minutes since the place's midnight at epoch ms `t` */
export function minutesInZone(t, tz) {
  const sec = Math.floor(t / 1000)
  const local = sec + zoneOffsetMin(sec, tz) * 60
  return Math.floor((((local % 86400) + 86400) % 86400) / 60)
}

function clockLabel(minutes) {
  const m = ((Math.round(minutes) % DAY_MIN) + DAY_MIN) % DAY_MIN
  const d = new Date(Date.UTC(2000, 0, 1, Math.floor(m / 60), m % 60))
  return new Intl.DateTimeFormat(currentIntlTag(), {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC'
  }).format(d)
}

const fixed = (value, digits) =>
  new Intl.NumberFormat(currentIntlTag(), {
    useGrouping: false,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value)

/**
 * What the share card says, formatted in the chosen unit and language, from the stores
 * (no new weather request). `takenAt` (epoch ms) is a photo's moment: tides, sun and moon are
 * worked out for it; the weather only when the forecast has that hour, otherwise it hides.
 * `sky` is { A: astronomy-engine, createSky } once loaded (golden hour, and sun and moon
 * for a day the forecast doesn't cover).
 */
export default function useShareData({ t, nowMs, takenAt, sky }) {
  const weather = useWeatherStore()
  const tides = useTidesStore()
  const unitStore = useUnitStore()
  const wearStore = useWearStore()

  const tz = computed(() => weather.coords?.tzId || 'UTC')
  const instant = computed(() => takenAt.value ?? nowMs.value)
  const fahrenheit = computed(() => unitStore.unit === 'fahrenheit')
  const date = computed(() => dateInZone(instant.value / 1000, tz.value))
  const nowMin = computed(() => minutesInZone(instant.value, tz.value))
  const forecastDay = computed(() => weather.forecast.find((d) => d.date === date.value) || null)

  const place = computed(() => {
    const c = weather.coords
    if (!c) return null
    return { name: c.name, region: c.region || '', country: c.country || '', lat: c.lat, lon: c.lon, tz: c.tzId }
  })

  const temp = (c, f) => (c == null ? '' : formatTemp(fahrenheit.value ? f : c))

  // the weather at the moment: now, or the forecast's hour for a photo; null = none on record
  const moment = computed(() => {
    const cur = weather.current
    if (!cur) return null
    if (takenAt.value == null) {
      return {
        tempC: cur.temp_c,
        tempF: cur.temp_f,
        feelsC: cur.feelslike_c,
        feelsF: cur.feelslike_f,
        text: cur.condition?.text?.trim() || '',
        code: cur.condition?.code ?? 1000,
        windKph: cur.wind_kph,
        windMph: cur.wind_mph,
        windDegree: cur.wind_degree,
        uv: cur.uv,
        aqi: cur.air_quality?.['us-epa-index'] ?? null,
        visKm: cur.vis_km,
        visMi: cur.vis_miles,
        humidity: cur.humidity,
        cloud: cur.cloud,
        rain: forecastDay.value?.day?.daily_chance_of_rain ?? null
      }
    }
    const hour = Math.floor(nowMin.value / 60)
    const h = (weather.hourly[date.value] || []).find((x) => x.hour === hour)
    if (!h) return null
    return {
      tempC: h.tempC,
      tempF: h.tempF,
      feelsC: h.feelsC,
      feelsF: h.feelsF,
      text: h.conditionText || '',
      code: h.code ?? 1000,
      windKph: h.windKph,
      windMph: h.windMph,
      windDegree: h.windDegree,
      uv: h.uv,
      aqi: null,
      visKm: h.visKm,
      visMi: h.visMi,
      humidity: h.humidity,
      cloud: h.cloud,
      rain: h.rain
    }
  })

  const skyFor = computed(() => {
    const s = sky.value
    const p = place.value
    if (!s || !p) return null
    return s.createSky(s.A, p)
  })

  // the day's astronomy from the sky module, for a day the forecast doesn't cover
  const skyDay = computed(() => {
    const s = sky.value
    if (!s || !skyFor.value) return null
    return skyFor.value.day(s.dayStart(instant.value, tz.value))
  })

  const sunTimes = computed(() => {
    const a = forecastDay.value?.astro
    if (a) return { rise: parseMinutes(a.sunrise), set: parseMinutes(a.sunset) }
    const sun = skyDay.value?.sun
    if (!sun) return { rise: null, set: null }
    const m = (ms) => (ms == null ? null : minutesInZone(ms, tz.value))
    return { rise: m(sun.rise), set: m(sun.set) }
  })

  const moon = computed(() => {
    let phase = null
    const a = forecastDay.value?.astro
    if (takenAt.value == null && a) {
      phase = moonPhase(a.moon_phase, a.moon_illumination)
    } else if (sky.value) {
      const { A, phaseKey } = sky.value
      const when = new Date(instant.value)
      const angle = A.MoonPhase(when)
      const k = A.Illumination('Moon', when).phase_fraction
      phase = { key: phaseKey(angle), k, illumination: Math.round(k * 100), waxing: angle < 180 }
    } else if (a) {
      phase = moonPhase(a.moon_phase, a.moon_illumination)
    }
    if (!phase) return null
    return {
      k: phase.k,
      waxing: phase.waxing,
      spoken: t('share.spoken.moon', {
        phase: phase.key ? t(`moonPhases.${phase.key}`) : '',
        lit: formatNumber(phase.illumination)
      })
    }
  })

  // the next evening golden hour (sun 6° and falling), from astronomy-engine
  const golden = computed(() => {
    const s = sky.value
    if (!s || !skyFor.value) return null
    const tzv = tz.value
    for (let n = 0; n < 2; n++) {
      const ds = s.dayStartAt(s.dayStart(instant.value, tzv), tzv, n)
      const start = skyFor.value.day(ds).sun.goldenStart
      if (start != null && start >= instant.value - 60000) return clockLabel(minutesInZone(start, tzv))
    }
    return null
  })

  const tide = computed(() => {
    const data = tides.nearest.data
    if (!data?.station || !data.timeline) return null
    const sec = Math.floor(instant.value / 1000)
    const { start, stepSec, levels } = data.timeline
    if (sec < start || sec > start + (levels.length - 2) * stepSec) return null
    const unit = unitStore.unit
    return {
      value: fixed(metresToUnit(levelAt(data, sec), unit), heroDigits(unit)),
      unit: t(`tides.${unitKey(unit)}`),
      rising: isRising(data, sec)
    }
  })

  const wear = computed(() => {
    if (takenAt.value != null) return null
    const ws = windows(weather.forecast, Math.floor(nowMs.value / 1000))
    const win = ws.find((w) => w.id === 'today') || ws[0]
    if (!win) return null
    const f = fahrenheit.value
    const speedUnit = t(f ? 'hourly.mph' : 'hourly.kmh')
    const fmt = {
      temp: (c) => formatTemp(f ? (c * 9) / 5 + 32 : c),
      delta: (c) => formatTemp(f ? (c * 9) / 5 : c),
      hour: (h) => formatHour(h),
      speed: (k) => `${formatNumber(Math.round(f ? k / 1.609 : k))} ${speedUnit}`,
      num: (n) => formatNumber(Math.round(n))
    }
    const prefs = wearStore.prefs
    const rec = recommend(win.summary, prefs, fmt)
    return { outfit: rec.outfit, figure: prefs.figure, headline: wearText(t, rec.headline) }
  })

  const data = computed(() => {
    const m = moment.value
    const f = fahrenheit.value
    const p = place.value
    const tzv = tz.value
    const when = new Date(instant.value)
    const day = new Intl.DateTimeFormat(currentIntlTag(), {
      timeZone: tzv,
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(when)
    const clock = clockLabel(nowMin.value)
    const fd = forecastDay.value?.day
    const speedUnit = t(f ? 'hourly.mph' : 'hourly.kmh')
    const out = {
      placeName: p ? p.name : '',
      regionName: p ? [p.region, p.country].filter(Boolean).join(', ') : '',
      dateLine: takenAt.value != null ? t('share.card.taken', { when: `${day} · ${clock}` }) : `${day} · ${clock}`,
      code: m?.code ?? (forecastDay.value?.day?.condition?.code || 1000),
      nowMin: nowMin.value,
      rise: sunTimes.value.rise,
      set: sunTimes.value.set,
      sunrise: sunTimes.value.rise == null ? '' : clockLabel(sunTimes.value.rise),
      sunset: sunTimes.value.set == null ? '' : clockLabel(sunTimes.value.set),
      moon: moon.value,
      golden: golden.value,
      tide: tide.value,
      temp: '',
      summary: '',
      hilo: '',
      feels: '',
      wind: null,
      uv: null,
      uvText: '',
      aqi: null,
      aqiText: '',
      visibility: null,
      rain: '',
      humidity: '',
      cloud: '',
      wear: null
    }
    if (!m) return out
    out.temp = temp(m.tempC, m.tempF)
    out.summary = m.text
    if (fd) out.hilo = t('share.card.hilo', { hi: temp(fd.maxtemp_c, fd.maxtemp_f), lo: temp(fd.mintemp_c, fd.mintemp_f) })
    out.feels = m.feelsC == null ? '' : t('weather.feelsLike', { temp: temp(m.feelsC, m.feelsF) })
    if (m.windKph != null) {
      const value = formatNumber(Math.round(f ? m.windMph ?? m.windKph / 1.609 : m.windKph))
      out.wind = { degree: m.windDegree ?? 0, value, unit: speedUnit, spoken: t('share.spoken.wind', { value, unit: speedUnit }) }
    }
    if (m.uv != null) {
      out.uv = m.uv
      out.uvText = formatNumber(Math.round(m.uv))
    }
    if (m.aqi != null) {
      out.aqi = m.aqi
      const key = ['good', 'moderate', 'unhealthy', 'unhealthy', 'veryUnhealthy', 'hazardous'][
        Math.max(1, Math.min(6, m.aqi)) - 1
      ]
      out.aqiText = t(`airQualityLevels.${key}`)
    }
    if (m.visKm != null) {
      const value = formatNumber(Math.round(f ? m.visMi ?? m.visKm / 1.609 : m.visKm))
      out.visibility = { km: m.visKm, value, unit: t(f ? 'hourly.detail.units.mi' : 'hourly.detail.units.km') }
    }
    const pct = (v) => (v == null ? '' : `${formatNumber(Math.round(v))}%`)
    out.rain = pct(m.rain)
    out.humidity = pct(m.humidity)
    out.cloud = pct(m.cloud)
    out.wear = wear.value
    return out
  })

  return { data, place, date, hasWeather: computed(() => !!moment.value) }
}
