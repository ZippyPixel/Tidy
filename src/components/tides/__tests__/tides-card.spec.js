import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import TidesCard from '@/components/tides/TidesCard.vue'
import { activeI18n } from '@/i18n'
import useTidesStore from '@/stores/tides'
import useUnitStore from '@/stores/unit'
import useWeatherStore from '@/stores/weather'
import sample from '@/utils/__tests__/fixtures/tides-sample.json'

const payload = sample.stations[sample.defaultStation]
const COORDS = { name: 'Joar Sahara', country: 'Bangladesh', lat: 23.817, lon: 90.417, tzId: 'Asia/Dhaka' }

function setup(nearest = {}, { unit = 'celsius', coords = COORDS } = {}) {
  const pinia = createPinia()
  useUnitStore(pinia).unit = unit
  useWeatherStore(pinia).coords = coords
  const store = useTidesStore(pinia)
  store.loadNearest = vi.fn()
  store.nearest = { key: 'x', status: 'ready', fetchedAt: 0, data: payload, ...nearest }
  const wrapper = mount(TidesCard, { global: { plugins: [pinia, activeI18n()] } })
  return { wrapper, store }
}

describe('TidesCard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(sample.now * 1000)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is one link to /tides, with nothing interactive inside', () => {
    const { wrapper } = setup()
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('/tides')
    expect(wrapper.element.querySelectorAll('a, button')).toHaveLength(0)
  })

  it('asks the store for the location’s nearest station', () => {
    const { store } = setup()
    expect(store.loadNearest).toHaveBeenCalledWith(COORDS)
  })

  it('shows the level, trend and next tide for Charchanga', () => {
    const { wrapper } = setup()
    expect(wrapper.find('[data-level]').text()).toBe('2.86 m')
    expect(wrapper.text()).toContain('Falling')
    const next = wrapper.find('[data-next]').text()
    expect(next).toContain('Next low tide')
    expect(next).toMatch(/6:40\sPM/)
    expect(next).toContain('0.77 m · in 5h 39m')
  })

  it('says it all in one label for a screen reader', () => {
    const label = setup().wrapper.attributes('aria-label')
    expect(label).toMatch(/^Tides at Charchanga: falling, 2\.86 metres now\. Next low tide 6:40\sPM\. Open tide times$/)
  })

  it('uses feet with °F', () => {
    const { wrapper } = setup({}, { unit: 'fahrenheit' })
    expect(wrapper.find('[data-level]').text()).toBe('9.4 ft')
    expect(wrapper.find('[data-next]').text()).toContain('2.5 ft')
  })

  it('notes that the location is inland from 50 km', () => {
    const { wrapper } = setup()
    expect(wrapper.find('[data-station-line]').text()).toBe('Charchanga · 189 km')
    expect(wrapper.find('[data-inland]').text()).toBe(
      'Joar Sahara is inland, so these are the tides at Charchanga, the nearest station (189 km away).'
    )
  })

  it('has no note for a station close by', () => {
    const close = { ...payload, station: { ...payload.station, distanceKm: 49 } }
    const { wrapper } = setup({ data: close })
    expect(wrapper.find('[data-inland]').exists()).toBe(false)
    expect(wrapper.find('[data-station-line]').text()).toContain('Charchanga')
  })

  it('offers the globe when nothing is within 300 km', () => {
    const { wrapper } = setup({ data: { station: null } })
    expect(wrapper.text()).toContain('No tide station nearby')
    expect(wrapper.text()).toContain('Explore stations worldwide')
    expect(wrapper.attributes('href')).toBe('/tides')
    expect(wrapper.find('[data-level]').exists()).toBe(false)
  })

  it('draws its skeleton while loading, title and all still real', () => {
    const { wrapper } = setup({ data: null, status: 'loading' })
    expect(wrapper.find('[data-loading]').exists()).toBe(true)
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.find('h2').text()).toBe('Tides')
    expect(wrapper.find('[data-station-line]').exists()).toBe(false)
    expect(wrapper.find('[data-level]').exists()).toBe(false)
  })

  it('shows the skeleton while the forecast for a new city loads', () => {
    const pinia = createPinia()
    const weather = useWeatherStore(pinia)
    weather.$patch({ isLoading: true, pendingQuery: 'Sydney', lastQuery: 'Dhaka', coords: COORDS })
    const store = useTidesStore(pinia)
    store.loadNearest = vi.fn()
    store.nearest = { key: 'x', status: 'ready', fetchedAt: 0, data: payload }
    const wrapper = mount(TidesCard, { global: { plugins: [pinia, activeI18n()] } })
    expect(wrapper.find('[data-loading]').exists()).toBe(true)
  })

  it('shows its content, not the skeleton, once loaded', () => {
    const { wrapper } = setup()
    expect(wrapper.find('[data-loading]').exists()).toBe(false)
    expect(wrapper.attributes('aria-busy')).toBeUndefined()
    expect(wrapper.find('[data-station-line]').text()).toContain('Charchanga')
  })

  it('says so when the request failed', () => {
    const { wrapper } = setup({ data: null, status: 'error' })
    expect(wrapper.text()).toContain("Couldn't load the tides")
    expect(wrapper.find('[data-loading]').exists()).toBe(false)
  })

  it('moves on as the clock does', async () => {
    const { wrapper } = setup()
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000)
    expect(wrapper.find('[data-next]').text()).toContain('in 4h 39m')
  })
})
