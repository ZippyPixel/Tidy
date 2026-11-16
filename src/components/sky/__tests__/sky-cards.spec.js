import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import * as A from 'astronomy-engine'
import SkyPathChart from '@/components/sky/SkyPathChart.vue'
import WhereToLook from '@/components/sky/WhereToLook.vue'
import { activeI18n } from '@/i18n'
import { createSky, dayStart, formatT, nextDayStart, parseT } from '@/utils/sky'

const PLACE = {
  name: 'Joar Sahara',
  country: 'Bangladesh',
  lat: 23.817,
  lon: 90.417,
  tz: 'Asia/Dhaka'
}
const TZ = PLACE.tz
const sky = createSky(A, PLACE)

let wrapper
function mountCard(
  component,
  { t = parseT('2026-11-16T15:48', TZ), sky: s = sky, tz = TZ, props = {} } = {}
) {
  const ds = dayStart(t, tz)
  wrapper = mount(component, {
    attachTo: document.body,
    props: {
      t,
      tz,
      day: s.day(ds),
      nextDay: s.day(nextDayStart(ds, tz)),
      now: s.instant(t),
      ...props
    },
    global: { plugins: [createPinia(), activeI18n()] }
  })
  return wrapper
}

describe('sky path chart', () => {
  afterEach(() => wrapper?.unmount())

  it('reads out the sun and moon at the instant', () => {
    mountCard(SkyPathChart)
    const reads = wrapper.findAll('[data-read]').map((r) => r.text())
    expect(reads[0]).toBe(
      'Sun · Daylight17° above the horizonWSW (240°) · sets 5:12 PM (in 1h 24m)'
    )
    expect(reads[1]).toContain('Moon · Waxing crescent, 40% lit42° above the horizonSSE')
    expect(reads[1]).toContain('sets 10:57 PM')
    expect(wrapper.find('svg[role="img"]').attributes('aria-label')).toBe(
      'Height of the sun and moon through Monday, November 16. Sunrise 6:13 AM, sunset 5:12 PM, moonrise 11:44 AM, moonset 10:57 PM.'
    )
  })

  it('shades the night either side of civil twilight', () => {
    mountCard(SkyPathChart)
    expect(wrapper.findAll('rect.fill-chart-night')).toHaveLength(2)
  })

  it('shades the whole polar night', () => {
    const oslo = 'Europe/Oslo'
    mountCard(SkyPathChart, {
      sky: createSky(A, { lat: 69.65, lon: 18.96, tz: oslo }),
      tz: oslo,
      t: parseT('2026-12-03T12:00', oslo)
    })
    const bands = wrapper.findAll('rect.fill-chart-night')
    expect(bands).toHaveLength(1)
    expect(bands[0].attributes('width')).toBe('1000.0')
  })

  it('scrubs the time with the pointer, snapped to 5 minutes', async () => {
    mountCard(SkyPathChart)
    const scrub = wrapper.find('[data-scrub]')
    scrub.element.getBoundingClientRect = () => ({ left: 0, width: 1440 })
    const fire = (type, clientX) =>
      scrub.element.dispatchEvent(new MouseEvent(type, { clientX, button: 0 }))
    fire('pointerdown', 601)
    fire('pointermove', 722)
    fire('pointerup', 722)
    expect(wrapper.emitted('preview').map(([m]) => m)).toEqual([600, 720])
    expect(wrapper.emitted('commit')).toEqual([[720]])
  })
})

describe('where to look', () => {
  afterEach(() => wrapper?.unmount())

  it('says where the sun and moon are', () => {
    mountCard(WhereToLook)
    const looks = wrapper.findAll('[data-look]').map((r) => r.text())
    expect(looks[0]).toBe('Sun17° high, towards the WSW (240°)')
    expect(looks[1]).toMatch(/^Moon42° high, towards the SSE \(\d+°\)$/)
  })

  it('puts a body below the horizon outside the rim and says when it rises', () => {
    mountCard(WhereToLook, { t: parseT('2026-11-16T21:00', TZ) })
    const [x, y] = [
      Number(wrapper.find('[data-sun]').attributes('cx')),
      Number(wrapper.find('[data-sun]').attributes('cy'))
    ]
    expect(Math.hypot(x - 120, y - 120)).toBeCloseTo(101, 0)
    expect(wrapper.findAll('[data-look]')[0].text()).toContain('Rises 6:14 AM.')
  })

  it('shows the tracks above the horizon only', () => {
    mountCard(WhereToLook)
    const sunTrack = wrapper.find('path.stroke-sun-arc-ahead').attributes('d')
    expect(sunTrack.startsWith('M')).toBe(true)
    expect(sunTrack.match(/M/g)).toHaveLength(1)
  })
})

describe('commit format', () => {
  it('rounds trips through the place clock', () => {
    expect(formatT(parseT('2026-11-16T15:48', TZ), TZ)).toBe('2026-11-16T15:48')
  })
})
