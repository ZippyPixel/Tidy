import { describe, expect, it } from 'vitest'
import {
  COMBOS,
  PIECES,
  figure,
  recommend,
  scene,
  sentence,
  summarize,
  todOf,
  wearText,
  wardrobe,
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
  haze: 0,
  from: DAY0 + 12 * 3600,
  fromH: 12,
  toH: 22,
  ...over
})
// every outfit recommend() can pick, as the combos' own pieces
const picks = (summary, prefs = {}, n = 12) =>
  Array.from({ length: n }, (_, shuffle) => recommend(summary, { ...prefs, shuffle }))
const inCombos = (fig, band, o) =>
  COMBOS[fig][band].some((c) => Object.entries(c.o).every(([k, v]) => o[k] === v))

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

  it('counts smoky haze hours', () => {
    const hrs = days((d, h) => (h % 2 ? { condition: { code: 1036, text: 'Smoky haze' } } : {}))[0]
      .hour
    expect(summarize(hrs).haze).toBe(0.5)
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
    [35, 'hot'],
    [28, 'warm'],
    [20, 'mild'],
    [15, 'cool'],
    [5, 'cold'],
    [-5, 'freezing']
  ])("feels like %s° is %s, dressed in one of that band's outfits", (feels, band) => {
    for (const figure of ['man', 'woman']) {
      const r = recommend(S({ feels, feelsMin: feels, feelsMax: feels }), { figure })
      expect(r.band).toBe(band)
      expect(r.style).toBe('everyday')
      expect(inCombos(figure, band, r.outfit)).toBe(true)
    }
  })

  it('picks the same outfit for the same day, and shuffle moves through the list', () => {
    const s = S({ feels: 28 })
    expect(recommend(s).outfit).toEqual(recommend(s).outfit)
    const r0 = recommend(s)
    const tops = new Set(picks(s, {}, r0.options).map((r) => r.outfit.top + r.outfit.bottom))
    expect(tops.size).toBe(r0.options)
    expect(recommend(s, { shuffle: r0.options }).outfit).toEqual(r0.outfit)
  })

  it('options counts the outfits left after the filters', () => {
    const s = S({ feels: 28 })
    const every = recommend(s).options
    const trad = recommend(s, { style: 'traditional' }).options
    expect(recommend(s, { style: 'both' }).options).toBe(every + trad)
  })

  it('style picks traditional outfits, or both', () => {
    for (const r of picks(S({ feels: 28 }), { style: 'traditional' })) {
      expect(r.style).toBe('traditional')
      expect(r.outfit.top).toBe('panjabi')
    }
    const both = new Set(picks(S({ feels: 28 }), { style: 'both' }, 20).map((r) => r.style))
    expect(both).toEqual(new Set(['everyday', 'traditional']))
  })

  it('never suggests a piece that is switched off', () => {
    for (const r of picks(S({ feels: 28 }), { exclude: ['jeans', 'polo'] }))
      expect([r.outfit.top, r.outfit.bottom]).not.toEqual(expect.arrayContaining(['jeans']))
    const rainy = recommend(S({ feels: 28, rain: 80 }), { exclude: ['umbrella'] })
    expect(rainy.outfit.held).toBeNull()
    expect(rainy.carry.map((c) => c.id)).not.toContain('umbrella')
    const sunny = recommend(S({ feels: 30, uv: 9 }), { exclude: ['cap', 'sunglasses'] })
    expect(sunny.outfit.head).toBeNull()
    expect(sunny.outfit.eyes).toBeNull()
  })

  it('falls back to any outfit when the switches leave none', () => {
    const all = [...new Set(COMBOS.man.hot.flatMap((c) => Object.values(c.o)))]
    const r = recommend(S({ feels: 35 }), { exclude: all })
    expect(r.options).toBe(COMBOS.man.hot.length)
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

  it('rain brings an umbrella, lists it to take, and leads the reasons', () => {
    const r = recommend(S({ feels: 28, rain: 80, rainH: 12 }))
    expect(r.outfit.held).toBe('umbrella')
    expect(r.carry[0]).toMatchObject({ id: 'umbrella', name: { key: 'wear.carry.umbrellaFull' } })
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

  it('woman can get a dress or skirt when warm, unless dresses are off', () => {
    const on = picks(S({ feels: 28 }), { figure: 'woman' }).map((r) => r.outfit.top)
    expect(on).toContain('dress')
    for (const r of picks(S({ feels: 28 }), { figure: 'woman', skirts: false })) {
      expect(r.outfit.top).not.toBe('dress')
      expect(r.outfit.bottom).not.toBe('skirt')
    }
  })

  it('more coverage keeps long sleeves and long legs in the heat', () => {
    for (const figure of ['man', 'woman'])
      for (const r of picks(S({ feels: 35 }), { coverage: true, figure })) {
        expect(['tee', 'polo', 'tank', 'dropshoulder', 'top', 'coord', 'dress']).not.toContain(
          r.outfit.top
        )
        expect(['shorts', 'sportshorts']).not.toContain(r.outfit.bottom)
        expect(r.pieces.find((p) => p.slot === 'top').why.key).toBe('wear.why.coverage')
      }
  })

  it('smoky haze carries a mask, and most of the day wears one', () => {
    const some = recommend(S({ haze: 0.4 }))
    expect(some.outfit.mask).toBeNull()
    expect(some.carry.find((c) => c.id === 'mask').why.key).toBe('wear.why.hazePart')
    const most = recommend(S({ haze: 0.8 }))
    expect(most.outfit.mask).toBe('mask')
    expect(most.allReasons.some((x) => x.k === 'haze')).toBe(true)
    expect(recommend(S({ haze: 0.8 }), { exclude: ['mask'] }).outfit.mask).toBeNull()
  })

  it('names the layer in the headline', () => {
    const r = recommend(S({ feels: 13, feelsMin: 12, feelsMax: 14 }))
    expect(r.outfit.outer).toBeTruthy()
    expect(r.headline).toEqual({
      key: 'wear.headline.coolLayer',
      params: { layer: { key: `wear.layer.${r.outfit.outer}` } }
    })
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
    const o = r.outfit
    const s = sentence(r)
    expect(s.form).toBe('overWith')
    expect(s.slots).toEqual({ outer: o.outer, top: o.top, bottom: o.bottom, feet: o.feet })
  })

  it('a dress has no bottom; the hood is its own line', () => {
    const dress = picks(S({ feels: 28 }), { figure: 'woman' }).find((r) => r.outfit.top === 'dress')
    expect(sentence(dress).form).toBe('one')
    const s = sentence(recommend(S({ feels: 15, rain: 80, wind: 40 })))
    expect(s.hood).toBe(true)
    expect(s.extra).not.toContain('hood')
  })
})

describe('wardrobe', () => {
  it('groups what each figure can own, every piece once', () => {
    for (const fig of ['man', 'woman']) {
      const groups = wardrobe(fig)
      expect(groups.map((g) => g.id)).toEqual(['tops', 'bottoms', 'layers', 'shoes', 'extras'])
      const ids = groups.flatMap((g) => g.items)
      expect(new Set(ids).size).toBe(ids.length)
      for (const id of ids) expect(PIECES).toContain(id)
    }
    expect(wardrobe('woman').find((g) => g.id === 'extras').items).toContain('dupatta')
    expect(wardrobe('man').flatMap((g) => g.items)).not.toContain('dupatta')
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

  it('draws every outfit of every figure, with a layer for each piece', () => {
    for (const fig of ['man', 'woman'])
      for (const band of Object.keys(COMBOS[fig]))
        for (const c of COMBOS[fig][band])
          for (const tone of ['light', 'mid', 'dark']) {
            const outfit = { mask: 'mask', ...c.o, tone }
            const f = figure(outfit, { figure: fig })
            const slots = new Set(f.layers.map((l) => l.slot))
            for (const k of Object.keys(outfit)) if (k !== 'tone') expect(slots.has(k)).toBe(true)
            expect(f.layers.every((l) => !/NaN|undefined/.test(l.d))).toBe(true)
          }
  })

  it('recolours the street by time of day, with the road in the bottom tenth', () => {
    const day = scene('day')
    const night = scene('night')
    expect(day.viewBox).toBe('0 0 400 300')
    expect(day.sky).not.toEqual(night.sky)
    expect(day.layers.at(-1).d).toContain('L0 300')
    expect(day.road).toBe(day.layers.at(-1).fill)
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
        { feelsMin: feels - 6, feelsMax: feels + 6 },
        { haze: 0.5 },
        { haze: 0.9, wind: 40 }
      ])
        for (const prefs of [
          {},
          { figure: 'woman' },
          { coverage: true },
          { feel: -1 },
          { feel: 1 },
          { style: 'traditional' },
          { style: 'both', figure: 'woman', shuffle: 1 },
          { style: 'both', shuffle: 2, coverage: true },
          { figure: 'woman', style: 'traditional', shuffle: 3 }
        ]) {
          const r = recommend(S({ feels, feelsMin: feels, feelsMax: feels, ...over }), prefs)
          walk(r.headline)
          r.allReasons.forEach((x) => walk(x.t))
          r.pieces.forEach((p) => (walk(p.name), walk(p.why), keys.add(`wear.a.${p.id}`)))
          r.carry.forEach((c) => (walk(c.name), walk(c.why)))
          keys.add(`wear.sentence.${sentence(r).form}`)
        }
    for (const id of PIECES) keys.add(`wear.piece.${id}`)
    for (const g of wardrobe('woman')) keys.add(`wear.group.${g.id}`)
    const missing = [...keys].filter((k) => k !== 'wear.a.hood' && !has(k))
    expect(missing).toEqual([])
  })
})
