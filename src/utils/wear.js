/* What to wear: pure functions, no DOM, no network. Ported from design/wear-engine.js.
 *
 *   summarize(hours)            hourly forecast rows (WeatherAPI shape) -> one summary of that time window
 *   windows(days, nowEpoch)     -> the windows the UI offers: now, today, tomorrow, and the parts of each day
 *   recommend(summary, prefs)   -> { band, outfit, headline, reasons, pieces, carry } (text as i18n messages)
 *   figure(outfit, opts)        -> { viewBox, layers } : the character as flat SVG shapes, back to front
 *   scene(tod)                  -> the street behind the character, coloured by time of day (never by theme)
 *   todOf(summary, nowHour)     -> morning | day | evening | night
 *   sentence(rec)               -> the outfit as one sentence, as a template id and slots
 *
 * The outfit object is the contract between the rules and any renderer:
 *   { top, bottom, outer, feet, head, neck, hands, eyes, held, tone }   every value is an id or null
 */
/* eslint-disable no-var */

var KIND = {
  1000: 'clear',
  1003: 'partly',
  1006: 'cloudy',
  1009: 'cloudy',
  1030: 'fog',
  1135: 'fog',
  1147: 'fog',
  1087: 'storm',
  1273: 'storm',
  1276: 'storm',
  1279: 'storm',
  1282: 'storm'
}
;[
  1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258, 1069, 1204, 1207, 1237, 1249,
  1252, 1261, 1264
].forEach(function (c) {
  KIND[c] = 'snow'
})
;[
  1063, 1072, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243,
  1246
].forEach(function (c) {
  KIND[c] = 'rain'
})
function kindOf(code) {
  return KIND[code] || 'cloudy'
}

function hourOf(h) {
  return Number(String(h.time).slice(11, 13))
}
function max(a, f) {
  var m = -Infinity,
    at = null
  a.forEach(function (x) {
    var v = f(x)
    if (v > m) {
      m = v
      at = x
    }
  })
  return { v: m, at: at }
}

function summarize(hours) {
  if (!hours || !hours.length) return null
  var n = hours.length,
    sum = function (f) {
      return hours.reduce(function (s, h) {
        return s + (Number(f(h)) || 0)
      }, 0)
    }
  var feels = hours.map(function (h) {
    return h.feelslike_c
  })
  var rain = max(hours, function (h) {
      return h.chance_of_rain || 0
    }),
    snow = max(hours, function (h) {
      return h.chance_of_snow || 0
    })
  var uv = max(hours, function (h) {
      return h.is_day ? h.uv || 0 : 0
    }),
    gust = max(hours, function (h) {
      return h.gust_kph || 0
    })
  var count = {}
  hours.forEach(function (h) {
    var k = kindOf(h.condition && h.condition.code)
    count[k] = (count[k] || 0) + 1
  })
  var firstWet = hours.filter(function (h) {
    return (h.chance_of_rain || 0) >= 50
  })[0]
  var kind = count.storm
    ? 'storm'
    : snow.v >= 50 || (count.snow || 0) >= n / 4
    ? 'snow'
    : rain.v >= 50 || (count.rain || 0) >= n / 3
    ? 'rain'
    : ['fog', 'cloudy', 'partly', 'clear'].sort(function (a, b) {
        return (count[b] || 0) - (count[a] || 0)
      })[0]
  return {
    from: hours[0].time_epoch,
    to: hours[n - 1].time_epoch + 3600,
    fromH: hourOf(hours[0]),
    toH: (hourOf(hours[n - 1]) + 1) % 24,
    feels:
      sum(function (h) {
        return h.feelslike_c
      }) / n,
    feelsMin: Math.min.apply(null, feels),
    feelsMax: Math.max.apply(null, feels),
    temp:
      sum(function (h) {
        return h.temp_c
      }) / n,
    rain: rain.v,
    rainH: firstWet ? hourOf(firstWet) : rain.at ? hourOf(rain.at) : null,
    precip: sum(function (h) {
      return h.precip_mm
    }),
    snow: snow.v,
    wind: max(hours, function (h) {
      return h.wind_kph || 0
    }).v,
    gust: gust.v,
    uv: uv.v,
    uvH: uv.at ? hourOf(uv.at) : null,
    humidity:
      sum(function (h) {
        return h.humidity
      }) / n,
    kind: kind,
    isDay:
      sum(function (h) {
        return h.is_day ? 1 : 0
      }) >=
      n / 2
  }
}

/* The windows the UI offers. `days` is forecast.forecastday from forecast.json, `now` is epoch seconds.
   Each window has an `id` (now, today, tomorrow, morning, afternoon, evening, tomorrow-morning, ...);
   `tonight` marks the "today" window late in the evening, so the UI can call it Tonight. */
var PARTS = [
  ['morning', 6, 12],
  ['afternoon', 12, 17],
  ['evening', 17, 22]
]
function windows(days, now) {
  var all = []
  ;(days || []).forEach(function (d, di) {
    ;(d.hour || []).forEach(function (h) {
      all.push({ h: h, day: di })
    })
  })
  var ahead = all.filter(function (x) {
    return x.h.time_epoch + 3600 > now
  })
  var cur = ahead[0]
  if (!cur) return []
  var d0 = cur.day,
    nowH = hourOf(cur.h),
    out = []
  var pick = function (day, a, b, fromNow) {
    return all
      .filter(function (x) {
        var hh = hourOf(x.h)
        return x.day === day && hh >= a && hh < b && (!fromNow || x.h.time_epoch + 3600 > now)
      })
      .map(function (x) {
        return x.h
      })
  }
  var add = function (id, day, hours, group, extra) {
    if (!hours.length) return
    var w = {
      id: id,
      day: day === d0 ? 'today' : 'tomorrow',
      group: group,
      hours: hours,
      summary: summarize(hours)
    }
    for (var k in extra || {}) w[k] = extra[k]
    out.push(w)
  }
  var next3 = ahead.slice(0, 3).map(function (x) {
    return x.h
  })
  add('now', d0, next3, 'main')
  /* "today" is the rest of today until 10 PM; late in the evening it is the next three hours */
  var rest = pick(d0, nowH, 22, true)
  add('today', d0, rest.length >= 3 ? rest : next3, 'main', { tonight: nowH >= 19 })
  add('tomorrow', d0 + 1, pick(d0 + 1, 6, 22), 'main')
  PARTS.forEach(function (p) {
    add(p[0], d0, pick(d0, p[1], p[2], true), 'today', { part: p[0] })
  })
  PARTS.forEach(function (p) {
    add('tomorrow-' + p[0], d0 + 1, pick(d0 + 1, p[1], p[2]), 'tomorrow', { part: p[0] })
  })
  return out
}

/* ------------------------------------------------------------------ summary -> outfit */

var BANDS = [
  ['freezing', 0],
  ['cold', 10],
  ['cool', 18],
  ['mild', 25],
  ['warm', 32],
  ['hot', Infinity]
]
function bandOf(c) {
  for (var i = 0; i < BANDS.length; i++) if (c < BANDS[i][1]) return BANDS[i][0]
  return 'hot'
}

var SLOTS = ['outer', 'top', 'bottom', 'feet', 'head', 'eyes', 'neck', 'hands', 'held']

function defaults(prefs) {
  var p = { figure: 'man', feel: 0, coverage: false, skirts: true }
  for (var k in prefs || {}) if (prefs[k] !== undefined) p[k] = prefs[k]
  return p
}

/* A message for i18n: { key, params }. A param that is itself a message is translated first (wearText). */
function M(key, params) {
  return params ? { key: key, params: params } : { key: key }
}

var FMT = {
  temp: function (c) {
    return Math.round(c) + '°'
  },
  delta: function (c) {
    return Math.round(c) + '°'
  },
  hour: function (h) {
    return (h % 12 || 12) + (h < 12 ? ' AM' : ' PM')
  },
  speed: function (k) {
    return Math.round(k) + ' km/h'
  },
  num: function (n) {
    return String(Math.round(n))
  }
}

/* fmt: { temp(c), delta(c), hour(h), speed(kph), num(n) } so the app can localise and switch units.
   Text comes back as messages ({ key, params }) under wear.* in the locale files. */
function recommend(s, prefs, fmt) {
  var p = defaults(prefs),
    F = {}
  for (var fk in FMT) F[fk] = (fmt && fmt[fk]) || FMT[fk]
  var shift = p.feel * 3,
    eff = s.feels + shift,
    band = bandOf(eff) // feel: -1 feels cold easily, +1 feels warm easily
  var wet = s.rain >= 50 || s.precip >= 1,
    maybeWet = !wet && s.rain >= 30,
    windy = s.wind >= 30 || s.gust >= 45
  var snowy = s.kind === 'snow' || s.snow >= 50,
    sunny = s.isDay && s.uv >= 6 && !wet && s.kind !== 'storm' && !snowy,
    swing = s.feelsMax - s.feelsMin >= 8
  var woman = p.figure === 'woman',
    skirts = woman && p.skirts
  var o = {
    top: null,
    bottom: 'trousers',
    outer: null,
    feet: 'sneakers',
    head: null,
    neck: null,
    hands: null,
    eyes: null,
    held: null,
    tone: 'mid'
  }
  var why = {}

  if (band === 'hot') {
    o.top = 'tee'
    o.bottom = 'shorts'
    o.feet = 'sandals'
    o.tone = 'light'
  } else if (band === 'warm') {
    o.top = 'shirt'
    o.tone = 'light'
  } else if (band === 'mild') {
    o.top = 'longsleeve'
    if (windy || s.feelsMin + shift < 15) o.outer = 'jacket'
  } else if (band === 'cool') {
    o.top = 'sweater'
    if (eff < 14 || windy) o.outer = 'jacket'
  } else if (band === 'cold') {
    o.top = 'sweater'
    o.outer = 'coat'
    o.neck = 'scarf'
    o.tone = 'dark'
    if (eff < 5) o.feet = 'boots'
    if (eff <= 1) o.hands = 'gloves'
  } else {
    o.top = 'sweater'
    o.outer = 'puffer'
    o.head = 'beanie'
    o.neck = 'scarf'
    o.hands = 'gloves'
    o.feet = 'boots'
    o.tone = 'dark'
  }

  if (skirts && (band === 'hot' || band === 'warm')) {
    o.top = 'dress'
    o.bottom = null
  } else if (skirts && band === 'mild') o.bottom = 'skirt'
  if (p.coverage && (band === 'hot' || band === 'warm')) {
    o.top = 'longsleeve'
    o.bottom = skirts ? 'skirt' : 'trousers'
    o.tone = 'light'
    why.top = M('wear.why.coverage')
  }
  if (p.coverage && o.bottom === 'shorts') o.bottom = 'trousers'

  var one = Math.round(s.feelsMin) === Math.round(s.feelsMax)
  var range = one
    ? M('wear.feels.one', { t: F.temp(s.feelsMin) })
    : M('wear.feels.span', { lo: F.temp(s.feelsMin), hi: F.temp(s.feelsMax) })
  var rangeLow = one
    ? M('wear.feelsLow.one', { t: F.temp(s.feelsMin) })
    : M('wear.feelsLow.span', { lo: F.temp(s.feelsMin), hi: F.temp(s.feelsMax) })
  var rainTxt =
    s.rainH != null
      ? M('wear.why.rainAt', { pct: F.num(s.rain), hour: F.hour(s.rainH) })
      : M('wear.why.rain', { pct: F.num(s.rain) })
  var uvTxt =
    s.uvH != null
      ? M('wear.why.uvAt', { uv: F.num(s.uv), hour: F.hour(s.uvH) })
      : M('wear.why.uv', { uv: F.num(s.uv) })
  var windTxt = M('wear.why.wind', { speed: F.speed(Math.max(s.wind, s.gust)) })

  if (wet && !snowy) {
    if (windy && band !== 'cold' && band !== 'freezing') {
      o.outer = 'raincoat'
      o.head = 'hood'
      why.head = M('wear.why.hoodRain')
      why.outer = M('wear.why.rainWind', { speed: F.speed(Math.max(s.wind, s.gust)) })
    } else if (windy) {
      why.outer = M('wear.why.tooGusty', { speed: F.speed(Math.max(s.wind, s.gust)) })
    } else {
      o.held = 'umbrella'
      why.held = rainTxt
    }
    if (band === 'cool' || band === 'cold') o.feet = 'boots'
  }
  if (snowy) {
    o.feet = 'boots'
    if (band === 'cold' && !o.head) o.head = 'beanie'
    why.feet = M('wear.why.snowGround')
  }
  if (sunny) {
    o.eyes = 'sunglasses'
    why.eyes = uvTxt
    if (!o.head && (band === 'hot' || band === 'warm' || band === 'mild')) {
      o.head = woman ? 'sunhat' : 'cap'
      why.head = uvTxt
    }
  }

  var pieces = SLOTS.filter(function (k) {
    return o[k]
  }).map(function (k) {
    var id = o[k],
      name = M('wear.piece.' + id)
    if (id === 'trousers' && o.tone === 'light') name = M('wear.piece.trousersLight')
    if (id === 'longsleeve' && o.tone === 'light') name = M('wear.piece.longsleeveLight')
    var w =
      why[k] ||
      (k === 'feet' && id === 'boots'
        ? wet
          ? M('wear.why.wetGround')
          : M('wear.why.coldGround', { range: rangeLow })
        : k === 'feet' && id === 'sandals'
        ? M('wear.why.dryHot')
        : k === 'outer' && windy
        ? windTxt
        : k === 'head' && id === 'beanie'
        ? M('wear.why.heatIn')
        : k === 'top' && o.tone === 'light'
        ? M('wear.why.lightColours', { range: range })
        : range)
    return { slot: k, id: id, name: name, why: w }
  })

  var carry = []
  if (maybeWet) carry.push({ id: 'umbrella', name: M('wear.carry.umbrella'), why: rainTxt })
  if (swing && band !== 'freezing')
    carry.push({
      id: 'layer',
      name: M('wear.carry.layer'),
      why: M('wear.why.dropsTo', { t: F.temp(s.feelsMin) })
    })
  if (eff >= 30) carry.push({ id: 'water', name: M('wear.carry.water'), why: M('wear.why.hotOut') })
  if (sunny)
    carry.push({
      id: 'sunscreen',
      name: M('wear.carry.sunscreen'),
      why: M('wear.why.uvLevel', {
        uv: F.num(s.uv),
        level: M('wear.uvLevel.' + (s.uv >= 11 ? 'extreme' : s.uv >= 8 ? 'veryHigh' : 'high'))
      })
    })

  var base = {
    hot: 'hot',
    warm: 'warm',
    mild: o.outer ? 'mildJacket' : 'mild',
    cool: o.outer ? 'coolJacket' : 'cool',
    cold: 'cold',
    freezing: 'freezing'
  }[band]
  var headline =
    s.kind === 'storm'
      ? 'storm'
      : snowy
      ? band === 'freezing'
        ? 'snowFreezing'
        : 'snow'
      : o.outer === 'raincoat'
      ? 'raincoat'
      : o.held === 'umbrella'
      ? 'umbrella.' + band
      : base

  var reasons = []
  if (snowy)
    reasons.push({
      k: 'snow',
      t: s.snow ? M('wear.reason.snowPct', { pct: F.num(s.snow) }) : M('wear.reason.snow')
    })
  else if (wet || maybeWet) reasons.push({ k: 'rain', t: rainTxt })
  reasons.push({ k: 'temp', t: range })
  if (windy) reasons.push({ k: 'wind', t: windTxt })
  if (sunny) reasons.push({ k: 'uv', t: uvTxt })
  if (swing)
    reasons.push({
      k: 'swing',
      t: M('wear.reason.swing', { deg: F.delta(s.feelsMax - s.feelsMin) })
    })
  if (p.feel)
    reasons.push({ k: 'temp', t: M(p.feel < 0 ? 'wear.reason.feelCold' : 'wear.reason.feelWarm') })

  return {
    band: band,
    outfit: o,
    headline: M('wear.headline.' + headline),
    reasons: reasons.slice(0, 3),
    allReasons: reasons,
    pieces: pieces,
    carry: carry
  }
}

/* ------------------------------------------------------------------ colour */

function rgb(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
}
function shade(h, k) {
  var t = k < 0 ? 0 : 255,
    a = Math.abs(k)
  return (
    '#' +
    rgb(h)
      .map(function (v) {
        return Math.round(v + (t - v) * a)
          .toString(16)
          .padStart(2, '0')
      })
      .join('')
  )
}

/* The character's look. Only the defaults are used for now; skin, hair and hair colour are the hooks for
   character customisation later (Weather Fit style: skin tone, hairstyle, hair colour, brows, glasses, beard). */
var SKINS = {
  light: ['#F6CDAE', '#E9AE8A'],
  peach: ['#F2BE98', '#E39E78'],
  tan: ['#D9A274', '#C2855A'],
  brown: ['#B97C52', '#9E6440'],
  deep: ['#7E5034', '#683F27']
}
var LOOK = {
  man: { skin: 'peach', hair: 'curly', hairColor: '#4A2A22' },
  woman: { skin: 'peach', hair: 'long', hairColor: '#3B231D' }
}
var INK = '#241B1A',
  BROW = '#4A2E26',
  LIPS = '#C9606A'

/* each piece: [light, mid, dark]. Flat fills; a darker side band is added by the renderer. */
var COLORS = {
  tee: ['#F5F1E8', '#B9D2EE', '#3E4A63'],
  shirt: ['#F1E6D2', '#D44C3F', '#4B5560'],
  longsleeve: ['#F4EBDD', '#BC7B47', '#4F5A3E'],
  sweater: ['#EBDFCB', '#D6463B', '#2E3B5C'],
  dress: ['#F5E4CC', '#E59CB6', '#7D4B66'],
  shorts: ['#D9C9A8', '#5C86BE', '#3B4458'],
  trousers: ['#DDD0BA', '#8C7E77', '#2A2A30'],
  skirt: ['#EADBC3', '#8C7E77', '#4A3A44'],
  jacket: ['#C9B8DD', '#6B4486', '#3F3552'],
  raincoat: ['#F5C534', '#F5C534', '#F5C534'],
  coat: ['#C49A6C', '#C49A6C', '#7A5A44'],
  puffer: ['#4467A6', '#4467A6', '#33456E'],
  sneakers: ['#F7F7F5', '#5A5D63', '#3B3E44'],
  boots: ['#7B5236', '#7B5236', '#5C3C28'],
  sandals: ['#8C6A4E', '#8C6A4E', '#8C6A4E'],
  cap: ['#F2EEE6', '#3F6A94', '#2E3646'],
  sunhat: ['#EAD7AE', '#EAD7AE', '#EAD7AE'],
  beanie: ['#D5D5D5', '#D5D5D5', '#D5D5D5'],
  scarf: ['#D2483F', '#D2483F', '#D2483F'],
  gloves: ['#2E2E33', '#2E2E33', '#2E2E33'],
  sunglasses: ['#1F2128', '#1F2128', '#1F2128'],
  umbrella: ['#CFE3F3', '#CFE3F3', '#CFE3F3']
}
function colorOf(id, tone) {
  var i = tone === 'light' ? 0 : tone === 'dark' ? 2 : 1
  return (COLORS[id] || ['#999', '#999', '#999'])[i]
}

/* ------------------------------------------------------------------ outfit -> SVG layers (the character) */

/* Measurements in a 240-wide box, x = 120 is the centre line, the feet stand on y = 428.
   A three.js character can be built from the same numbers. */
var BUILD = {
  man: {
    face: [31, 34, 76, 114, 24],
    ear: [6, 9],
    neck: 10,
    sy: 128,
    sw: 37,
    shR: 9.5,
    chest: [34, 152],
    waist: [30, 205],
    hip: [32, 238],
    crotch: 252,
    elbow: [42, 198, 7.6],
    wrist: [45, 256, 6],
    hand: [45.5, 270, 6.4, 11.5],
    hipJ: [16, 246, 15.5],
    knee: [16.5, 336, 11],
    ankle: [17, 410, 7.5],
    foot: [21, 419, 13, 7]
  },
  woman: {
    face: [29, 36, 76, 112, 21],
    ear: [5.5, 8.5],
    neck: 9,
    sy: 128,
    sw: 33,
    shR: 8.6,
    chest: [30, 152],
    waist: [25, 200],
    hip: [32, 238],
    crotch: 252,
    elbow: [37.5, 198, 6.8],
    wrist: [41, 254, 5.4],
    hand: [41.5, 267, 6, 10.5],
    hipJ: [16, 246, 15],
    knee: [15.5, 336, 10],
    ankle: [16, 410, 7],
    foot: [19.5, 420, 12, 6.5]
  }
}
var CX = 120,
  VIEW = [0, -44, 240, 484],
  GROUND = 428
function r1(n) {
  return Math.round(n * 10) / 10
}

/* rounded polygon: points [x, y, radius?] */
function rpoly(pts, rad) {
  var n = pts.length,
    d = ''
  for (var i = 0; i < n; i++) {
    var p = pts[i],
      a = pts[(i + n - 1) % n],
      b = pts[(i + 1) % n],
      r = p[2] == null ? rad : p[2]
    var la = Math.hypot(a[0] - p[0], a[1] - p[1]),
      lb = Math.hypot(b[0] - p[0], b[1] - p[1])
    var ra = Math.min(r, la / 2),
      rb = Math.min(r, lb / 2)
    var ax = p[0] + ((a[0] - p[0]) / (la || 1)) * ra,
      ay = p[1] + ((a[1] - p[1]) / (la || 1)) * ra,
      bx = p[0] + ((b[0] - p[0]) / (lb || 1)) * rb,
      by = p[1] + ((b[1] - p[1]) / (lb || 1)) * rb
    d +=
      (i ? 'L' : 'M') +
      r1(ax) +
      ' ' +
      r1(ay) +
      'Q' +
      r1(p[0]) +
      ' ' +
      r1(p[1]) +
      ' ' +
      r1(bx) +
      ' ' +
      r1(by)
  }
  return d + 'Z'
}
/* mirror a right-hand outline (distances from the centre line, top to bottom) into a closed shape */
function sym(right, rad, top, bottom) {
  var pts = []
  if (top) pts.push([CX, top[0], top[1]])
  right.forEach(function (p) {
    pts.push([CX + p[0], p[1], p[2]])
  })
  if (bottom) pts.push([CX, bottom[0], bottom[1]])
  right
    .slice()
    .reverse()
    .forEach(function (p) {
      pts.push([CX - p[0], p[1], p[2]])
    })
  return rpoly(pts, rad)
}
/* tapered limb between two joints; flat = cut square at the far end */
function limb(x1, y1, ra, x2, y2, rb, flat) {
  var dx = x2 - x1,
    dy = y2 - y1,
    l = Math.hypot(dx, dy) || 1,
    nx = -dy / l,
    ny = dx / l
  var d =
    'M' +
    r1(x1 + nx * ra) +
    ' ' +
    r1(y1 + ny * ra) +
    'L' +
    r1(x2 + nx * rb) +
    ' ' +
    r1(y2 + ny * rb)
  d += flat
    ? 'L' + r1(x2 - nx * rb) + ' ' + r1(y2 - ny * rb)
    : 'A' + r1(rb) + ' ' + r1(rb) + ' 0 0 0 ' + r1(x2 - nx * rb) + ' ' + r1(y2 - ny * rb)
  return (
    d +
    'L' +
    r1(x1 - nx * ra) +
    ' ' +
    r1(y1 - ny * ra) +
    'A' +
    r1(ra) +
    ' ' +
    r1(ra) +
    ' 0 0 0 ' +
    r1(x1 + nx * ra) +
    ' ' +
    r1(y1 + ny * ra) +
    'Z'
  )
}
/* a band across a limb between t0 and t1 (0 = first joint, 1 = second) */
function band(a, b, ra, rb, t0, t1) {
  var dx = b[0] - a[0],
    dy = b[1] - a[1],
    l = Math.hypot(dx, dy) || 1,
    nx = -dy / l,
    ny = dx / l
  var p = function (t, s) {
    var r = ra + (rb - ra) * t
    return r1(a[0] + dx * t + s * nx * r) + ' ' + r1(a[1] + dy * t + s * ny * r)
  }
  return 'M' + p(t0, 1) + 'L' + p(t1, 1) + 'L' + p(t1, -1) + 'L' + p(t0, -1) + 'Z'
}
function oval(x, y, rx, ry) {
  return (
    'M' +
    r1(x - rx) +
    ' ' +
    r1(y) +
    'A' +
    r1(rx) +
    ' ' +
    r1(ry) +
    ' 0 1 0 ' +
    r1(x + rx) +
    ' ' +
    r1(y) +
    'A' +
    r1(rx) +
    ' ' +
    r1(ry) +
    ' 0 1 0 ' +
    r1(x - rx) +
    ' ' +
    r1(y) +
    'Z'
  )
}
function lerp(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

function figure(outfit, opts) {
  opts = opts || {}
  var kind = opts.figure === 'woman' ? 'woman' : 'man',
    B = BUILD[kind],
    o = outfit || {},
    tone = o.tone || 'mid',
    L = []
  var look = LOOK[kind],
    skinPair = SKINS[opts.skin || look.skin] || SKINS.peach,
    SKIN = skinPair[0],
    SKIN2 = skinPair[1]
  var hairColor = opts.hairColor || look.hairColor,
    hairStyle = opts.hair || look.hair
  var only = opts.only || null
  var put = function (slot, d, fill, extra) {
    var x = { slot: slot, d: d, fill: fill }
    for (var k in extra || {}) x[k] = extra[k]
    L.push(x)
  }
  var line = function (slot, d, stroke, w, extra) {
    var x = { slot: slot, d: d, fill: 'none', stroke: stroke, sw: w || 1.5, cap: 'round' }
    for (var k in extra || {}) x[k] = extra[k]
    L.push(x)
  }
  var col = function (id) {
    return colorOf(id, tone)
  }
  var both = function (f) {
    f(-1)
    f(1)
  }
  var holding = o.held === 'umbrella'
  var hooded = o.head === 'hood'

  /* joints. The character's left hand (screen right) bends up to hold the umbrella. */
  var sh = function (s) {
    return [CX + s * (B.sw - 2), B.sy + 7]
  }
  var el = function (s) {
    return s > 0 && holding ? [CX + B.sw + 16, 198] : [CX + s * B.elbow[0], B.elbow[1]]
  }
  var wr = function (s) {
    return s > 0 && holding ? [CX + B.sw + 8, 162] : [CX + s * B.wrist[0], B.wrist[1]]
  }
  var hd = function (s) {
    return s > 0 && holding ? [CX + B.sw + 7, 152] : [CX + s * B.hand[0], B.hand[1]]
  }
  var hipJ = function (s) {
      return [CX + s * B.hipJ[0], B.hipJ[1]]
    },
    kn = function (s) {
      return [CX + s * B.knee[0], B.knee[1]]
    },
    an = function (s) {
      return [CX + s * B.ankle[0], B.ankle[1]]
    }
  var F = B.face,
    fw = F[0],
    fTop = F[1],
    fCheek = F[2],
    fChin = F[3],
    fJaw = F[4]
  var facePath =
    'M' +
    (CX - fw) +
    ' ' +
    (fCheek - 12) +
    'C' +
    (CX - fw) +
    ' ' +
    (fTop - 4) +
    ' ' +
    (CX + fw) +
    ' ' +
    (fTop - 4) +
    ' ' +
    (CX + fw) +
    ' ' +
    (fCheek - 12) +
    'L' +
    (CX + fw) +
    ' ' +
    (fCheek + 6) +
    'C' +
    (CX + fw) +
    ' ' +
    (fChin - 12) +
    ' ' +
    (CX + fJaw * 0.55) +
    ' ' +
    fChin +
    ' ' +
    CX +
    ' ' +
    fChin +
    'C' +
    (CX - fJaw * 0.55) +
    ' ' +
    fChin +
    ' ' +
    (CX - fw) +
    ' ' +
    (fChin - 12) +
    ' ' +
    (CX - fw) +
    ' ' +
    (fCheek + 6) +
    'Z'

  /* ---- umbrella canopy: clear, pale blue, with ribs (behind the head) */
  var ux = hd(1)[0],
    uTop = -38,
    uBot = 18
  if (holding) {
    var uc = col('umbrella'),
      w = 86,
      seg = w / 2,
      rib = '#7F9AB3'
    put(
      'held',
      'M' +
        (ux - w) +
        ' ' +
        uBot +
        'A' +
        w +
        ' ' +
        (uBot - uTop) +
        ' 0 0 1 ' +
        (ux + w) +
        ' ' +
        uBot +
        [3, 2, 1, 0]
          .map(function (i) {
            return 'A' + seg / 2 + ' 7 0 0 0 ' + (ux - w + i * seg) + ' ' + uBot
          })
          .join('') +
        'Z',
      uc,
      { o: 0.88 }
    )
    ;[-1, -0.5, 0.5, 1].forEach(function (s) {
      line(
        'held',
        'M' +
          ux +
          ' ' +
          uTop +
          'Q' +
          (ux + s * w * 0.45) +
          ' ' +
          (uTop + 10) +
          ' ' +
          (ux + s * w) +
          ' ' +
          uBot,
        rib,
        1.2
      )
    })
    line(
      'held',
      'M' +
        (ux - w) +
        ' ' +
        uBot +
        'A' +
        w +
        ' ' +
        (uBot - uTop) +
        ' 0 0 1 ' +
        (ux + w) +
        ' ' +
        uBot,
      rib,
      1.4
    )
    line('held', 'M' + ux + ' ' + (uTop - 7) + 'L' + ux + ' ' + uTop, '#2B2E35', 2.6)
  }

  /* ---- long hair falls behind the shoulders */
  if (hairStyle === 'long' && !hooded) {
    put(
      'hair',
      'M' +
        (CX - fw - 9) +
        ' ' +
        (fCheek - 18) +
        'C' +
        (CX - fw - 14) +
        ' ' +
        (fTop - 18) +
        ' ' +
        (CX + fw + 14) +
        ' ' +
        (fTop - 18) +
        ' ' +
        (CX + fw + 9) +
        ' ' +
        (fCheek - 18) +
        'C' +
        (CX + fw + 14) +
        ' ' +
        (fCheek + 30) +
        ' ' +
        (CX + fw + 18) +
        ' ' +
        (B.sy + 40) +
        ' ' +
        (CX + fw + 12) +
        ' ' +
        (B.sy + 62) +
        'Q' +
        (CX + 20) +
        ' ' +
        (B.sy + 70) +
        ' ' +
        CX +
        ' ' +
        (B.sy + 54) +
        'Q' +
        (CX - 20) +
        ' ' +
        (B.sy + 70) +
        ' ' +
        (CX - fw - 12) +
        ' ' +
        (B.sy + 62) +
        'C' +
        (CX - fw - 18) +
        ' ' +
        (B.sy + 40) +
        ' ' +
        (CX - fw - 14) +
        ' ' +
        (fCheek + 30) +
        ' ' +
        (CX - fw - 9) +
        ' ' +
        (fCheek - 18) +
        'Z',
      hairColor
    )
  }
  if (hooded)
    put('head', oval(CX, fCheek - 4, fw + 13, fChin - fCheek + 34), shade(col('raincoat'), -0.12))

  /* ---- body */
  both(function (s) {
    put(
      'body',
      limb(hipJ(s)[0], hipJ(s)[1], B.hipJ[2], kn(s)[0], kn(s)[1], B.knee[2]) +
        limb(kn(s)[0], kn(s)[1], B.knee[2], an(s)[0], an(s)[1], B.ankle[2]),
      SKIN
    )
  })
  both(function (s) {
    put('body', oval(CX + s * B.foot[0], B.foot[1], B.foot[2], B.foot[3]), SKIN)
  })
  put(
    'body',
    sym(
      [
        [B.neck + 3, B.sy - 8, 4],
        [B.sw * 0.6, B.sy - 4, 10],
        [B.sw, B.sy + 4, 9],
        [B.chest[0], B.chest[1], 16],
        [B.waist[0], B.waist[1], 22],
        [B.hip[0], B.hip[1], 18],
        [B.hip[0] - 3, B.crotch, 12]
      ],
      8,
      null,
      [B.crotch + 6, 8]
    ),
    SKIN
  )
  both(function (s) {
    put(
      'body',
      limb(sh(s)[0], sh(s)[1], B.shR, el(s)[0], el(s)[1], B.elbow[2]) +
        limb(el(s)[0], el(s)[1], B.elbow[2], wr(s)[0], wr(s)[1], B.wrist[2]),
      SKIN
    )
  })
  var hand = function (s, c) {
    var h = hd(s)
    put(
      c === SKIN ? 'body' : 'hands',
      oval(h[0], h[1], B.hand[2], B.hand[3]) + oval(h[0] - s * (B.hand[2] - 1), h[1] - 3, 2.4, 5.2),
      c
    )
  }
  both(function (s) {
    if (!(s > 0 && holding)) hand(s, o.hands === 'gloves' ? null : SKIN)
  })
  put(
    'body',
    rpoly(
      [
        [CX - B.neck, fChin - 12],
        [CX + B.neck, fChin - 12],
        [CX + B.neck + 1, B.sy - 4],
        [CX - B.neck - 1, B.sy - 4]
      ],
      2
    ),
    SKIN2
  )
  both(function (s) {
    put('body', oval(CX + s * (fw + 1), fCheek + 2, B.ear[0], B.ear[1]), SKIN)
  })
  put('body', facePath, SKIN)

  /* ---- face: dot eyes, brows, a soft triangle nose, a small mouth */
  var ey = fCheek - 1,
    ex = kind === 'woman' ? 11.5 : 12.5
  both(function (s) {
    put('face', oval(CX + s * ex, ey, 3, 3.9), INK)
  })
  both(function (s) {
    line(
      'face',
      'M' +
        (CX + s * (ex - 7)) +
        ' ' +
        (ey - 9) +
        'Q' +
        (CX + s * ex) +
        ' ' +
        (ey - 13.5) +
        ' ' +
        (CX + s * (ex + 7.5)) +
        ' ' +
        (ey - 9.5),
      kind === 'woman' ? hairColor : BROW,
      kind === 'woman' ? 2.1 : 3
    )
  })
  put(
    'face',
    'M' +
      CX +
      ' ' +
      (ey + 1) +
      'C' +
      (CX - 3) +
      ' ' +
      (ey + 8) +
      ' ' +
      (CX - 6) +
      ' ' +
      (ey + 14) +
      ' ' +
      (CX - 5) +
      ' ' +
      (ey + 16) +
      'L' +
      (CX + 5) +
      ' ' +
      (ey + 16) +
      'C' +
      (CX + 6) +
      ' ' +
      (ey + 14) +
      ' ' +
      (CX + 3) +
      ' ' +
      (ey + 8) +
      ' ' +
      CX +
      ' ' +
      (ey + 1) +
      'Z',
    SKIN2
  )
  if (kind === 'woman')
    put(
      'face',
      'M' +
        (CX - 6) +
        ' ' +
        (ey + 23) +
        'Q' +
        CX +
        ' ' +
        (ey + 20) +
        ' ' +
        (CX + 6) +
        ' ' +
        (ey + 23) +
        'Q' +
        CX +
        ' ' +
        (ey + 27.5) +
        ' ' +
        (CX - 6) +
        ' ' +
        (ey + 23) +
        'Z',
      LIPS
    )
  else
    line(
      'face',
      'M' +
        (CX - 7) +
        ' ' +
        (ey + 23) +
        'Q' +
        CX +
        ' ' +
        (ey + 26.5) +
        ' ' +
        (CX + 7) +
        ' ' +
        (ey + 23),
      '#C9706A',
      2.2
    )

  /* ---- front hair (hidden under a hood; a beanie sits on top of it) */
  if (!hooded && hairStyle === 'curly') {
    /* curly crop: a bumpy outline over the crown, a ragged hairline with one curl falling on the forehead */
    var crown = [],
      n = 11,
      cxh = CX + 1,
      cyh = fTop + 16,
      rxh = fw + 6,
      ryh = 32
    for (var i = 0; i <= n; i++) {
      var ang = Math.PI * (1.04 + (0.92 * i) / n)
      crown.push([
        cxh + Math.cos(ang) * rxh * (i % 2 ? 1.04 : 0.98),
        cyh + Math.sin(ang) * ryh * (i % 2 ? 1.06 : 0.97)
      ])
    }
    var dH = 'M' + r1(CX - fw - 1) + ' ' + r1(fCheek - 4)
    dH += 'L' + r1(crown[0][0]) + ' ' + r1(crown[0][1])
    for (var j = 1; j < crown.length; j++) {
      var a0 = crown[j - 1],
        a1 = crown[j],
        rr = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]) * 0.62
      dH += 'A' + r1(rr) + ' ' + r1(rr) + ' 0 0 1 ' + r1(a1[0]) + ' ' + r1(a1[1])
    }
    dH +=
      'L' +
      r1(CX + fw + 1) +
      ' ' +
      r1(fCheek - 4) +
      'L' +
      r1(CX + fw - 3) +
      ' ' +
      r1(fCheek - 6) +
      'C' +
      r1(CX + fw - 5) +
      ' ' +
      r1(fTop + 26) +
      ' ' +
      r1(CX + fw - 14) +
      ' ' +
      r1(fTop + 20) +
      ' ' +
      r1(CX + 12) +
      ' ' +
      r1(fTop + 21) +
      'C' +
      r1(CX + 6) +
      ' ' +
      r1(fTop + 17) +
      ' ' +
      r1(CX + 2) +
      ' ' +
      r1(fTop + 22) +
      ' ' +
      r1(CX - 2) +
      ' ' +
      r1(fTop + 19) +
      'C' +
      r1(CX - 10) +
      ' ' +
      r1(fTop + 30) +
      ' ' +
      r1(CX - 20) +
      ' ' +
      r1(fTop + 22) +
      ' ' +
      r1(CX - fw + 9) +
      ' ' +
      r1(fTop + 27) +
      'C' +
      r1(CX - fw + 4) +
      ' ' +
      r1(fTop + 30) +
      ' ' +
      r1(CX - fw + 2) +
      ' ' +
      r1(fCheek - 10) +
      ' ' +
      r1(CX - fw + 1) +
      ' ' +
      r1(fCheek - 6) +
      'Z'
    put('hair', dH, hairColor)
    /* the curl on the forehead and a few strands of light */
    put(
      'hair',
      'M' +
        (CX - 6) +
        ' ' +
        (fTop + 19) +
        'c -8 6 -9 14 -2 17 c 1 -5 4 -8 9 -8 c -3 -2 -5 -5 -7 -9 z',
      hairColor
    )
    ;[
      [-20, fTop + 4],
      [-4, fTop - 4],
      [12, fTop - 3],
      [24, fTop + 6]
    ].forEach(function (c) {
      line('hair', 'M' + (CX + c[0]) + ' ' + c[1] + 'q 4 -5 9 -1', shade(hairColor, 0.2), 1.4)
    })
  }
  if (!hooded && hairStyle === 'long') {
    /* centre parting, the hair frames the face and falls in front of the shoulders */
    put(
      'hair',
      'M' +
        (CX + 1) +
        ' ' +
        (fTop - 6) +
        'C' +
        (CX + 24) +
        ' ' +
        (fTop - 8) +
        ' ' +
        (CX + fw + 9) +
        ' ' +
        (fTop + 8) +
        ' ' +
        (CX + fw + 7) +
        ' ' +
        (fCheek + 6) +
        'C' +
        (CX + fw + 6) +
        ' ' +
        (fChin + 6) +
        ' ' +
        (CX + fw + 12) +
        ' ' +
        (B.sy + 18) +
        ' ' +
        (CX + fw + 6) +
        ' ' +
        (B.sy + 50) +
        'C' +
        (CX + fw - 2) +
        ' ' +
        (B.sy + 36) +
        ' ' +
        (CX + fw - 4) +
        ' ' +
        (fChin + 2) +
        ' ' +
        (CX + fw - 4) +
        ' ' +
        (fCheek + 4) +
        'C' +
        (CX + fw - 6) +
        ' ' +
        (fTop + 22) +
        ' ' +
        (CX + 12) +
        ' ' +
        (fTop + 12) +
        ' ' +
        (CX + 1) +
        ' ' +
        (fTop + 4) +
        'C' +
        (CX - 10) +
        ' ' +
        (fTop + 12) +
        ' ' +
        (CX - fw + 6) +
        ' ' +
        (fTop + 22) +
        ' ' +
        (CX - fw + 4) +
        ' ' +
        (fCheek + 4) +
        'C' +
        (CX - fw + 4) +
        ' ' +
        (fChin + 2) +
        ' ' +
        (CX - fw + 2) +
        ' ' +
        (B.sy + 36) +
        ' ' +
        (CX - fw - 6) +
        ' ' +
        (B.sy + 50) +
        'C' +
        (CX - fw - 12) +
        ' ' +
        (B.sy + 18) +
        ' ' +
        (CX - fw - 6) +
        ' ' +
        (fChin + 6) +
        ' ' +
        (CX - fw - 7) +
        ' ' +
        (fCheek + 6) +
        'C' +
        (CX - fw - 9) +
        ' ' +
        (fTop + 8) +
        ' ' +
        (CX - 22) +
        ' ' +
        (fTop - 8) +
        ' ' +
        (CX + 1) +
        ' ' +
        (fTop - 6) +
        'Z',
      hairColor
    )
    line(
      'hair',
      'M' + (CX + 1) + ' ' + (fTop - 4) + 'L' + (CX + 1) + ' ' + (fTop + 4),
      shade(hairColor, 0.22),
      1.2
    )
  }
  /* ---- garments: base fill, a darker band on the outer side (the flat shading of the reference art) */
  var torsoHW = function (y, e) {
    var pts = [
      [B.sy, B.sw + 2 + e * 0.6],
      [B.chest[1], B.chest[0] + e],
      [B.waist[1], B.waist[0] + e * 1.3],
      [B.hip[1], B.hip[0] + e * 1.1],
      [B.crotch + 20, B.hip[0] + e * 1.2]
    ]
    for (var i = 1; i < pts.length; i++)
      if (y <= pts[i][0]) {
        var t = (y - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0])
        return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * Math.max(0, t)
      }
    return pts[pts.length - 1][1]
  }
  var torso = function (e, hemY, neckW, neckDip, flare) {
    var hx = torsoHW(hemY, e) + (flare || 0)
    return sym(
      [
        [B.neck + neckW, B.sy - 9 - e * 0.15, 3],
        [B.sw * 0.62, B.sy - 6 - e * 0.3, 9],
        [B.sw + 2 + e * 0.6, B.sy + 3, 8],
        [B.chest[0] + e, B.chest[1], 16],
        [B.waist[0] + e * 1.3, B.waist[1], 20],
        [hx, hemY, 4]
      ],
      6,
      [B.sy - 9 + neckDip, neckW * 1.6],
      [hemY + 1.5, 40]
    )
  }
  var sleeve = function (s, e, len) {
    // len 0..2: 1 = to the elbow, 2 = to the wrist
    var a = sh(s),
      b = el(s),
      c2 = wr(s)
    if (len <= 1) {
      var q = lerp(a, b, len)
      return limb(
        a[0],
        a[1],
        B.shR + e,
        q[0],
        q[1],
        B.shR + e - (B.shR - B.elbow[2]) * len + 0.5,
        true
      )
    }
    var q2 = lerp(b, c2, Math.min(1, len - 1) * 0.94)
    return (
      limb(a[0], a[1], B.shR + e, b[0], b[1], B.elbow[2] + e) +
      limb(b[0], b[1], B.elbow[2] + e, q2[0], q2[1], B.wrist[2] + e * 0.9, true)
    )
  }
  /* draw a top-like garment twice: full in the side colour, then 4px narrower in the main colour */
  var shaded = function (slot, c, fullFn, innerFn) {
    put(slot, fullFn(), shade(c, -0.12))
    put(slot, innerFn(), c)
  }
  var cuff = function (slot, s, e, c) {
    var b = el(s),
      w = wr(s),
      q = lerp(b, w, 0.94),
      q0 = lerp(b, w, 0.84)
    put(slot, limb(q0[0], q0[1], B.wrist[2] + e + 0.8, q[0], q[1], B.wrist[2] + e + 0.6, true), c)
  }

  /* ---- bottoms */
  if (o.bottom === 'trousers' || o.bottom === 'shorts') {
    var bc = col(o.bottom),
      be = o.bottom === 'shorts' ? 4.5 : 4,
      shorts = o.bottom === 'shorts'
    var legPath = function (s, e) {
      var a = hipJ(s),
        k = kn(s),
        n = an(s)
      if (shorts) {
        var q = lerp(a, k, 0.6)
        return limb(a[0], a[1], B.hipJ[2] + e, q[0], q[1], B.hipJ[2] + e - 2, true)
      }
      var hem = lerp(k, n, 0.98)
      return (
        limb(a[0], a[1], B.hipJ[2] + e, k[0], k[1], B.knee[2] + e) +
        limb(k[0], k[1], B.knee[2] + e, hem[0], hem[1], B.ankle[2] + e + 2.5, true)
      )
    }
    put(
      'bottom',
      sym(
        [
          [B.waist[0] + 1.5, B.waist[1] + 8, 3],
          [B.hip[0] + be * 0.6, B.hip[1], 14],
          [B.hipJ[0] + B.hipJ[2] + be - 1, B.hipJ[1] + 12, 6],
          [3, B.crotch + 10, 3]
        ],
        4,
        [B.waist[1] + 8, 2],
        [B.crotch + 6, 2]
      ),
      bc
    )
    both(function (s) {
      put('bottom', legPath(s, be), shade(bc, -0.1))
      put(
        'bottom',
        limb(
          hipJ(s)[0] - s * 1.5,
          hipJ(s)[1],
          B.hipJ[2] + be - 3,
          kn(s)[0] - s * 1.5,
          kn(s)[1] + (shorts ? -40 : 0),
          B.knee[2] + be - 3
        ) +
          (shorts
            ? ''
            : limb(
                kn(s)[0] - s * 1.5,
                kn(s)[1],
                B.knee[2] + be - 3,
                an(s)[0] - s * 1,
                an(s)[1] - 6,
                B.ankle[2] + be - 0.5,
                true
              )),
        bc
      )
    })
    line(
      'bottom',
      'M' + CX + ' ' + (B.waist[1] + 16) + 'L' + CX + ' ' + (B.crotch + 4),
      shade(bc, -0.2),
      1.2
    )
    /* drawstring, like the reference trousers */
    if (!shorts)
      [-1, 1].forEach(function (s) {
        line(
          'bottom',
          'M' + (CX + s * 3) + ' ' + (B.waist[1] + 9) + 'l' + s * 0.6 + ' 12',
          '#E9E6E1',
          1.6
        )
      })
    if (shorts)
      both(function (s) {
        var a = hipJ(s),
          q = lerp(a, kn(s), 0.6)
        line(
          'bottom',
          'M' +
            r1(q[0] - B.hipJ[2] - be + 2) +
            ' ' +
            r1(q[1] - 3) +
            'L' +
            r1(q[0] + B.hipJ[2] + be - 2) +
            ' ' +
            r1(q[1] - 3),
          shade(bc, -0.2),
          1.2
        )
      })
  }
  if (o.bottom === 'skirt') {
    var sk = col('skirt')
    put(
      'bottom',
      sym(
        [
          [B.waist[0] + 1, B.waist[1] + 6, 3],
          [B.hip[0] + 5, B.hip[1], 22],
          [B.hip[0] + 16, 372, 6]
        ],
        5,
        [B.waist[1] + 6, 2],
        [377, 60]
      ),
      shade(sk, -0.1)
    )
    put(
      'bottom',
      sym(
        [
          [B.waist[0] - 2, B.waist[1] + 7, 3],
          [B.hip[0] + 1, B.hip[1], 22],
          [B.hip[0] + 11, 371, 6]
        ],
        5,
        [B.waist[1] + 7, 2],
        [376, 60]
      ),
      sk
    )
    ;[-1, 1].forEach(function (s) {
      line(
        'bottom',
        'M' + (CX + s * 12) + ' ' + (B.hip[1] + 8) + 'L' + (CX + s * 20) + ' 368',
        shade(sk, -0.12),
        1.2
      )
    })
  }

  /* ---- feet */
  if (o.feet === 'sneakers')
    both(function (s) {
      var f = B.foot,
        x = CX + s * f[0],
        c = col('sneakers')
      put('feet', oval(x + s * 3, f[1] + 2.5, f[2] + 4, f[3] + 1.5), '#F4F3EF')
      put(
        'feet',
        'M' +
          (x - f[2] - 2) +
          ' ' +
          (f[1] + 2) +
          'C' +
          (x - f[2] - 2) +
          ' ' +
          (f[1] - 11) +
          ' ' +
          (x + f[2] + 4 * s) +
          ' ' +
          (f[1] - 12) +
          ' ' +
          (x + f[2] + 3) +
          ' ' +
          (f[1] + 2) +
          'Z',
        c
      )
      ;[0, 1, 2].forEach(function (i) {
        line(
          'feet',
          'M' + (x - 3 + s * i * 2.5) + ' ' + (f[1] - 7 + i * 2.6) + 'l' + s * 6 + ' -1.5',
          c === '#F7F7F5' ? '#A9AEB6' : '#F4F3EF',
          1.3
        )
      })
    })
  if (o.feet === 'boots')
    both(function (s) {
      var f = B.foot,
        c = col('boots'),
        a = an(s),
        x = CX + s * f[0]
      put('feet', limb(a[0], a[1] - 30, B.ankle[2] + 4.5, a[0], a[1] + 4, B.ankle[2] + 4, true), c)
      put(
        'feet',
        'M' +
          (x - f[2] - 3) +
          ' ' +
          (f[1] + 3) +
          'C' +
          (x - f[2] - 3) +
          ' ' +
          (f[1] - 12) +
          ' ' +
          (x + f[2] + 5 * s) +
          ' ' +
          (f[1] - 12) +
          ' ' +
          (x + f[2] + 4) +
          ' ' +
          (f[1] + 3) +
          'Z',
        c
      )
      put(
        'feet',
        rpoly(
          [
            [x - f[2] - 4, f[1] + 1],
            [x + f[2] + 5, f[1] + 1],
            [x + f[2] + 5, f[1] + 5],
            [x - f[2] - 4, f[1] + 5]
          ],
          2
        ),
        shade(c, -0.35)
      )
      put(
        'feet',
        rpoly(
          [
            [a[0] - 3, a[1] - 26],
            [a[0] + 3, a[1] - 26],
            [a[0] + 3, a[1] - 6],
            [a[0] - 3, a[1] - 6]
          ],
          2
        ),
        shade(c, -0.28)
      )
    })
  if (o.feet === 'sandals')
    both(function (s) {
      var f = B.foot,
        c = col('sandals'),
        x = CX + s * f[0]
      put('feet', oval(x, f[1] + 3, f[2] + 2.5, f[3] - 1), c)
      put('feet', oval(x, f[1] - 0.5, f[2] - 0.5, f[3] - 1.2), SKIN)
      line(
        'feet',
        'M' +
          (x - f[2] + 1) +
          ' ' +
          (f[1] + 1) +
          'Q' +
          x +
          ' ' +
          (f[1] - 7) +
          ' ' +
          (x + f[2] - 1) +
          ' ' +
          (f[1] + 1),
        c,
        3
      )
    })

  /* ---- tops */
  var tc = o.top ? col(o.top) : null,
    td = tc ? shade(tc, -0.16) : null
  if (o.top === 'tee' || o.top === 'shirt') {
    var te = 4,
      hem = B.hip[1] + 8
    both(function (s) {
      put('top', sleeve(s, te + 1.5, 0.55), td)
      put('top', sleeve(s, te - 0.5, 0.5), tc)
    })
    shaded(
      'top',
      tc,
      function () {
        return torso(te, hem, o.top === 'shirt' ? 5 : 6, o.top === 'shirt' ? 14 : 7)
      },
      function () {
        return torso(te - 4, hem, o.top === 'shirt' ? 5 : 6, o.top === 'shirt' ? 14 : 7)
      }
    )
    if (o.top === 'tee') {
      line(
        'top',
        'M' +
          (CX - B.neck - 5) +
          ' ' +
          (B.sy - 8.5) +
          'Q' +
          CX +
          ' ' +
          (B.sy + 3) +
          ' ' +
          (CX + B.neck + 5) +
          ' ' +
          (B.sy - 8.5),
        td,
        3
      )
      put(
        'top',
        rpoly(
          [
            [CX + 12, B.chest[1] - 8],
            [CX + 25, B.chest[1] - 8],
            [CX + 25, B.chest[1] + 5],
            [CX + 12, B.chest[1] + 5]
          ],
          2
        ),
        td,
        { o: 0.6 }
      )
    } else {
      put(
        'top',
        rpoly(
          [
            [CX - 8, B.sy - 6],
            [CX + 8, B.sy - 6],
            [CX + 6, hem],
            [CX - 6, hem]
          ],
          2
        ),
        '#F4F1EA'
      )
      ;[-1, 1].forEach(function (s) {
        put(
          'top',
          rpoly(
            [
              [CX + s * (B.neck + 3), B.sy - 11],
              [CX + s * (B.neck + 13), B.sy - 5],
              [CX + s * 9, B.sy + 10],
              [CX + s * 6, B.sy - 4]
            ],
            1.5
          ),
          td
        )
        line(
          'top',
          'M' + (CX + s * 8) + ' ' + (B.sy - 4) + 'L' + (CX + s * 7) + ' ' + (hem - 1),
          td,
          1.2
        )
      })
      ;[0, 1, 2, 3].forEach(function (i) {
        put('top', oval(CX + 9, B.sy + 22 + i * 26, 1.8, 1.8), '#2B2B30')
      })
    }
  }
  if (o.top === 'longsleeve' || o.top === 'sweater') {
    var sw = o.top === 'sweater',
      le = sw ? 5.5 : 4,
      lh = B.hip[1] + (sw ? 6 : 10)
    both(function (s) {
      put('top', sleeve(s, le + 1.5, 2), td)
      put(
        'top',
        limb(
          sh(s)[0] - s * 2,
          sh(s)[1],
          B.shR + le - 2,
          el(s)[0] - s * 2,
          el(s)[1],
          B.elbow[2] + le - 2
        ) +
          limb(
            el(s)[0] - s * 2,
            el(s)[1],
            B.elbow[2] + le - 2,
            lerp(el(s), wr(s), 0.9)[0] - s * 1.5,
            lerp(el(s), wr(s), 0.9)[1],
            B.wrist[2] + le - 1.5,
            true
          ),
        tc
      )
      if (sw) cuff('top', s, le, td)
    })
    shaded(
      'top',
      tc,
      function () {
        return torso(le, lh, 6, sw ? 5 : 8)
      },
      function () {
        return torso(le - 4, lh, 6, sw ? 5 : 8)
      }
    )
    if (sw) {
      /* the classic stripes: four white bands across body and sleeves */
      var stripe = '#F4EFE8'
      if (tone !== 'light') {
        var stripes = [0, 1, 2, 3, 4]
          .map(function (i) {
            return [B.sy + 26 + i * 25, B.sy + 38 + i * 25]
          })
          .filter(function (b) {
            return b[1] < lh - 6
          })
        stripes.forEach(function (b) {
          var y0 = b[0],
            y1 = b[1]
          put(
            'top',
            'M' +
              r1(CX - torsoHW(y0, le) + 1) +
              ' ' +
              y0 +
              'L' +
              r1(CX + torsoHW(y0, le) - 1) +
              ' ' +
              y0 +
              'L' +
              r1(CX + torsoHW(y1, le) - 1) +
              ' ' +
              y1 +
              'L' +
              r1(CX - torsoHW(y1, le) + 1) +
              ' ' +
              y1 +
              'Z',
            stripe
          )
        })
        /* the same bands carry on across the sleeves at the same height */
        both(function (s) {
          var segs = [
            [sh(s), el(s), B.shR + le + 1.4, B.elbow[2] + le + 1.4],
            [el(s), wr(s), B.elbow[2] + le + 1.4, B.wrist[2] + le + 1.2]
          ]
          stripes.forEach(function (b) {
            segs.forEach(function (g) {
              var a = g[0],
                c = g[1],
                dy = c[1] - a[1]
              if (Math.abs(dy) < 1) return
              var t0 = (b[0] - a[1]) / dy,
                t1 = (b[1] - a[1]) / dy
              if (t0 > t1) {
                var x = t0
                t0 = t1
                t1 = x
              }
              t0 = Math.max(0, t0)
              t1 = Math.min(g === segs[1] ? 0.86 : 1, t1)
              if (t1 - t0 > 0.02) put('top', band(a, c, g[2], g[3], t0, t1), stripe)
            })
          })
        })
      }
      put(
        'top',
        rpoly(
          [
            [CX - B.neck - 3, B.sy - 14],
            [CX + B.neck + 3, B.sy - 14],
            [CX + B.neck + 4, B.sy - 3],
            [CX - B.neck - 4, B.sy - 3]
          ],
          3
        ),
        tc
      )
      line(
        'top',
        'M' +
          (CX - torsoHW(lh - 5, le)) +
          ' ' +
          (lh - 5) +
          'L' +
          (CX + torsoHW(lh - 5, le)) +
          ' ' +
          (lh - 5),
        td,
        1.4,
        { dash: '2 2.5' }
      )
    } else
      line(
        'top',
        'M' +
          (CX - B.neck - 5) +
          ' ' +
          (B.sy - 8.5) +
          'Q' +
          CX +
          ' ' +
          (B.sy + 5) +
          ' ' +
          (CX + B.neck + 5) +
          ' ' +
          (B.sy - 8.5),
        td,
        2.4
      )
  }
  if (o.top === 'dress') {
    both(function (s) {
      put('top', sleeve(s, 2.5, 0.25), tc)
    })
    put(
      'top',
      sym(
        [
          [B.neck + 6, B.sy - 9, 3],
          [B.sw * 0.6, B.sy - 6, 8],
          [B.sw + 2, B.sy + 2, 7],
          [B.chest[0] + 2, B.chest[1], 14],
          [B.waist[0] + 2, B.waist[1], 18],
          [B.hip[0] + 7, B.hip[1] + 6, 30],
          [B.hip[0] + 21, 332, 6]
        ],
        6,
        [B.sy + 3, 12],
        [338, 60]
      ),
      shade(tc, -0.08)
    )
    put(
      'top',
      sym(
        [
          [B.neck + 6, B.sy - 9, 3],
          [B.sw * 0.6, B.sy - 6, 8],
          [B.sw - 1, B.sy + 2, 7],
          [B.chest[0] - 1, B.chest[1], 14],
          [B.waist[0] - 1, B.waist[1], 18],
          [B.hip[0] + 3, B.hip[1] + 6, 30],
          [B.hip[0] + 16, 331, 6]
        ],
        6,
        [B.sy + 3, 12],
        [337, 60]
      ),
      tc
    )
    /* tiers */
    ;[272, 302].forEach(function (y) {
      var hw = B.hip[0] + 3 + ((y - B.hip[1] - 6) / (331 - B.hip[1] - 6)) * 13
      line(
        'top',
        'M' + r1(CX - hw) + ' ' + y + 'Q' + CX + ' ' + (y + 3) + ' ' + r1(CX + hw) + ' ' + y,
        shade(tc, -0.12),
        1.3
      )
    })
  }

  /* ---- outer layers */
  if (o.outer) {
    var oc = col(o.outer),
      od = shade(oc, -0.15),
      inner = tc || SKIN,
      id = o.outer
    var outerSleeves = function (e) {
      both(function (s) {
        put('outer', sleeve(s, e + 1.5, 2), od)
        put(
          'outer',
          limb(
            sh(s)[0] - s * 2.5,
            sh(s)[1],
            B.shR + e - 2,
            el(s)[0] - s * 2.5,
            el(s)[1],
            B.elbow[2] + e - 2
          ) +
            limb(
              el(s)[0] - s * 2.5,
              el(s)[1],
              B.elbow[2] + e - 2,
              lerp(el(s), wr(s), 0.9)[0] - s * 1.5,
              lerp(el(s), wr(s), 0.9)[1],
              B.wrist[2] + e - 1.5,
              true
            ),
          oc
        )
        cuff('outer', s, e + 0.6, od)
      })
    }
    if (id === 'jacket') {
      var je = 7,
        jh = B.hip[1] + 12
      outerSleeves(je)
      shaded(
        'outer',
        oc,
        function () {
          return torso(je, jh, 8, 6)
        },
        function () {
          return torso(je - 4, jh, 8, 6)
        }
      )
      put(
        'outer',
        rpoly(
          [
            [CX - 8, B.sy - 7],
            [CX + 8, B.sy - 7],
            [CX + 7, jh + 1],
            [CX - 7, jh + 1]
          ],
          2
        ),
        inner
      )
      ;[-1, 1].forEach(function (s) {
        put(
          'outer',
          rpoly(
            [
              [CX + s * (B.neck + 2), B.sy - 13],
              [CX + s * (B.neck + 17), B.sy - 7],
              [CX + s * 11, B.sy + 13],
              [CX + s * 8, B.sy - 5]
            ],
            2
          ),
          '#26232B'
        )
        put(
          'outer',
          rpoly(
            [
              [CX + s * 13, B.waist[1] - 2],
              [CX + s * 29, B.waist[1] - 2],
              [CX + s * 29, B.waist[1] + 22],
              [CX + s * 13, B.waist[1] + 22]
            ],
            3
          ),
          od
        )
        put(
          'outer',
          rpoly(
            [
              [CX + s * 16, B.chest[1] - 6],
              [CX + s * 27, B.chest[1] - 6],
              [CX + s * 27, B.chest[1] + 6],
              [CX + s * 16, B.chest[1] + 6]
            ],
            2
          ),
          od
        )
      })
    }
    if (id === 'coat') {
      var ce = 8,
        ch = 322
      outerSleeves(ce)
      put(
        'outer',
        sym(
          [
            [B.neck + 8, B.sy - 10, 3],
            [B.sw * 0.62, B.sy - 8, 9],
            [B.sw + 7, B.sy + 2, 8],
            [B.chest[0] + ce, B.chest[1], 16],
            [B.waist[0] + ce + 3, B.waist[1], 24],
            [B.hip[0] + ce + 3, B.hip[1], 30],
            [B.hip[0] + ce + 7, ch, 5]
          ],
          6,
          [B.sy + 22, 3],
          [ch + 1.5, 40]
        ),
        od
      )
      put(
        'outer',
        sym(
          [
            [B.neck + 8, B.sy - 10, 3],
            [B.sw * 0.62, B.sy - 8, 9],
            [B.sw + 3, B.sy + 2, 8],
            [B.chest[0] + ce - 4, B.chest[1], 16],
            [B.waist[0] + ce - 1, B.waist[1], 24],
            [B.hip[0] + ce - 1, B.hip[1], 30],
            [B.hip[0] + ce + 3, ch, 5]
          ],
          6,
          [B.sy + 22, 3],
          [ch + 1.5, 40]
        ),
        oc
      )
      put(
        'outer',
        rpoly(
          [
            [CX - B.neck - 7, B.sy - 10],
            [CX + B.neck + 7, B.sy - 10],
            [CX, B.sy + 24]
          ],
          2
        ),
        inner
      )
      ;[-1, 1].forEach(function (s) {
        put(
          'outer',
          rpoly(
            [
              [CX + s * (B.neck + 5), B.sy - 13],
              [CX + s * (B.neck + 19), B.sy - 5],
              [CX + s * 14, B.sy + 16],
              [CX + s * 1, B.sy + 30],
              [CX + s * 9, B.sy + 4]
            ],
            2
          ),
          od
        )
      })
      line('outer', 'M' + CX + ' ' + (B.sy + 30) + 'L' + CX + ' ' + ch, od, 1.5)
      ;[0, 1, 2].forEach(function (i) {
        ;[-1, 1].forEach(function (s) {
          put('outer', oval(CX + s * 8, B.sy + 50 + i * 32, 2.3, 2.3), '#3B2E26')
        })
      })
    }
    if (id === 'puffer') {
      var pe = 11,
        ph = B.hip[1] + 14
      outerSleeves(pe - 1)
      both(function (s) {
        ;[0.5].forEach(function (t) {
          var q = lerp(sh(s), el(s), t)
          line('outer', 'M' + (q[0] - 14) + ' ' + q[1] + 'L' + (q[0] + 14) + ' ' + q[1], od, 1.5)
        })
        ;[0.15, 0.55].forEach(function (t) {
          var q = lerp(el(s), wr(s), t)
          line('outer', 'M' + (q[0] - 13) + ' ' + q[1] + 'L' + (q[0] + 13) + ' ' + q[1], od, 1.5)
        })
      })
      shaded(
        'outer',
        oc,
        function () {
          return torso(pe, ph, 9, 2)
        },
        function () {
          return torso(pe - 4, ph, 9, 2)
        }
      )
      ;[0, 1, 2, 3].forEach(function (i) {
        var y = B.chest[1] - 8 + i * 26,
          hw = torsoHW(y, pe) - 3
        line(
          'outer',
          'M' + (CX - hw) + ' ' + y + 'Q' + CX + ' ' + (y + 3) + ' ' + (CX + hw) + ' ' + y,
          od,
          1.5
        )
      })
      put(
        'outer',
        rpoly(
          [
            [CX - 6, B.sy - 6],
            [CX + 6, B.sy - 6],
            [CX + 5, ph],
            [CX - 5, ph]
          ],
          1
        ),
        '#F4F1EA'
      )
      line('outer', 'M' + (CX + 7) + ' ' + (B.sy - 4) + 'L' + (CX + 6) + ' ' + ph, od, 1.6)
      ;[-1, 1].forEach(function (s) {
        line(
          'outer',
          'M' + (CX + s * 22) + ' ' + (B.waist[1] + 4) + 'l' + s * -3 + ' 18',
          '#1F2430',
          1.8
        )
      })
      put(
        'outer',
        rpoly(
          [
            [CX - B.neck - 9, B.sy - 20],
            [CX + B.neck + 9, B.sy - 20],
            [CX + B.neck + 12, B.sy - 3],
            [CX - B.neck - 12, B.sy - 3]
          ],
          6
        ),
        od
      )
    }
    if (id === 'raincoat') {
      var re = 8,
        rh = 300
      outerSleeves(re)
      put(
        'outer',
        sym(
          [
            [B.neck + 7, B.sy - 10, 3],
            [B.sw * 0.62, B.sy - 8, 9],
            [B.sw + 7, B.sy + 2, 8],
            [B.chest[0] + re, B.chest[1], 16],
            [B.waist[0] + re + 5, B.waist[1], 26],
            [B.hip[0] + re + 9, rh, 6]
          ],
          6,
          [B.sy - 4, 6],
          [rh + 2, 50]
        ),
        od
      )
      put(
        'outer',
        sym(
          [
            [B.neck + 7, B.sy - 10, 3],
            [B.sw * 0.62, B.sy - 8, 9],
            [B.sw + 3, B.sy + 2, 8],
            [B.chest[0] + re - 4, B.chest[1], 16],
            [B.waist[0] + re + 1, B.waist[1], 26],
            [B.hip[0] + re + 5, rh, 6]
          ],
          6,
          [B.sy - 4, 6],
          [rh + 2, 50]
        ),
        oc
      )
      line('outer', 'M' + CX + ' ' + (B.sy - 2) + 'L' + CX + ' ' + rh, od, 1.6)
      ;[0, 1, 2, 3].forEach(function (i) {
        put('outer', oval(CX + 5, B.sy + 20 + i * 40, 2.2, 2.2), od)
      })
      ;[-1, 1].forEach(function (s) {
        put(
          'outer',
          rpoly(
            [
              [CX + s * 18, B.hip[1] - 4],
              [CX + s * 37, B.hip[1] - 4],
              [CX + s * 38, B.hip[1] + 12],
              [CX + s * 18, B.hip[1] + 12]
            ],
            3
          ),
          od
        )
      })
    }
  }

  /* ---- scarf, gloves */
  if (o.neck === 'scarf') {
    var nc = col('scarf'),
      ncd = shade(nc, -0.2),
      plaid = '#F0A49A'
    put(
      'neck',
      rpoly(
        [
          [CX - B.neck - 12, B.sy - 22],
          [CX + B.neck + 12, B.sy - 22],
          [CX + B.neck + 14, B.sy - 1],
          [CX - B.neck - 14, B.sy - 1]
        ],
        9
      ),
      nc
    )
    put(
      'neck',
      rpoly(
        [
          [CX + 6, B.sy - 8],
          [CX + 20, B.sy - 6],
          [CX + 22, B.sy + 66],
          [CX + 8, B.sy + 66]
        ],
        3
      ),
      nc
    )
    ;[B.sy + 6, B.sy + 26, B.sy + 46].forEach(function (y) {
      put(
        'neck',
        rpoly(
          [
            [CX + 7, y],
            [CX + 21, y + 1],
            [CX + 21, y + 7],
            [CX + 7, y + 6]
          ],
          1
        ),
        plaid,
        { o: 0.8 }
      )
    })
    line('neck', 'M' + (CX + 14) + ' ' + (B.sy - 6) + 'L' + (CX + 15) + ' ' + (B.sy + 64), ncd, 2)
    ;[0, 1, 2, 3, 4].forEach(function (i) {
      line('neck', 'M' + (CX + 9 + i * 3) + ' ' + (B.sy + 66) + 'l 0 6', nc, 1.4)
    })
    line(
      'neck',
      'M' +
        (CX - B.neck - 10) +
        ' ' +
        (B.sy - 11) +
        'Q' +
        CX +
        ' ' +
        (B.sy - 6) +
        ' ' +
        (CX + B.neck + 10) +
        ' ' +
        (B.sy - 11),
      plaid,
      3,
      { o: 0.8 }
    )
  }
  var glove = function (s) {
    var gc = col('gloves'),
      h = hd(s)
    put(
      'hands',
      oval(h[0], h[1], B.hand[2] + 1.8, B.hand[3] + 1.5) +
        oval(h[0] - s * (B.hand[2] + 0.5), h[1] - 3, 3.2, 6),
      gc
    )
  }
  if (o.hands === 'gloves')
    both(function (s) {
      if (!(s > 0 && holding)) glove(s)
    })

  /* ---- headwear, glasses */
  if (hooded) {
    var hc = col('raincoat')
    put(
      'head',
      oval(CX, fCheek - 4, fw + 13, fChin - fCheek + 34) +
        oval(CX, fCheek + 4, fw - 1, fChin - fCheek + 18),
      hc,
      { rule: 'evenodd' }
    )
  }
  if (o.head === 'beanie') {
    var bn = col('beanie'),
      bnd = shade(bn, -0.14)
    put(
      'head',
      'M' +
        (CX - fw - 4) +
        ' ' +
        (fTop + 22) +
        'C' +
        (CX - fw - 6) +
        ' ' +
        (fTop - 20) +
        ' ' +
        (CX + fw + 6) +
        ' ' +
        (fTop - 20) +
        ' ' +
        (CX + fw + 4) +
        ' ' +
        (fTop + 22) +
        'Z',
      bn
    )
    put(
      'head',
      rpoly(
        [
          [CX - fw - 6, fTop + 10],
          [CX + fw + 6, fTop + 10],
          [CX + fw + 6, fTop + 28],
          [CX - fw - 6, fTop + 28]
        ],
        8
      ),
      bnd
    )
  }
  if (o.head === 'cap') {
    var cc = col('cap'),
      ccd = shade(cc, -0.16)
    put(
      'head',
      'M' +
        (CX - fw - 3) +
        ' ' +
        (fTop + 16) +
        'C' +
        (CX - fw - 4) +
        ' ' +
        (fTop - 16) +
        ' ' +
        (CX + fw + 4) +
        ' ' +
        (fTop - 16) +
        ' ' +
        (CX + fw + 3) +
        ' ' +
        (fTop + 16) +
        'Z',
      cc
    )
    put(
      'head',
      rpoly(
        [
          [CX - fw - 4, fTop + 13],
          [CX + fw + 16, fTop + 13],
          [CX + fw + 14, fTop + 20],
          [CX - fw - 3, fTop + 20]
        ],
        3
      ),
      ccd
    )
    put('head', oval(CX, fTop - 6, 2.4, 1.8), ccd)
  }
  if (o.head === 'sunhat') {
    var sh2 = col('sunhat')
    put('head', oval(CX, fTop + 14, fw + 30, 9), shade(sh2, -0.08))
    put(
      'head',
      'M' +
        (CX - fw + 2) +
        ' ' +
        (fTop + 13) +
        'C' +
        (CX - fw) +
        ' ' +
        (fTop - 18) +
        ' ' +
        (CX + fw) +
        ' ' +
        (fTop - 18) +
        ' ' +
        (CX + fw - 2) +
        ' ' +
        (fTop + 13) +
        'Z',
      sh2
    )
    put(
      'head',
      rpoly(
        [
          [CX - fw + 2, fTop + 4],
          [CX + fw - 2, fTop + 4],
          [CX + fw - 2, fTop + 11],
          [CX - fw + 2, fTop + 11]
        ],
        1.5
      ),
      '#C9705A'
    )
  }
  if (o.eyes === 'sunglasses') {
    var g2 = col('sunglasses')
    ;[-1, 1].forEach(function (s) {
      put(
        'eyes',
        rpoly(
          [
            [CX + s * 3.5, ey - 6],
            [CX + s * 19, ey - 6],
            [CX + s * 18, ey + 5],
            [CX + s * 5, ey + 5]
          ],
          4
        ),
        g2
      )
    })
    line('eyes', 'M' + (CX - 4) + ' ' + (ey - 3) + 'L' + (CX + 4) + ' ' + (ey - 3), g2, 2)
    both(function (s) {
      line(
        'eyes',
        'M' + (CX + s * 19) + ' ' + (ey - 4) + 'L' + (CX + s * (fw + 1)) + ' ' + (ey - 2),
        g2,
        1.6
      )
    })
  }

  /* ---- umbrella shaft, then the hand that holds it */
  if (holding) {
    var h2 = hd(1)
    line('held', 'M' + ux + ' ' + (uBot - 2) + 'L' + ux + ' ' + (h2[1] + 22), '#2B2E35', 2.4)
    line('held', 'M' + ux + ' ' + (h2[1] + 22) + 'q0 8 -7 8 q-5 0 -5 -5', '#2B2E35', 2.4)
    if (o.hands === 'gloves') glove(1)
    else put('body', oval(h2[0], h2[1], B.hand[2] + 0.6, B.hand[3] - 2.5), SKIN)
  }

  L.forEach(function (x) {
    if (x.fill === null) x.fill = SKIN
  })
  if (only)
    L.forEach(function (x) {
      if (x.slot !== only) {
        x.o =
          (x.o == null ? 1 : x.o) *
          (x.slot === 'body' || x.slot === 'face' || x.slot === 'hair' ? 0.55 : 0.18)
      }
    })
  return { viewBox: VIEW.join(' '), view: VIEW, ground: GROUND, layers: L }
}

/* ------------------------------------------------------------------ the scene behind the character (detail page) */

/* Time of day for a window: from the middle of it, or the current hour for "now". */
function todOf(s, nowH) {
  var h = nowH != null ? nowH : s ? (s.fromH + ((s.toH - s.fromH + 24) % 24 || 24) / 2) % 24 : 12
  if (s && !s.isDay && (h < 5 || h >= 18)) return 'night'
  return h < 5 ? 'night' : h < 10 ? 'morning' : h < 17 ? 'day' : h < 19.5 ? 'evening' : 'night'
}
var PALETTES = {
  morning: {
    sky: ['#F2B5A3', '#FCE3C6'],
    sun: '#FFF0C2',
    cloud: '#FFFFFF',
    cloudO: 0.45,
    hill: '#E8C3BD',
    hill2: '#D9AFB4',
    pine: '#4E9474',
    pine2: '#33735D',
    tree1: '#9CCF84',
    tree2: '#5EA27C',
    treeD: '#2E5E58',
    trunk: '#7C4B35',
    lawn: '#6BB283',
    lawn2: '#579D74',
    road: '#3A4462',
    curb: '#56607F',
    wall: '#F1E6E2',
    wallL: '#D8C7C6',
    roof: '#D99158',
    trim: '#F3CD72',
    door: '#3F7CB8',
    win: '#7FAAD6',
    shade: '#C9BCC1'
  },
  day: {
    sky: ['#A6B7E6', '#CAD5F0'],
    sun: '#FBE6A4',
    cloud: '#FFFFFF',
    cloudO: 0.38,
    hill: '#C7D1EC',
    hill2: '#B7C3E2',
    pine: '#3F8F6B',
    pine2: '#2A6F55',
    tree1: '#8DCB7C',
    tree2: '#4E9A78',
    treeD: '#22524F',
    trunk: '#7A4B33',
    lawn: '#5FA87C',
    lawn2: '#4E9670',
    road: '#2E3A57',
    curb: '#4D587A',
    wall: '#E5E9F1',
    wallL: '#C3CAD8',
    roof: '#D6955A',
    trim: '#F0CB6A',
    door: '#3B78B5',
    win: '#3B78B5',
    shade: '#B9C1D3'
  },
  evening: {
    sky: ['#6B5F9E', '#F1A57D'],
    sun: '#FFC98A',
    cloud: '#FFD9C2',
    cloudO: 0.35,
    hill: '#9C88AE',
    hill2: '#86739C',
    pine: '#3A6E5D',
    pine2: '#284F48',
    tree1: '#6FA073',
    tree2: '#3F7564',
    treeD: '#1F4344',
    trunk: '#5E3A2E',
    lawn: '#4C8566',
    lawn2: '#3F7359',
    road: '#272F4B',
    curb: '#3D4566',
    wall: '#CEC3D6',
    wallL: '#AE9FBA',
    roof: '#B9744B',
    trim: '#E9B865',
    door: '#35609A',
    win: '#F2C76E',
    shade: '#9C8FAE'
  },
  night: {
    sky: ['#1A2145', '#383D70'],
    moon: '#F1E9C9',
    cloud: '#8C93C2',
    cloudO: 0.18,
    hill: '#2F3765',
    hill2: '#283058',
    pine: '#24504A',
    pine2: '#183A38',
    tree1: '#2F5E56',
    tree2: '#224844',
    treeD: '#132D31',
    trunk: '#3C2B2B',
    lawn: '#29504A',
    lawn2: '#21433F',
    road: '#171D35',
    curb: '#262E4E',
    wall: '#5A6287',
    wallL: '#4A5175',
    roof: '#6E5048',
    trim: '#9C7F57',
    door: '#2B3F6A',
    win: '#F5D27A',
    shade: '#454C70'
  }
}
/* One suburban street (houses and trees), recoloured by the time of day. viewBox 0 0 400 300, the
   character stands on the pavement (y 262–300). */
function scene(tod, opts) {
  var P = PALETTES[tod] || PALETTES.day,
    L = [],
    o = opts || {}
  var put = function (d, fill, extra) {
    var x = { d: d, fill: fill }
    for (var k in extra || {}) x[k] = extra[k]
    L.push(x)
  }
  var circ = function (x, y, r) {
    return oval(x, y, r, r)
  }
  /* sun or moon, stars */
  if (tod === 'night') {
    var seed = 3,
      rnd = function () {
        return (seed = (seed * 16807) % 2147483647) / 2147483647
      }
    var stars = ''
    for (var i = 0; i < 22; i++)
      stars += circ(r1(rnd() * 400), r1(rnd() * 150), r1(0.6 + rnd() * 0.9))
    put(stars, '#FFFFFF', { o: 0.75 })
    put(circ(318, 52, 20), P.moon)
    put(circ(328, 46, 18), P.sky[0])
  } else if (tod === 'evening') {
    put(circ(300, 176, 52), P.sun, { o: 0.25 })
    put(circ(300, 176, 30), P.sun)
  } else if (tod === 'morning') {
    put(circ(86, 150, 50), P.sun, { o: 0.3 })
    put(circ(86, 150, 28), P.sun)
  } else {
    put(circ(310, 62, 44), P.sun, { o: 0.28 })
    put(circ(310, 62, 26), P.sun)
  }
  /* soft flat clouds */
  var cloud = function (x, y, w) {
    return (
      'M' +
      x +
      ' ' +
      y +
      'c' +
      w * 0.1 +
      ' -' +
      w * 0.18 +
      ' ' +
      w * 0.3 +
      ' -' +
      w * 0.22 +
      ' ' +
      w * 0.42 +
      ' -' +
      w * 0.12 +
      'c' +
      w * 0.12 +
      ' -' +
      w * 0.16 +
      ' ' +
      w * 0.38 +
      ' -' +
      w * 0.14 +
      ' ' +
      w * 0.46 +
      ' ' +
      w * 0.04 +
      'c' +
      w * 0.08 +
      ' 0 ' +
      w * 0.12 +
      ' ' +
      w * 0.04 +
      ' ' +
      w * 0.12 +
      ' ' +
      w * 0.08 +
      'z'
    )
  }
  put(
    cloud(-10, 48, 150) +
      cloud(150, 92, 120) +
      cloud(270, 120, 150) +
      (o.cloudy ? cloud(40, 110, 170) + cloud(220, 40, 160) : ''),
    P.cloud,
    { o: o.cloudy ? P.cloudO + 0.15 : P.cloudO }
  )
  /* distant hills */
  put('M0 200 C60 168 120 178 170 190 S280 160 330 176 S390 178 400 172 L400 240 L0 240 Z', P.hill)
  put('M0 214 C80 196 150 206 210 210 S330 192 400 204 L400 240 L0 240 Z', P.hill2)
  /* pines on the left */
  var pine = function (x, base, h, w) {
    return (
      'M' +
      x +
      ' ' +
      (base - h) +
      'L' +
      (x + w * 0.5) +
      ' ' +
      (base - h * 0.55) +
      'L' +
      (x + w * 0.3) +
      ' ' +
      (base - h * 0.55) +
      'L' +
      (x + w * 0.62) +
      ' ' +
      (base - h * 0.2) +
      'L' +
      (x + w * 0.35) +
      ' ' +
      (base - h * 0.2) +
      'L' +
      (x + w * 0.7) +
      ' ' +
      base +
      'L' +
      (x - w * 0.7) +
      ' ' +
      base +
      'L' +
      (x - w * 0.35) +
      ' ' +
      (base - h * 0.2) +
      'L' +
      (x - w * 0.62) +
      ' ' +
      (base - h * 0.2) +
      'L' +
      (x - w * 0.3) +
      ' ' +
      (base - h * 0.55) +
      'L' +
      (x - w * 0.5) +
      ' ' +
      (base - h * 0.55) +
      'Z'
    )
  }
  put(pine(22, 238, 128, 54) + pine(96, 238, 96, 44), P.pine2)
  put(pine(58, 240, 110, 50) + pine(132, 240, 74, 36), P.pine)
  put('M57 240 L57 150 M22 238 L22 130', 'none', { stroke: P.trunk, sw: 1.6 })
  /* big round trees behind the house */
  put('M168 238 L172 150 M196 238 L190 140 M182 168 L208 150', 'none', { stroke: P.trunk, sw: 3 })
  put(circ(150, 150, 38) + circ(196, 118, 46) + circ(238, 152, 40), P.tree1)
  put(circ(178, 168, 34) + circ(224, 178, 30) + circ(210, 140, 26), P.tree2)
  put(circ(170, 196, 24) + circ(200, 202, 22), P.treeD)
  /* the house on the right */
  put('M266 150 L330 112 L400 150 L400 240 L266 240 Z', P.wall)
  var siding = ''
  for (var y = 160; y < 240; y += 8) siding += 'M266 ' + y + ' L400 ' + y
  put(siding, 'none', { stroke: P.wallL, sw: 1 })
  put('M256 156 L330 106 L410 156 L404 162 L330 114 L262 162 Z', P.trim)
  put('M262 150 L330 112 L404 150 L404 136 L330 96 L262 136 Z', P.roof)
  var roofL = ''
  for (var k = 0; k < 9; k++)
    roofL +=
      'M' + (276 + k * 14) + ' ' + (136 - Math.max(0, 7 - Math.abs(k - 4) * 1.7) * 4) + ' l -8 14'
  put(roofL, 'none', { stroke: shade(P.roof, -0.2), sw: 1.2 })
  put(
    rpoly(
      [
        [282, 172],
        [312, 172],
        [312, 204],
        [282, 204]
      ],
      1
    ),
    '#FFFFFF',
    { o: tod === 'night' ? 0.25 : 0.9 }
  )
  put(
    rpoly(
      [
        [285, 175],
        [309, 175],
        [309, 201],
        [285, 201]
      ],
      1
    ),
    P.win
  )
  put(
    rpoly(
      [
        [336, 176],
        [360, 176],
        [360, 240],
        [336, 240]
      ],
      1
    ),
    '#FFFFFF',
    { o: tod === 'night' ? 0.25 : 0.9 }
  )
  put(
    rpoly(
      [
        [339, 179],
        [357, 179],
        [357, 240],
        [339, 240]
      ],
      1
    ),
    P.door
  )
  put(
    rpoly(
      [
        [352, 206],
        [354.5, 206],
        [354.5, 216],
        [352, 216]
      ],
      1
    ),
    '#FFFFFF',
    { o: 0.85 }
  )
  put(
    rpoly(
      [
        [372, 172],
        [394, 172],
        [394, 204],
        [372, 204]
      ],
      1
    ),
    P.win
  )
  put('M266 236 L400 236 L400 240 L266 240 Z', P.shade)
  /* lawn, flowers, bushes */
  put('M0 236 L400 236 L400 266 L0 266 Z', P.lawn)
  put('M0 252 C80 246 160 254 240 250 S360 246 400 250 L400 266 L0 266 Z', P.lawn2)
  put(
    circ(30, 250, 2) +
      circ(118, 246, 1.6) +
      circ(208, 256, 2) +
      circ(292, 252, 1.6) +
      circ(366, 258, 2),
    tod === 'night' ? '#C9B98A' : '#F6E9C8',
    { o: 0.9 }
  )
  put(circ(352, 262, 2.6) + circ(46, 258, 2.2), '#E07B5A', { o: tod === 'night' ? 0.5 : 0.9 })
  put('M0 266 C6 248 20 244 34 256 C42 246 58 248 62 266 Z', P.pine2)
  put('M352 266 C356 250 372 246 384 254 C392 246 404 250 404 266 Z', P.tree2)
  /* pavement where the character stands */
  put('M0 264 L400 264 L400 270 L0 270 Z', P.curb)
  put('M0 270 L400 270 L400 300 L0 300 Z', P.road)
  return {
    viewBox: '0 0 400 300',
    sky: P.sky,
    css: 'linear-gradient(180deg, ' + P.sky[0] + ' 0%, ' + P.sky[1] + ' 100%)',
    ink: tod === 'night' || tod === 'evening' ? '#FFFFFF' : '#1E2742',
    ink2: tod === 'night' || tod === 'evening' ? 'rgba(255,255,255,0.78)' : 'rgba(30,39,66,0.72)',
    tod: tod,
    layers: L
  }
}

/* The outfit as one sentence, as data: which template ('wear.sentence.<form>') and which piece fills each
   slot, then the extras ("Add a cap and sunglasses") and whether the hood is up. The app picks the words. */
function sentence(rec) {
  var o = rec.outfit,
    lead = o.outer && o.top ? 'over' : 'one'
  var form = lead + (o.bottom ? 'With' : '')
  var extra = [o.head && o.head !== 'hood' ? o.head : null, o.eyes, o.neck, o.hands, o.held].filter(
    Boolean
  )
  return {
    form: form,
    slots: {
      outer: o.outer && o.top ? o.outer : null,
      top: o.outer && o.top ? o.top : o.outer || o.top,
      bottom: o.bottom,
      feet: o.feet
    },
    extra: extra,
    hood: o.head === 'hood'
  }
}

/* Translate a message from recommend() with vue-i18n's t, nested messages first. */
function wearText(t, msg) {
  if (!msg) return ''
  if (typeof msg === 'string') return msg
  var params = {}
  for (var k in msg.params || {}) {
    var v = msg.params[k]
    params[k] = v && typeof v === 'object' && v.key ? wearText(t, v) : v
  }
  return t(msg.key, params)
}

export {
  summarize,
  windows,
  recommend,
  figure,
  scene,
  todOf,
  sentence,
  wearText,
  bandOf,
  kindOf,
  PALETTES,
  SLOTS,
  COLORS,
  SKINS,
  LOOK
}
