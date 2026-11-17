import { describe, expect, it } from 'vitest'
import {
  figure,
  recommend,
  scene,
  sentence,
  summarize,
  todOf,
  wearText,
  windows
} from '@/utils/wear'

// One day of WeatherAPI-shaped hours, UTC so the epochs are easy to read.
const DAY0 = Date.UTC(2026, 6, 14) / 1000
function hour(day, h, over = {}) {
  const epoch = DAY0 + day * 86400 + h * 3600
  const date = new Date(epoch * 1000).toISOString().slice(0, 10)
  return {
    time_epoch: epoch,
    time: `${date} ${String(h).padStart(2, '0')}:00`,
    temp_c: 20,
    feelslike_c: 20,
    chance_of_rain: 0,
    chance_of_snow: 0,
    precip_mm: 0,
    wind_kph: 10,
    gust_kph: 14,
    uv: 0,
    humidity: 60,
    is_day: h >= 6 && h < 18 ? 1 : 0,
    condition: { code: 1000 },
    ...over
  }
}
const days = (over = () => ({})) =>
  [0, 1].map((d) => ({ hour: Array.from({ length: 24 }, (_, h) => hour(d, h, over(d, h))) }))
const at = (h, m = 10) => DAY0 + h * 3600 + m * 60

// a summary with sensible defaults
const S = (over = {}) => ({
  feels: 20,
  feelsMin: 18,
  feelsMax: 22,
  rain: 0,
  rainH: null,
  precip: 0,
  snow: 0,
  wind: 10,
  gust: 14,
  uv: 0,
  uvH: null,
  isDay: true,
  kind: 'clear',
  fromH: 12,
  toH: 22,
  ...over
})

// a fake t that shows the key and params, so the tests read the message, not a locale
const t = (key, params = {}) =>
  Object.keys(params).length ? `${key}(${Object.values(params).join(',')})` : key

describe('summarize', () => {
  it('returns null for no hours', () => {
    expect(summarize([])).toBeNull()
  })

  it('reduces a window to averages, extremes and the dominant sky', () => {
    const hrs = [10, 11, 12, 13].map((h, i) =>
      hour(0, h, {
        feelslike_c: 20 + i * 2,
        chance_of_rain: i === 2 ? 70 : 10,
        uv: 7 - i,
        condition: { code: i >= 2 ? 1189 : 1000 }
      })
    )
    const s = summarize(hrs)
    expect(s.feels).toBe(23)
    expect(s.feelsMin).toBe(20)
    expect(s.feelsMax).toBe(26)
    expect(s.rain).toBe(70)
    expect(s.rainH).toBe(12)
    expect(s.uv).toBe(7)
    expect(s.uvH).toBe(10)
    expect(s.kind).toBe('rain')
    expect(s.fromH).toBe(10)
    expect(s.toH).toBe(14)
    expect(s.isDay).toBe(true)
  })

  it('a storm hour wins over everything', () => {
    const hrs = [0, 1, 2].map((h) => hour(0, 12 + h, { condition: { code: h ? 1000 : 1276 } }))
    expect(summarize(hrs).kind).toBe('storm')
  })
})

describe('windows', () => {
  it('offers now, today, tomorrow and the parts of each day', () => {
    const w = windows(days(), at(9))
    const ids = w.map((x) => x.id)
    expect(ids.slice(0, 3)).toEqual(['now', 'today', 'tomorrow'])
    expect(ids).toContain('morning')
    expect(ids).toContain('tomorrow-evening')
    expect(w[0].hours).toHaveLength(3)
    expect(w[0].hours[0].time).toMatch(/09:00$/)
  })

  it('today runs from the current hour to 10 PM', () => {
    const today = windows(days(), at(12)).find((x) => x.id === 'today')
    expect(today.summary.fromH).toBe(12)
    expect(today.summary.toH).toBe(22)
    expect(today.tonight).toBe(false)
  })

  it('after 7 PM today is Tonight, and late it is the next three hours', () => {
    expect(windows(days(), at(19)).find((x) => x.id === 'today').tonight).toBe(true)
    const late = windows(days(), at(21)).find((x) => x.id === 'today')
    expect(late.hours).toHaveLength(3)
  })

  it('drops parts of today that are over', () => {
    const ids = windows(days(), at(15)).map((x) => x.id)
    expect(ids).not.toContain('morning')
    expect(ids).toContain('afternoon')
  })

  it('returns nothing when the forecast is in the past', () => {
    expect(windows(days(), DAY0 + 3 * 86400)).toEqual([])
    expect(windows(undefined, 0)).toEqual([])
  })
})

describe('recommend', () => {
  it.each([
    [35, 'hot', 'tee', 'shorts'],
    [28, 'warm', 'shirt', 'trousers'],
    [20, 'mild', 'longsleeve', 'trousers'],
    [15, 'cool', 'sweater', 'trousers'],
    [5, 'cold', 'sweater', 'trousers'],
    [-5, 'freezing', 'sweater', 'trousers']
  ])('feels like %s° is %s', (feels, band, top, bottom) => {
    const r = recommend(S({ feels, feelsMin: feels, feelsMax: feels }))
    expect(r.band).toBe(band)
    expect(r.outfit.top).toBe(top)
    expect(r.outfit.bottom).toBe(bottom)
  })

  it('band edges belong to the warmer band', () => {
    expect(recommend(S({ feels: 25 })).band).toBe('warm')
    expect(recommend(S({ feels: 24.9 })).band).toBe('mild')
    expect(recommend(S({ feels: 0 })).band).toBe('cold')
  })

  it('"I usually feel" shifts the band by 3°', () => {
    expect(recommend(S({ feels: 23 }), { feel: 1 }).band).toBe('warm')
    expect(recommend(S({ feels: 19 }), { feel: -1 }).band).toBe('cool')
    const r = recommend(S({ feels: 19 }), { feel: -1 })
    expect(r.allReasons.at(-1).t.key).toBe('wear.reason.feelCold')
  })

  it('rain brings an umbrella and leads the reasons', () => {
    const r = recommend(S({ feels: 28, rain: 80, rainH: 12 }))
    expect(r.outfit.held).toBe('umbrella')
    expect(r.headline.key).toBe('wear.headline.umbrella.warm')
    expect(wearText(t, r.reasons[0].t)).toBe('wear.why.rainAt(80,12 PM)')
  })

  it('rain with wind is a raincoat with the hood up', () => {
    const r = recommend(S({ feels: 15, rain: 80, rainH: 10, wind: 34, gust: 58 }))
    expect(r.outfit.outer).toBe('raincoat')
    expect(r.outfit.head).toBe('hood')
    expect(r.outfit.held).toBeNull()
    expect(r.outfit.feet).toBe('boots')
    expect(r.headline.key).toBe('wear.headline.raincoat')
    expect(r.pieces.find((p) => p.slot === 'head').why.key).toBe('wear.why.hoodRain')
  })

  it('a maybe-rain day carries a compact umbrella instead', () => {
    const r = recommend(S({ rain: 40 }))
    expect(r.outfit.held).toBeNull()
    expect(r.carry.map((c) => c.id)).toContain('umbrella')
  })

  it('snow means boots', () => {
    const r = recommend(S({ feels: 3, feelsMin: 2, feelsMax: 4, snow: 85, kind: 'snow' }))
    expect(r.outfit.feet).toBe('boots')
    expect(r.outfit.head).toBe('beanie')
    expect(r.headline.key).toBe('wear.headline.snow')
    expect(r.reasons[0].t).toEqual({ key: 'wear.reason.snowPct', params: { pct: '85' } })
  })

  it('strong sun adds sunglasses, a cap and sunscreen', () => {
    const r = recommend(S({ feels: 30, uv: 9, uvH: 12 }))
    expect(r.outfit.eyes).toBe('sunglasses')
    expect(r.outfit.head).toBe('cap')
    expect(r.carry.map((c) => c.id)).toEqual(expect.arrayContaining(['sunscreen', 'water']))
    expect(recommend(S({ feels: 30, uv: 9 }), { figure: 'woman' }).outfit.head).toBe('sunhat')
  })

  it('no sunglasses at night', () => {
    expect(recommend(S({ uv: 9, isDay: false })).outfit.eyes).toBeNull()
  })

  it('a big swing carries a layer', () => {
    const r = recommend(S({ feelsMin: 12, feelsMax: 24 }))
    expect(r.carry.map((c) => c.id)).toContain('layer')
    expect(r.allReasons.some((x) => x.k === 'swing')).toBe(true)
  })

  it('woman gets a dress when warm, unless dresses are off', () => {
    expect(recommend(S({ feels: 28 }), { figure: 'woman' }).outfit.top).toBe('dress')
    expect(recommend(S({ feels: 28 }), { figure: 'woman', skirts: false }).outfit.top).toBe('shirt')
  })

  it('more coverage keeps long sleeves and long trousers in the heat', () => {
    const r = recommend(S({ feels: 35 }), { coverage: true })
    expect(r.outfit.top).toBe('longsleeve')
    expect(r.outfit.bottom).toBe('trousers')
    expect(r.pieces.find((p) => p.slot === 'top').why.key).toBe('wear.why.coverage')
    expect(r.pieces.find((p) => p.slot === 'top').name.key).toBe('wear.piece.longsleeveLight')
  })

  it('storms are a raincoat headline', () => {
    expect(recommend(S({ kind: 'storm', rain: 90 })).headline.key).toBe('wear.headline.storm')
  })

  it('uses the given formatters', () => {
    const r = recommend(S({ feelsMin: 20, feelsMax: 20 }), {}, { temp: (c) => `${c * 2}F` })
    expect(r.reasons[0].t).toEqual({ key: 'wear.feels.one', params: { t: '40F' } })
  })
})

describe('wearText', () => {
  it('translates nested messages first', () => {
    const msg = { key: 'a', params: { range: { key: 'b', params: { t: '5°' } } } }
    expect(wearText(t, msg)).toBe('a(b(5°))')
    expect(wearText(t, null)).toBe('')
  })
})

describe('sentence', () => {
  it('names the outer layer over the top', () => {
    const r = recommend(S({ feels: 5, feelsMin: 5, feelsMax: 5 }))
    const s = sentence(r)
    expect(s.form).toBe('overWith')
    expect(s.slots).toEqual({ outer: 'coat', top: 'sweater', bottom: 'trousers', feet: 'sneakers' })
    expect(s.extra).toEqual(['scarf'])
  })

  it('a dress has no bottom; the hood is its own line', () => {
    expect(sentence(recommend(S({ feels: 28 }), { figure: 'woman' })).form).toBe('one')
    const s = sentence(recommend(S({ feels: 15, rain: 80, wind: 40 })))
    expect(s.hood).toBe(true)
    expect(s.extra).not.toContain('hood')
  })
})

describe('todOf', () => {
  it('reads the current hour when given', () => {
    expect(todOf(S(), 7)).toBe('morning')
    expect(todOf(S(), 13)).toBe('day')
    expect(todOf(S(), 18)).toBe('evening')
    expect(todOf(S(), 21)).toBe('night')
    expect(todOf(S(), 3)).toBe('night')
  })

  it('otherwise uses the middle of the window', () => {
    expect(todOf(S({ fromH: 6, toH: 12 }))).toBe('morning')
    expect(todOf(S({ fromH: 16, toH: 21 }))).toBe('evening')
    expect(todOf(S({ fromH: 17, toH: 22 }))).toBe('night')
    expect(todOf(null)).toBe('day')
  })

  it('a night window late in the day is night', () => {
    expect(todOf(S({ isDay: false }), 18.5)).toBe('night')
  })
})

describe('figure and scene', () => {
  it('draws every worn piece as a layer', () => {
    const r = recommend(S({ feels: 15, rain: 80, wind: 40 }))
    const f = figure(r.outfit)
    const slots = new Set(f.layers.map((l) => l.slot))
    for (const s of ['outer', 'head', 'feet']) expect(slots.has(s)).toBe(true)
    expect(f.viewBox).toBe('0 -44 240 484')
  })

  it('recolours the street by time of day, with the road in the bottom tenth', () => {
    const day = scene('day')
    const night = scene('night')
    expect(day.viewBox).toBe('0 0 400 300')
    expect(day.sky).not.toEqual(night.sky)
    expect(day.layers.at(-1).d).toContain('L0 300')
  })
})

describe('messages', () => {
  it('every key the engine can return exists in en.json', async () => {
    const en = (await import('@/i18n/locales/en.json')).default
    const has = (key) => key.split('.').reduce((o, k) => (o ? o[k] : undefined), en) !== undefined
    const keys = new Set()
    const walk = (m) => {
      if (!m || typeof m !== 'object') return
      if (m.key) keys.add(m.key)
      Object.values(m.params || {}).forEach(walk)
    }
    for (const feels of [-8, 3, 8, 12, 16, 22, 28, 35])
      for (const over of [
        {},
        { rain: 80, rainH: 9 },
        { rain: 80, wind: 40 },
        { rain: 40 },
        { snow: 85, kind: 'snow' },
        { kind: 'storm', rain: 90 },
        { uv: 11, uvH: 12 },
        { uv: 8 },
        { uv: 6 },
        { feelsMin: feels - 6, feelsMax: feels + 6 }
      ])
        for (const prefs of [
          {},
          { figure: 'woman' },
          { coverage: true },
          { feel: -1 },
          { feel: 1 }
        ]) {
          const r = recommend(S({ feels, feelsMin: feels, feelsMax: feels, ...over }), prefs)
          walk(r.headline)
          r.allReasons.forEach((x) => walk(x.t))
          r.pieces.forEach((p) => (walk(p.name), walk(p.why), keys.add(`wear.a.${p.id}`)))
          r.carry.forEach((c) => (walk(c.name), walk(c.why)))
          keys.add(`wear.sentence.${sentence(r).form}`)
        }
    const missing = [...keys].filter((k) => k !== 'wear.a.hood' && !has(k))
    expect(missing).toEqual([])
  })
})
