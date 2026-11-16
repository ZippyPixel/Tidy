import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import * as A from 'astronomy-engine'
import ComingUp from '@/components/sky/ComingUp.vue'
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

describe('prayer times', () => {
  afterEach(() => wrapper?.unmount())

  async function mountPrayer({
    place = PLACE,
    at = '2026-11-16T15:48',
    pinia = createPinia()
  } = {}) {
    const { default: PrayerTimes } = await import('@/components/sky/PrayerTimes.vue')
    const s = place === PLACE ? sky : createSky(A, place)
    const t = parseT(at, place.tz)
    wrapper = mount(PrayerTimes, {
      props: { t, tz: place.tz, sky: s, ds: dayStart(t, place.tz) },
      global: { plugins: [pinia, activeI18n()] }
    })
    return wrapper
  }
  const times = () => wrapper.findAll('[data-prayer]').map((r) => r.text())

  it('lists Karachi / Hanafi times with the next prayer counted down', async () => {
    await mountPrayer()
    expect(times()).toEqual([
      'FajrDawn4:55 AM',
      'SunriseFajr ends6:13 AM',
      'DhuhrJust after midday11:43 AM',
      'AsrAfternoon3:37 PM',
      'MaghribNext · in 1h 24m5:12 PM',
      'IshaNight6:31 PM'
    ])
    expect(wrapper.find('[data-method]').text()).toBe('Karachi18° / 18°')
  })

  it('switches Asr to Standard and cycles the method, remembering both', async () => {
    document.cookie = 'tidy-prayer=; max-age=0; path=/'
    await mountPrayer()
    await wrapper.find('[data-asr="standard"]').trigger('click')
    expect(times()[3]).toBe('AsrAfternoon2:50 PM')
    await wrapper.find('[data-method]').trigger('click')
    expect(wrapper.find('[data-method]').text()).toBe('Muslim World League18° / 17°')
    expect(document.cookie).toContain('tidy-prayer=mwl%7Cstandard')
  })

  it('shows tomorrow’s Fajr once Isha has passed', async () => {
    await mountPrayer({ at: '2026-11-16T22:00' })
    expect(wrapper.find('[data-prayer-day]').text()).toMatch(/^Fajr tomorrow 4:5\d AM$/)
    expect(wrapper.find('[aria-current="time"]').exists()).toBe(false)
  })

  it('shows a dash where the sun never reaches the angle', async () => {
    await mountPrayer({
      place: { lat: 69.65, lon: 18.96, tz: 'Europe/Oslo' },
      at: '2026-12-03T12:00'
    })
    const rows = times()
    expect(rows[1]).toMatch(/—$/)
    expect(rows[3]).toMatch(/—$/)
    expect(rows[4]).toMatch(/—$/)
  })
})

describe('planets', () => {
  afterEach(() => wrapper?.unmount())

  it('lists Mercury to Saturn with brightness and rise/set', async () => {
    const { default: PlanetsCard } = await import('@/components/sky/PlanetsCard.vue')
    mountCard(PlanetsCard, { t: parseT('2026-11-16T19:00', TZ) })
    const rows = wrapper.findAll('[data-planet]')
    expect(rows.map((r) => r.text().match(/^[A-Z][a-z]+/)[0])).toEqual([
      'Mercury',
      'Venus',
      'Mars',
      'Jupiter',
      'Saturn'
    ])
    for (const r of rows) expect(r.text()).toMatch(/↑ (\d+:\d\d [AP]M|—)\s+↓ (\d+:\d\d [AP]M|—)$/)
    // nothing is "visible" in daylight
    wrapper.unmount()
    mountCard(PlanetsCard)
    expect(wrapper.find('[data-visible]').exists()).toBe(false)
    expect(wrapper.text()).toMatch(/hidden by daylight|Below the horizon/)
  })
})

describe('coming up', () => {
  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  async function mountAhead({
    now = parseT('2026-11-17T10:00', TZ),
    at = '2026-11-16T15:48'
  } = {}) {
    const t = parseT(at, TZ)
    wrapper = mount(ComingUp, {
      attachTo: document.body,
      props: {
        tz: TZ,
        now,
        sky: createSky(A, PLACE),
        ds: dayStart(t, TZ),
        placeName: 'Joar Sahara',
        lat: PLACE.lat
      },
      global: { plugins: [createPinia(), activeI18n()] }
    })
    return wrapper
  }

  it('shows the first 10 with the full date, counted from today rather than the chosen day', async () => {
    await mountAhead()
    const rows = wrapper.findAll('[data-ahead]')
    expect(rows).toHaveLength(10)
    expect(rows[0].text()).toContain('Leonids meteor shower')
    expect(rows[0].find('[data-ahead-date]').text()).toBe('Tue, Nov 17, 2026')
    // today is Nov 17, though the page shows Nov 16
    expect(rows[0].find('[data-ahead-in]').text()).toBe('today')
    expect(rows[1].find('[data-ahead-date]').text()).toBe('Thu, Nov 26, 2026')
    expect(rows[1].find('[data-ahead-in]').text()).toBe('in 9 days')
  })

  it('counts back for events before today', async () => {
    await mountAhead({ now: parseT('2026-12-01T10:00', TZ) })
    expect(wrapper.findAll('[data-ahead-in]')[1].text()).toBe('5 days ago')
  })

  it('loads the next 10 at the end of the list, up to three years', async () => {
    vi.useFakeTimers()
    await mountAhead()
    await wrapper.find('[data-ahead-more]').trigger('click')
    expect(wrapper.find('[data-ahead-loading]').exists()).toBe(true)
    await vi.runAllTimersAsync()
    expect(wrapper.findAll('[data-ahead]')).toHaveLength(20)
    for (let i = 0; i < 20 && wrapper.find('[data-ahead-more]').exists(); i++) {
      await wrapper.find('[data-ahead-more]').trigger('click')
      await vi.runAllTimersAsync()
    }
    expect(wrapper.find('[data-ahead-end]').text()).toBe("That's everything up to November 2029.")
    const dates = wrapper.findAll('[data-ahead-date]').map((d) => d.text())
    expect(dates.at(-1)).toMatch(/2029$/)
  })

  it('opens the details instead of jumping, and jumps from there', async () => {
    await mountAhead()
    await wrapper.findAll('[data-ahead]')[1].trigger('click')
    await flushPromises()
    const detail = document.querySelector('[data-event-detail]')
    expect(detail).not.toBeNull()
    expect(wrapper.emitted('commit')).toBeUndefined()
    expect(detail.querySelector('[data-event-label]').textContent).toBe('Moon closest to Earth')
    expect(detail.querySelector('[data-event-when]').textContent).toMatch(
      /^Thu, Nov 26, 2026 · \d+:\d\d [AP]M · in 9 days$/
    )
    const tiles = [...detail.querySelectorAll('[data-tile]')].map((x) => x.textContent)
    expect(tiles[0]).toMatch(/^Distance359,\d{3} km/)
    detail.querySelector('[data-event-jump]').click()
    // on a phone the drawer closes through history.back(); the jump waits for that
    await new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }))
    await flushPromises()
    expect(formatT(wrapper.emitted('commit')[0][0], TZ).slice(0, 10)).toBe('2026-11-26')
  })

  it('describes an eclipse in its detail', async () => {
    vi.useFakeTimers()
    await mountAhead()
    while (!wrapper.findAll('[data-ahead]').some((r) => r.text().includes('lunar eclipse'))) {
      await wrapper.find('[data-ahead-more]').trigger('click')
      await vi.runAllTimersAsync()
    }
    vi.useRealTimers()
    await wrapper
      .findAll('[data-ahead]')
      .find((r) => r.text().includes('lunar eclipse'))
      .trigger('click')
    await flushPromises()
    const labels = [
      ...document.querySelectorAll('[data-event-detail] [data-tile] span:first-child')
    ].map((x) => x.textContent)
    expect(labels).toEqual(expect.arrayContaining(['Type', 'Peak', 'Moon at the peak', 'Lasts']))
    expect(document.querySelector('[data-event-note]').textContent).toContain('safe to watch')
  })
})
