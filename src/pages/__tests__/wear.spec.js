import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import WearPage from '@/pages/wear.vue'
import WearFigure from '@/components/wear/WearFigure.vue'
import WearScene from '@/components/wear/WearScene.vue'
import { activeI18n } from '@/i18n'
import useWeatherStore from '@/stores/weather'
import useWearStore from '@/stores/wear'
import { forecast, NOW, weatherState } from '@/components/wear/__tests__/fixtures'

const i18n = activeI18n()
const realNow = Date.now

function setup(state = {}) {
  const pinia = createPinia()
  useWeatherStore(pinia).$patch(weatherState(state))
  const wrapper = mount(WearPage, { global: { plugins: [pinia, i18n] } })
  return { wrapper, pinia }
}

const tabs = (w) => w.findAll('[data-wear-tab]')

describe('What to wear page', () => {
  beforeEach(() => {
    Date.now = () => NOW
  })
  afterEach(() => {
    Date.now = realNow
  })

  it('names the place and the day', () => {
    const { wrapper } = setup()
    expect(wrapper.find('h1').text()).toBe('Joar Sahara')
    expect(wrapper.find('[data-wear-meta]').text()).toBe('Bangladesh · Wed, Jul 15')
  })

  it('opens on Today, with Now and Tomorrow as tabs', () => {
    const { wrapper } = setup()
    const t = tabs(wrapper)
    expect(t.map((x) => x.find('span').text())).toEqual(['Now', 'Today', 'Tomorrow'])
    expect(t[1].attributes('aria-selected')).toBe('true')
    expect(t[0].text()).toContain('Next 3 hours')
    expect(t[1].text()).toContain('1 PM–10 PM')
  })

  it('shows the headline, the outfit sentence and an accessible character', () => {
    const { wrapper } = setup()
    expect(wrapper.find('[data-wear-hero-headline]').text()).toBe('Raincoat day')
    expect(wrapper.find('[data-wear-sentence]').text()).toBe(
      'A raincoat over a sweater with trousers and boots. Hood up.'
    )
    const hero = wrapper.findAllComponents(WearFigure).find((f) => f.props('label'))
    expect(hero.props('label')).toBe(
      'Mannequin wearing raincoat, sweater, trousers, boots, and hood up'
    )
  })

  it('says why the hood is up', () => {
    const { wrapper } = setup()
    const rows = wrapper.findAll('[data-wear-piece]').map((r) => r.text())
    expect(rows).toContain('Hood upKeeps the rain off your head')
  })

  it('a tab changes the window and the light of the street', async () => {
    const { wrapper } = setup()
    await tabs(wrapper)[2].trigger('click')
    expect(tabs(wrapper)[2].attributes('aria-selected')).toBe('true')
    expect(wrapper.text()).toContain('Tomorrow · 6 AM–10 PM')
    // tomorrow's window is the middle of 6–22: day
    expect(wrapper.findComponent(WearScene).props('tod')).toBe('day')
  })

  it('the figure control changes the character for the card too', async () => {
    const { wrapper, pinia } = setup({
      forecast: forecast({
        feelslike_c: 28,
        chance_of_rain: 0,
        precip_mm: 0,
        wind_kph: 8,
        gust_kph: 10
      })
    })
    await wrapper.find('[role="radiogroup"] [role="radio"]:last-of-type').trigger('click')
    await flushPromises()
    expect(useWearStore(pinia).figure).toBe('woman')
    expect(wrapper.find('[data-wear-sentence]').text()).toMatch(/^A light dress and sneakers\./)
  })

  it('shows skeletons until the forecast is in', () => {
    const { wrapper } = setup({ awaitingLocation: true, forecast: [], coords: null })
    expect(wrapper.find('[role="status"]').text()).toBe('Picking an outfit…')
    expect(wrapper.find('h1').exists()).toBe(false)
    expect(wrapper.find('.tidy-skeleton-soft').exists()).toBe(true)
    expect(tabs(wrapper).every((t) => t.attributes('disabled') !== undefined)).toBe(true)
  })

  it('Through the day: three tiles that stand the character on the road', () => {
    const { wrapper } = setup()
    const tiles = wrapper.findAll('[data-wear-part]')
    expect(tiles).toHaveLength(3)
    // 1:20 PM: the morning is over, so afternoon, evening, then tomorrow morning
    expect(tiles.map((t) => t.find('[data-wear-part-caption] span').text())).toEqual([
      'Afternoon · 1 PM–5 PM',
      'Evening · 5 PM–10 PM',
      'Tomorrow morning · 6 AM–12 PM'
    ])
    const tile = tiles[0].classes()
    expect(tile).toEqual(expect.arrayContaining(['h-[148px]', 'sm:h-[300px]']))
    const fig = tiles[0].find('[data-wear-part-figure]').classes()
    expect(fig).toEqual(
      expect.arrayContaining(['absolute', 'bottom-[5px]', 'left-[54px]', 'h-[126px]'])
    )
    expect(fig).toEqual(
      expect.arrayContaining(['sm:bottom-[7px]', 'sm:left-1/2', 'sm:h-[184px]', '-translate-x-1/2'])
    )
    const cap = tiles[0].find('[data-wear-part-caption]').classes()
    expect(cap).toEqual(
      expect.arrayContaining(['wear-glass', 'top-1/2', 'sm:top-2.5', 'left-[108px]'])
    )
  })

  it('a day tile dresses the page for that part of the day', async () => {
    const { wrapper } = setup()
    const tile = wrapper.findAll('[data-wear-part]')[1]
    expect(tile.attributes('aria-pressed')).toBe('false')
    expect(tile.attributes('aria-label')).toBe('Evening · 5 PM–10 PM. Feels like 13°. Raincoat day')
    await tile.trigger('click')
    expect(wrapper.findAll('[data-wear-part]')[1].attributes('aria-pressed')).toBe('true')
    // a part of today keeps the Today tab selected
    expect(tabs(wrapper)[1].attributes('aria-selected')).toBe('true')
    expect(wrapper.text()).toContain('This evening · 5 PM–10 PM')
  })

  it('Why this outfit gives the reasons and the numbers', () => {
    const { wrapper } = setup()
    const why = wrapper.findAll('[data-wear-why]').map((r) => r.text())
    expect(why).toEqual(['80% chance of rain around 1 PM', 'Feels like 13°', 'Wind up to 58 km/h'])
    const stats = wrapper.findAll('[data-wear-stat]').map((s) => s.find('dd').text())
    expect(stats).toEqual(['13°', 'Rain', '80%', '34 km/h', '1', '86%'])
  })

  it('Take with you says when nothing extra is needed', () => {
    const { wrapper } = setup()
    expect(wrapper.text()).toContain('Nothing extra. The outfit covers it.')
  })

  it('settings: feel and coverage change the outfit and are saved', async () => {
    const { wrapper, pinia } = setup({
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
    const wear = useWearStore(pinia)
    await wrapper.find('[data-wear-switch="coverage"]').trigger('click')
    expect(wear.coverage).toBe(true)
    expect(wrapper.find('[data-wear-sentence]').text()).toMatch(/^A long-sleeve top with trousers/)
    // the skirts switch only shows for the woman figure
    expect(wrapper.find('[data-wear-switch="skirts"]').exists()).toBe(false)
    wear.set('figure', 'woman')
    await flushPromises()
    expect(wrapper.find('[data-wear-switch="skirts"]').exists()).toBe(true)
    const colder = wrapper.find('[data-wear-feel] [role="radio"]')
    await colder.trigger('click')
    expect(wear.feel).toBe(-1)
  })

  it('ends with the guidance line for the place', () => {
    const { wrapper } = setup()
    expect(wrapper.text()).toContain('Suggestions come from the hourly forecast for Joar Sahara')
  })

  it('follows a new location from the header search, staying on the page', async () => {
    const { wrapper, pinia } = setup()
    useWeatherStore(pinia).$patch({
      coords: {
        name: 'Dubai',
        country: 'United Arab Emirates',
        lat: 25.2,
        lon: 55.3,
        tzId: 'Asia/Dubai'
      },
      forecast: forecast({
        feelslike_c: 38,
        temp_c: 36,
        chance_of_rain: 0,
        precip_mm: 0,
        wind_kph: 10,
        gust_kph: 14,
        uv: 11,
        condition: { code: 1000 }
      })
    })
    await flushPromises()
    expect(wrapper.find('h1').text()).toBe('Dubai')
    expect(wrapper.find('[data-wear-hero-headline]').text()).toBe('Dress light and stay cool')
  })
})
