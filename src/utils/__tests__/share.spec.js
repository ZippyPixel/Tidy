import { describe, expect, it } from 'vitest'
import {
  conditionKind,
  mixHex,
  paletteKey,
  skyPalette,
  timeOfDay
} from '@/utils/share/skyPalette'
import { skyScene } from '@/utils/share/skyArt'
import {
  capacity,
  detailChip,
  fitDetails,
  headerLayout,
  HEADER_DEFAULT,
  isDefaultHeader,
  momentDetails,
  momentFor,
  slotsUsed,
  toggleDetail,
  toggleHeaderLine
} from '@/utils/share/shareContent'
import { aqiScale, uvScale, visibilityScale } from '@/utils/share/scales'
import { sunArc } from '@/utils/share/sunArc'
import {
  parseShareLink,
  roundCoord,
  shareFileName,
  shareQuery,
  shareUrl,
  siteLabel,
  slugify,
  withoutShare
} from '@/utils/share/shareLink'
import { EPA_LEVELS, UV_LEVELS } from '@/constants/levelColors'
import { exifOffsetMinutes, exifWallClock, photoTakenAt } from '@/utils/share/photoTime'

const RISE = 6 * 60 // 6:00
const SET = 18 * 60 // 18:00

describe('sky palette', () => {
  it('sorts condition codes into kinds', () => {
    expect(conditionKind(1000)).toBe('clear')
    expect(conditionKind(1003)).toBe('partly')
    expect(conditionKind(1009)).toBe('cloudy')
    expect(conditionKind(1135)).toBe('fog')
    expect(conditionKind(1087)).toBe('storm')
    expect(conditionKind(1213)).toBe('snow')
    expect(conditionKind(1183)).toBe('rain')
    expect(conditionKind(undefined)).toBe('clear')
  })

  it('calls ±45 minutes around sunrise and sunset dawn and dusk', () => {
    expect(timeOfDay(RISE - 44, RISE, SET)).toBe('dawn')
    expect(timeOfDay(RISE + 44, RISE, SET)).toBe('dawn')
    expect(timeOfDay(RISE + 45, RISE, SET)).toBe('day')
    expect(timeOfDay(SET - 30, RISE, SET)).toBe('dusk')
    expect(timeOfDay(SET + 45, RISE, SET)).toBe('night')
    expect(timeOfDay(2 * 60, RISE, SET)).toBe('night')
    expect(timeOfDay(12 * 60, null, null)).toBe('day')
  })

  it('picks the palette from the condition and the time of day', () => {
    expect(paletteKey(1000, 'day').key).toBe('day')
    expect(paletteKey(1003, 'day').key).toBe('partly')
    expect(paletteKey(1000, 'dawn').key).toBe('dawn')
    expect(paletteKey(1003, 'dusk').key).toBe('dusk')
    expect(paletteKey(1000, 'night').key).toBe('night')
    expect(paletteKey(1009, 'day').key).toBe('cloudy')
    expect(paletteKey(1009, 'night').key).toBe('nightCloudy')
    expect(paletteKey(1135, 'day').key).toBe('fog')
    expect(paletteKey(1213, 'day').key).toBe('snow')
    expect(paletteKey(1213, 'night').key).toBe('nightCloudy')
    expect(paletteKey(1183, 'day')).toEqual({ key: 'rain', flash: false })
    expect(paletteKey(1087, 'day')).toEqual({ key: 'storm', flash: true })
  })

  it('gives rain at night the storm palette without the flash', () => {
    const pal = skyPalette({ code: 1183, now: 23 * 60, rise: RISE, set: SET })
    expect(pal.key).toBe('storm')
    expect(pal.flash).toBe(false)
    expect(skyPalette({ code: 1276, now: 23 * 60, rise: RISE, set: SET }).flash).toBe(true)
  })

  it('has four gradient stops and a shade tinted from its darkest colour', () => {
    const pal = skyPalette({ code: 1000, now: 12 * 60, rise: RISE, set: SET })
    expect(pal.stops).toHaveLength(4)
    expect(pal.stops[0]).toBe(pal.a)
    expect(pal.stops[3]).toBe(pal.c)
    expect(pal.shade).toBe(mixHex(pal.a, '#000000', 0.42))
    expect(pal.shade).not.toBe('#000000')
  })

  it('mixes hex colours', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mixHex('#102030', '#102030', 0.3)).toBe('#102030')
  })

  it('draws the same scene for the same sky, and only what the palette asks for', () => {
    const night = skyPalette({ code: 1000, now: 0, rise: RISE, set: SET })
    expect(skyScene(night, 640)).toEqual(skyScene(night, 640))
    expect(skyScene(night, 640).stars.length).toBeGreaterThan(0)
    expect(skyScene(night, 640).clouds).toHaveLength(0)
    const cloudy = skyPalette({ code: 1009, now: 12 * 60, rise: RISE, set: SET })
    expect(skyScene(cloudy, 640).clouds).toHaveLength(6)
    expect(skyScene(cloudy, 640).stars).toHaveLength(0)
  })

  it('keeps cloud slots clear of the text column on the left', () => {
    const cloudy = skyPalette({ code: 1009, now: 12 * 60, rise: RISE, set: SET })
    const starts = skyScene(cloudy, 640).clouds.map((c) => Number(c.d.match(/^M(-?[\d.]+)/)[1]))
    // the one faint slot bleeds in from the left edge; the rest start right of centre-left
    expect(starts.filter((x) => x < 120)).toHaveLength(1)
  })
})

describe('header lines', () => {
  it('shows everything but feels like by default', () => {
    expect(HEADER_DEFAULT).not.toContain('feels')
    const l = headerLayout()
    expect(l).toMatchObject({ place: true, date: true, temp: true, summary: true, hilo: true, feels: false })
    expect(l.summaryHero).toBe(false)
  })

  it('gives the summary the headline size with the temperature off', () => {
    expect(headerLayout(['summary']).summaryHero).toBe(true)
    expect(headerLayout(['temp', 'summary']).summaryHero).toBe(false)
  })

  it('shares one small line between high & low and feels like', () => {
    expect(headerLayout(['feels']).sub).toBe(true)
    expect(headerLayout(['hilo']).sub).toBe(true)
    expect(headerLayout(['temp']).sub).toBe(false)
  })

  it('has no top and no hero with everything off', () => {
    expect(headerLayout([])).toMatchObject({ top: false, hero: false, sub: false })
    expect(headerLayout(['date']).top).toBe(true)
  })

  it('toggles a line and keeps display order', () => {
    expect(toggleHeaderLine(['place', 'temp'], 'date')).toEqual(['place', 'date', 'temp'])
    expect(toggleHeaderLine(['place', 'temp'], 'place')).toEqual(['temp'])
    expect(isDefaultHeader(toggleHeaderLine(HEADER_DEFAULT, 'feels'))).toBe(false)
    expect(isDefaultHeader([...HEADER_DEFAULT])).toBe(true)
  })
})

describe('detail capacity', () => {
  it('fits 6 on a story or sticker and 4 on a post or square', () => {
    expect(capacity('sky', 'story')).toBe(6)
    expect(capacity('photo', 'story')).toBe(6)
    expect(capacity('sticker', 'square')).toBe(6)
    expect(capacity('sky', 'post')).toBe(4)
    expect(capacity('photo', 'square')).toBe(4)
  })

  it('counts What to wear as two', () => {
    expect(slotsUsed(['wear', 'rain'])).toBe(3)
    expect(fitDetails(['rain', 'uv', 'wind', 'wear'], 4)).toEqual(['rain', 'uv', 'wind'])
    expect(fitDetails(['wear', 'rain', 'uv', 'wind'], 4)).toEqual(['wear', 'rain', 'uv'])
  })

  it('drops unknown and repeated details', () => {
    expect(fitDetails(['wind', 'nope', 'wind'], 6)).toEqual(['wind'])
  })

  it('keeps the first four of Today on a post', () => {
    expect(momentDetails('today', 4)).toEqual(['wind', 'visibility', 'uv', 'aqi'])
    expect(momentDetails('today', 6)).toHaveLength(6)
  })

  it('disables a chip that would not fit', () => {
    const ids = ['wind', 'uv', 'rain']
    expect(detailChip(ids, 'cloud', 4).disabled).toBe(false)
    expect(detailChip(ids, 'wear', 4).disabled).toBe(true)
    expect(detailChip(ids, 'wind', 4)).toEqual({ id: 'wind', on: true, disabled: false })
  })

  it('clears the moment when details are edited by hand', () => {
    const today = momentDetails('today', 6)
    expect(momentFor(today, 6)).toBe('today')
    const edited = toggleDetail(today, 'moon', 6)
    expect(edited.details).not.toContain('moon')
    expect(edited.moment).toBe(null)
    expect(toggleDetail(edited.details, 'moon', 6).moment).toBe('today')
  })

  it('ignores a toggle that would overflow', () => {
    const full = momentDetails('today', 6)
    expect(toggleDetail(full, 'rain', 6).details).toEqual(full)
  })
})

describe('scales', () => {
  it('places the UV marker by band and colours it by level', () => {
    expect(uvScale(0).marker.left).toBeCloseTo((0.5 / 12) * 100)
    expect(uvScale(6).marker.left).toBeCloseTo((6.5 / 12) * 100)
    expect(uvScale(6).marker.color).toBe(UV_LEVELS[2].color)
    expect(uvScale(2.4).level).toBe('low')
    expect(uvScale(11).level).toBe('extreme')
    expect(uvScale(14).marker.left).toBe(96)
    expect(uvScale(1).segments.map((s) => s.flex)).toEqual([3, 3, 2, 3, 1])
  })

  it('places AQI on six equal segments', () => {
    const s = aqiScale(3)
    expect(s.segments).toHaveLength(6)
    expect(s.segments.every((x) => x.flex === 1)).toBe(true)
    expect(s.marker.left).toBeCloseTo((2.5 / 6) * 100)
    expect(s.marker.color).toBe(EPA_LEVELS[2].color)
    expect(aqiScale(99).level).toBe('hazardous')
    expect(aqiScale(undefined).level).toBe('good')
  })

  it('places visibility at min(km, 12) / 12', () => {
    expect(visibilityScale(6).marker.left).toBe(50)
    expect(visibilityScale(30).marker.left).toBe(96)
    expect(visibilityScale(0).marker.left).toBe(4)
    expect(visibilityScale(6).segments.map((s) => s.flex)).toEqual([2, 3, 5, 2])
    expect(visibilityScale(6, { dark: true }).segments[0].color).toContain('17,24,39')
  })
})

describe('sun arc', () => {
  it('peaks at solar noon with the lit stretch centred', () => {
    const arc = sunArc(RISE, SET, 12 * 60)
    expect(arc.dot.x).toBe(50)
    // top of the 40-unit box is 5, so the peak sits at 12.5%
    expect(arc.dot.y).toBe(12.5)
    expect(arc.up).toBe(true)
    expect(arc.riseX).toBe(25)
    expect(arc.setX).toBe(75)
  })

  it('puts the sun below the horizon at night, clamped to the window', () => {
    const arc = sunArc(RISE, SET, 23 * 60)
    expect(arc.up).toBe(false)
    expect(arc.dot.x).toBeCloseTo(((23 * 60 - 0) / 1440) * 100, 1)
    expect(arc.dot.y).toBeGreaterThan(50)
  })

  it('draws paths in the 100 × 40 box', () => {
    const arc = sunArc(RISE, SET, 9 * 60)
    expect(arc.full.startsWith('M0.0,')).toBe(true)
    expect(arc.lit.startsWith('M25.0,')).toBe(true)
  })

  it('is null without a sunrise or sunset', () => {
    expect(sunArc(null, SET, 600)).toBe(null)
  })
})

describe('share link', () => {
  const place = { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lon: 90.4125, tz: 'Asia/Dhaka' }

  it('rounds a city to 2 decimals and keeps its name', () => {
    expect(shareQuery({ place, precision: 'city', date: '2026-11-19', moment: 'today' })).toEqual({
      lat: '23.81',
      lon: '90.41',
      name: 'Dhaka',
      country: 'Bangladesh',
      tz: 'Asia/Dhaka',
      d: '2026-11-19',
      from: 'share',
      m: 'today'
    })
  })

  it('rounds a region to 1 decimal and drops the name', () => {
    const q = shareQuery({ place, precision: 'region', date: '2026-11-19', moment: 'beach' })
    expect(q).toMatchObject({ lat: '23.8', lon: '90.4', country: 'Bangladesh', tz: 'Asia/Dhaka' })
    expect(q).not.toHaveProperty('name')
  })

  it('sends no place with Location off', () => {
    const q = shareQuery({ place, precision: null, date: '2026-11-19', moment: 'sky' })
    expect(q).toEqual({ d: '2026-11-19', from: 'share', m: 'sky' })
  })

  it('drops a bad date or moment', () => {
    expect(shareQuery({ place: null, precision: null, date: 'soon', moment: 'party' })).toEqual({ from: 'share' })
  })

  it('never writes -0', () => {
    expect(roundCoord(-0.001, 2)).toBe('0')
    expect(roundCoord(-33.8688, 1)).toBe('-33.9')
  })

  it('builds the link from the origin', () => {
    const url = shareUrl('https://example.test/', { lat: '1', from: 'share' })
    expect(url).toBe('https://example.test/?lat=1&from=share')
    expect(siteLabel('https://example.test/')).toBe('example.test')
  })

  it('reads a link back with the Sun & Moon place parser', () => {
    const q = shareQuery({ place, precision: 'city', date: '2026-11-19', moment: 'outfit' })
    const parsed = parseShareLink(q)
    expect(parsed.place).toMatchObject({ name: 'Dhaka', lat: 23.81, lon: 90.41, tz: 'Asia/Dhaka' })
    expect(parsed.date).toBe('2026-11-19')
    expect(parsed.moment).toBe('outfit')
    expect(parseShareLink({ lat: '1', lon: '2' })).toBe(null)
    expect(parseShareLink({ from: 'share' })).toEqual({ place: null, date: null, moment: null })
  })

  it('strips every share key and keeps the rest', () => {
    const q = { ...shareQuery({ place, precision: 'city', date: '2026-11-19', moment: 'today' }), keep: 'me' }
    expect(withoutShare(q)).toEqual({ keep: 'me' })
  })
})

describe('file name', () => {
  it('is tidy-<place>-<date>.png', () => {
    expect(shareFileName('São Paulo', '2026-11-19')).toBe('tidy-sao-paulo-2026-11-19.png')
    expect(shareFileName('Cox’s Bazar', '2026-11-19')).toBe('tidy-cox-s-bazar-2026-11-19.png')
  })

  it('is tidy-<date>.png with Location off', () => {
    expect(shareFileName('', '2026-11-19')).toBe('tidy-2026-11-19.png')
    expect(shareFileName(null, '2026-11-19')).toBe('tidy-2026-11-19.png')
  })

  it('keeps letters of any script', () => {
    expect(slugify('ঢাকা')).not.toBe('')
    expect(slugify('  --Hello,  World!-- ')).toBe('hello-world')
  })
})

describe('photo time', () => {
  it('reads the EXIF wall clock', () => {
    expect(exifWallClock('2026:11:04 17:42:00')).toBe(Date.UTC(2026, 10, 4, 17, 42, 0))
    expect(exifWallClock('nope')).toBe(null)
    expect(exifWallClock('0000:00:00 00:00:00')).toBe(null)
  })

  it('reads offsets', () => {
    expect(exifOffsetMinutes('+05:30')).toBe(330)
    expect(exifOffsetMinutes('-04:00')).toBe(-240)
    expect(exifOffsetMinutes('')).toBe(null)
  })

  it('pins the clock with the camera offset', () => {
    expect(photoTakenAt({ dateTimeOriginal: '2026:11:04 17:42:00', offsetTimeOriginal: '+06:00' }, 'UTC')).toBe(
      Date.UTC(2026, 10, 4, 11, 42)
    )
  })

  it("otherwise reads the clock as the place's", () => {
    expect(photoTakenAt({ dateTimeOriginal: '2026:11:04 17:42:00' }, 'Asia/Dhaka')).toBe(Date.UTC(2026, 10, 4, 11, 42))
    // New York in summer is UTC−4
    expect(photoTakenAt({ dateTimeOriginal: '2026:07:04 12:00:00' }, 'America/New_York')).toBe(
      Date.UTC(2026, 6, 4, 16, 0)
    )
    expect(photoTakenAt({ dateTimeOriginal: null }, 'UTC')).toBe(null)
  })
})
