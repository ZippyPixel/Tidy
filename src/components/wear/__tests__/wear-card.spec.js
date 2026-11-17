import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import WearCard from '@/components/wear/WearCard.vue'
import WearFigure from '@/components/wear/WearFigure.vue'
import { activeI18n } from '@/i18n'
import useWeatherStore from '@/stores/weather'
import useUnitStore from '@/stores/unit'
import useWearStore from '@/stores/wear'

const i18n = activeI18n()

// 2026-07-15 in UTC+6; now is 13:20 there
const OFFSET = 6 * 3600
const DAY0 = Date.UTC(2026, 6, 15) / 1000 - OFFSET
const NOW = (DAY0 + 13 * 3600 + 20 * 60) * 1000
const realNow = Date.now

const hour = (d, h, over) => ({
  time_epoch: DAY0 + d * 86400 + h * 3600,
  time: `2026-07-${15 + d} ${String(h).padStart(2, '0')}:00`,
  temp_c: 14,
  feelslike_c: 13,
  chance_of_rain: 80,
  chance_of_snow: 0,
  precip_mm: 1.4,
  wind_kph: 34,
  gust_kph: 58,
  uv: 1,
  humidity: 86,
  is_day: h >= 6 && h < 18 ? 1 : 0,
  condition: { code: 1189 },
  ...over
})
const forecast = (over = {}) =>
  [0, 1].map((d) => ({
    date: `2026-07-${15 + d}`,
    hour: Array.from({ length: 24 }, (_, h) => hour(d, h, over))
  }))

function setup(state = {}) {
  const pinia = createPinia()
  const store = useWeatherStore(pinia)
  store.$patch({
    awaitingLocation: false,
    forecast: forecast(),
    today: '2026-07-15',
    date: '2026-07-15',
    zoneOffsetMs: OFFSET * 1000,
    location: 'Joar Sahara, Bangladesh',
    ...state
  })
  const wrapper = mount(WearCard, { global: { plugins: [pinia, i18n] } })
  return { wrapper, store, pinia }
}

describe('What to wear card', () => {
  beforeEach(() => {
    Date.now = () => NOW
  })
  afterEach(() => {
    Date.now = realNow
  })

  it('is one link to /wear that reads the window and the headline', () => {
    const { wrapper } = setup()
    const link = wrapper.find('a')
    expect(link.attributes('href')).toBe('/wear')
    expect(wrapper.findAll('a')).toHaveLength(1)
    expect(link.attributes('aria-label')).toBe(
      'What to wear. Rest of today · 1 PM–10 PM. Raincoat day. Open details'
    )
  })

  it('shows the outfit only: kicker, headline, two reasons', () => {
    const { wrapper } = setup()
    expect(wrapper.text()).toContain('Rest of today · 1 PM–10 PM')
    expect(wrapper.find('[data-wear-headline]').text()).toBe('Raincoat day')
    const reasons = wrapper.findAll('[data-wear-reason]').map((r) => r.text())
    expect(reasons).toEqual(['80% chance of rain around 1 PM', 'Feels like 13°'])
  })

  it('has no temperature, condition or place of its own', () => {
    const { wrapper } = setup()
    const text = wrapper.text()
    expect(text).not.toContain('Joar Sahara')
    expect(text).not.toMatch(/\b14°/)
    expect(text).not.toMatch(/Moderate rain|Rain\b/)
  })

  it('shows up to two Take chips', () => {
    const { wrapper } = setup({
      forecast: forecast({
        feelslike_c: 33,
        temp_c: 31,
        chance_of_rain: 0,
        precip_mm: 0,
        wind_kph: 8,
        gust_kph: 10,
        uv: 9,
        condition: { code: 1000 }
      })
    })
    const chips = wrapper.findAll('[data-wear-take]').map((c) => c.text())
    expect(chips).toEqual(['Water', 'Sunscreen'])
  })

  it('follows the unit setting', async () => {
    const { wrapper, pinia } = setup()
    useUnitStore(pinia).setUnit('fahrenheit')
    await flushPromises()
    expect(wrapper.text()).toContain('Feels like 55°')
  })

  it('follows the figure setting', async () => {
    const { wrapper, pinia } = setup({
      forecast: forecast({
        feelslike_c: 28,
        chance_of_rain: 0,
        precip_mm: 0,
        wind_kph: 8,
        gust_kph: 10,
        condition: { code: 1000 }
      })
    })
    expect(wrapper.find('[data-wear-headline]').text()).toBe('Light clothes are enough')
    useWearStore(pinia).set('figure', 'woman')
    await flushPromises()
    const fig = wrapper.findComponent(WearFigure)
    expect(fig.props('figure')).toBe('woman')
    expect(fig.props('outfit')).toMatchObject({ top: 'dress', bottom: null })
  })

  it('shows the shared skeleton while the forecast loads', () => {
    const { wrapper } = setup({ awaitingLocation: true, forecast: [] })
    expect(wrapper.find('a').attributes('aria-busy')).toBe('true')
    expect(wrapper.find('.tidy-skeleton-soft').exists()).toBe(true)
    expect(wrapper.findAll('.tidy-skeleton').length).toBeGreaterThanOrEqual(6)
    expect(wrapper.find('[data-wear-headline]').exists()).toBe(false)
    expect(wrapper.find('a').attributes('aria-label')).toBe('What to wear. Open details')
  })

  it('stands the character on the road, full height', () => {
    const { wrapper } = setup()
    const fig = wrapper.find('[data-wear-figure]')
    expect(fig.classes()).toContain('wear-card-fig')
    expect(fig.find('svg').attributes('aria-hidden')).toBe('true')
  })
})
