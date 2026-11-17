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
})
