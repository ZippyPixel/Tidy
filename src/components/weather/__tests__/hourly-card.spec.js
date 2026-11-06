import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import DailyChart from '@/components/weather/DailyChart.vue'
import HourlyTrends from '@/components/weather/HourlyTrends.vue'
import { activeI18n } from '@/i18n'
import useWeatherStore from '@/stores/weather'
import useUnitStore from '@/stores/unit'
import { normalizeHour } from '@/utils/hourly'

const i18n = activeI18n()

const apiHour = (date, h) => ({
  time: `${date} ${String(h).padStart(2, '0')}:00`,
  temp_c: 25 + h / 4,
  temp_f: 77 + h / 2,
  feelslike_c: 27,
  feelslike_f: 81,
  chance_of_rain: h * 4,
  wind_kph: 10 + h,
  wind_mph: 6 + h / 2,
  wind_degree: 200,
  humidity: 80,
  condition: { code: 1063, text: 'Patchy rain nearby' },
  is_day: h >= 6 && h < 18 ? 1 : 0,
  pressure_mb: 1050 - h * 2,
  uv: 1,
  vis_km: 10
})
const DATES = ['2026-07-15', '2026-07-16']
const hourly = Object.fromEntries(DATES.map((d) => [d, Array.from({ length: 24 }, (_, h) => normalizeHour(apiHour(d, h)))]))
const forecast = [
  { date: DATES[0], astro: { sunrise: '05:18 AM', sunset: '06:50 PM' } },
  { date: DATES[1], astro: { sunrise: '05:19 AM', sunset: '06:50 PM' } }
]

// 2026-07-15 15:20 in UTC+6
const NOW = Date.UTC(2026, 6, 15, 9, 20)
const realNow = Date.now

function setup(state = {}) {
  const pinia = createPinia()
  const store = useWeatherStore(pinia)
  store.$patch({ hourly, forecast, date: DATES[0], today: DATES[0], zoneOffsetMs: 6 * 3600000, ...state })
  const wrapper = mount(DailyChart, { global: { plugins: [pinia, i18n] } })
  return { wrapper, store, unit: useUnitStore(pinia) }
}

describe('Hourly card', () => {
  beforeEach(() => {
    Date.now = () => NOW
    localStorage.clear()
  })
  afterEach(() => {
    Date.now = realNow
  })

  it('starts the Summary strip at the location’s current hour', () => {
    const { wrapper } = setup()
    const cards = wrapper.findAll('[role="tabpanel"]')[0].findAll('.rounded-tile')
    expect(cards[0].text()).toContain('Now')
    expect(cards[0].classes()).toContain('bg-accent')
    // tags: Today on the first card, Tomorrow after the midnight divider
    expect(wrapper.text()).toContain('Today')
    expect(wrapper.text()).toContain('Tomorrow')
    expect(wrapper.text()).toContain('Sunset')
    expect(wrapper.text()).toContain('Sunrise')
  })

  it('shows a picked day from midnight, without a Now card', async () => {
    const { wrapper, store } = setup()
    store.date = DATES[1]
    await wrapper.vm.$nextTick()
    const first = wrapper.findAll('[role="tabpanel"]')[0].findAll('.rounded-tile')[0]
    expect(first.text()).toContain('12 AM')
    expect(first.classes()).not.toContain('bg-accent')
  })

  it('switches to Trends and remembers the choice', async () => {
    const { wrapper } = setup()
    const [summary, trends] = wrapper.findAll('[role="tab"]')
    expect(summary.attributes('aria-selected')).toBe('true')
    await trends.trigger('click')
    expect(trends.attributes('aria-selected')).toBe('true')
    expect(wrapper.findAll('[role="tabpanel"]')[1].attributes('aria-hidden')).toBe('false')
    expect(localStorage.getItem('tidy.hourly.mode')).toBe('trends')

    const again = setup().wrapper
    await flushPromises()
    expect(again.findAll('[role="tab"]')[1].attributes('aria-selected')).toBe('true')
  })

  it('uses the unit for temperatures and wind', async () => {
    const { wrapper, unit } = setup()
    unit.setUnit('fahrenheit')
    await wrapper.vm.$nextTick()
    const first = wrapper.findAll('[role="tabpanel"]')[0].findAll('.rounded-tile')[0]
    expect(first.text()).toContain('85°') // 77 + 15/2 = 84.5
    expect(first.text()).toContain('mph')
  })

  describe('hour detail', () => {
    const hourButtons = (wrapper) => wrapper.findAll('[role="tabpanel"]')[0].findAll('button[aria-haspopup="dialog"]')
    const dialog = () => document.querySelector('[role="dialog"]')
    // trigger() cannot set clientX on a MouseEvent
    const fire = async (card, type, init) => {
      card.element.dispatchEvent(new MouseEvent(type, { bubbles: true, ...init }))
      await flushPromises()
    }
    let mounted

    function open(state) {
      const result = setup(state)
      mounted = result.wrapper
      return result
    }

    afterEach(() => {
      mounted?.unmount()
      document.body.innerHTML = ''
    })

    it('makes every hour card a labelled button, and no sunrise or sunset card', () => {
      const { wrapper } = open()
      const strip = wrapper.findAll('[role="tabpanel"]')[0]
      expect(hourButtons(wrapper)).toHaveLength(25)
      expect(hourButtons(wrapper)[0].attributes('aria-label')).toBe('Today, Now: 29°, Patchy rain nearby. Show details')
      expect(hourButtons(wrapper)[1].attributes('aria-label')).toContain('Today, 4 PM')
      const sunset = strip.findAll('.rounded-tile').find((card) => card.text().includes('Sunset'))
      expect(sunset.element.tagName).toBe('DIV')
    })

    it('keeps the Now accent, and gets the inset ring on hover', () => {
      const { wrapper } = open()
      const [now, next] = hourButtons(wrapper)
      expect(now.classes()).toContain('bg-accent')
      expect(next.classes()).not.toContain('bg-accent')
      expect(next.attributes('class')).toContain('hover:shadow-[inset_0_0_0_1px_hsl(var(--input))]')
    })

    it('keeps the strip scrolling and snapping per card', () => {
      const { wrapper } = open()
      const scroller = wrapper.find('[role="region"]')
      expect(scroller.classes()).toEqual(expect.arrayContaining(['overflow-x-auto', 'snap-x', 'snap-mandatory']))
      expect(hourButtons(wrapper)[0].element.parentElement.classList).toContain('snap-start')
    })

    it('opens the modal for the clicked hour', async () => {
      const { wrapper } = open()
      await hourButtons(wrapper)[1].trigger('click')
      await flushPromises()
      expect(dialog().textContent).toContain('Today · 4 PM')
      expect(dialog().textContent).toContain('Patchy rain nearby')
    })

    it('labels the first card as Now in the modal', async () => {
      const { wrapper } = open()
      await hourButtons(wrapper)[0].trigger('click')
      await flushPromises()
      expect(dialog().textContent).toContain('Today · Now')
    })

    it('finds the pressure trend of the first card outside the visible window', async () => {
      const { wrapper } = open()
      await hourButtons(wrapper)[0].trigger('click')
      await flushPromises()
      expect(dialog().textContent).toContain('Falling')
    })

    it('does not open when the press moved, as a swipe does', async () => {
      const { wrapper } = open()
      const card = hourButtons(wrapper)[1]
      await fire(card, 'pointerdown', { clientX: 200, clientY: 100 })
      await fire(card, 'click', { clientX: 150, clientY: 100, detail: 1 })
      await flushPromises()
      expect(dialog()).toBeNull()
    })

    it('does not open when the strip scrolled under the press', async () => {
      const { wrapper } = open()
      const card = hourButtons(wrapper)[1]
      const scroller = wrapper.find('[role="region"]').element
      await fire(card, 'pointerdown', { clientX: 200, clientY: 100 })
      scroller.scrollLeft = 80
      await fire(card, 'click', { clientX: 200, clientY: 100, detail: 1 })
      await flushPromises()
      expect(dialog()).toBeNull()
    })

    it('opens on a tap with a little finger movement', async () => {
      const { wrapper } = open()
      const card = hourButtons(wrapper)[1]
      await fire(card, 'pointerdown', { clientX: 200, clientY: 100 })
      await fire(card, 'click', { clientX: 204, clientY: 102, detail: 1 })
      await flushPromises()
      expect(dialog()).not.toBeNull()
    })

    it('opens from the keyboard after a cancelled swipe', async () => {
      const { wrapper } = open()
      const card = hourButtons(wrapper)[1]
      await fire(card, 'pointerdown', { clientX: 200, clientY: 100 })
      await card.trigger('pointercancel')
      await fire(card, 'click', { clientX: 0, clientY: 0, detail: 0 })
      await flushPromises()
      expect(dialog()).not.toBeNull()
    })
  })
})

describe('HourlyTrends', () => {
  const points = hourly[DATES[0]].map((p) => ({ ...p, dayOffset: 0 }))

  function mountTrends(props = {}) {
    return mount(HourlyTrends, {
      props: { points, live: true, today: DATES[0], metric: 'temp', ...props },
      global: { plugins: [createPinia(), i18n] }
    })
  }

  it('offers five metric chips and reports a pick', async () => {
    const wrapper = mountTrends()
    const chips = wrapper.findAll('[role="radio"]')
    expect(chips.map((c) => c.text())).toEqual(['Temperature', 'Feels like', 'Chance of rain', 'Wind', 'Humidity'])
    expect(chips[0].attributes('aria-checked')).toBe('true')
    await chips[3].trigger('click')
    expect(wrapper.emitted('update:metric')[0]).toEqual(['wind'])
  })

  it('draws a line and area for temperature, bars for rain', async () => {
    const wrapper = mountTrends()
    expect(wrapper.findAll('svg path[fill^="url("]')).toHaveLength(1)
    expect(wrapper.findAll('svg rect')).toHaveLength(0)
    await wrapper.setProps({ metric: 'rain' })
    expect(wrapper.findAll('svg rect')).toHaveLength(24)
    expect(wrapper.text()).toContain('100%')
  })

  it('labels every 3 h, hiding the in-between ones below md', () => {
    const wrapper = mountTrends()
    const ticks = wrapper.findAll('.top-\\[calc\\(100\\%\\+8px\\)\\] span').slice(1)
    expect(ticks.map((t) => t.text())).toEqual(['Now', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'])
    expect(ticks[1].classes()).toContain('hidden')
    expect(ticks[2].classes()).not.toContain('hidden')
  })

  it('reads a value under the pointer and keeps it after a touch', async () => {
    const wrapper = mountTrends({ metric: 'wind' })
    const layer = wrapper.find('.cursor-crosshair')
    layer.element.getBoundingClientRect = () => ({ left: 0, width: 1000, top: 0, height: 160 })
    const event = (type, x, pointerType) => {
      const e = new MouseEvent(type, { clientX: x, bubbles: true })
      Object.defineProperty(e, 'pointerType', { value: pointerType })
      return e
    }
    // x = 8 + 12 * (984 / 23) ≈ 521 -> hour 12
    layer.element.dispatchEvent(event('pointerdown', 521, 'touch'))
    await wrapper.vm.$nextTick()
    const tip = wrapper.find('[role="status"]')
    expect(tip.text()).toContain('12 PM')
    expect(tip.text()).toContain('22 km/h')
    expect(tip.text()).toContain('from SSW')

    layer.element.dispatchEvent(event('pointerleave', 521, 'touch'))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="status"]').exists()).toBe(true)

    layer.element.dispatchEvent(event('pointerleave', 521, 'mouse'))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })
})
