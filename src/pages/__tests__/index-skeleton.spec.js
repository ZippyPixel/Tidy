import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import HomeView from '@/pages/index.vue'
import { activeI18n } from '@/i18n'
import useTidesStore from '@/stores/tides'
import useWeatherStore from '@/stores/weather'
import { MIN_SKELETON_MS } from '@/composables/useSkeletonGate'
import fixture from '@/utils/__tests__/fixtures/weatherapi-forecast.json'

const i18n = activeI18n()
const other = () => ({ ...fixture, location: { ...fixture.location, name: 'Sydney', country: 'Australia' } })

let resolveForecast
let wrapper

function mountHome() {
  const pinia = createPinia()
  const weather = useWeatherStore(pinia)
  // the tides card has its own spec; keep it from fetching here
  useTidesStore(pinia).loadNearest = vi.fn()
  wrapper = mount(HomeView, { global: { plugins: [pinia, i18n] }, attachTo: document.body })
  return { weather }
}

// the dashboard's cards, by their real titles (they stay on screen while loading)
const card = (title) => wrapper.findAll('section').find((s) => s.find('h2').exists() && s.find('h2').text() === title)
// weather cards only: the tides card waits on its own request (tides-card.spec)
const skeletons = () => wrapper.findAll('[data-skeleton]').filter((s) => !s.element.closest('a[href="/tides"]'))
const status = () => wrapper.find('[role="status"]').text()

async function land(response = fixture) {
  resolveForecast(response)
  await flushPromises()
}

describe('dashboard skeletons', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
    vi.setSystemTime(fixture.location.localtime_epoch * 1000)
    vi.stubGlobal(
      '$fetch',
      vi.fn(() => new Promise((resolve) => (resolveForecast = resolve)))
    )
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.unstubAllGlobals()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('shows every card as a skeleton on the first frame, titles real, one status', () => {
    mountHome()
    expect(status()).toBe('Loading weather…')
    for (const title of ['Current Conditions', 'Hourly', '3 Days Forecast', 'Sun & Moon', 'Details']) {
      const section = card(title)
      expect(section, title).toBeTruthy()
      expect(section.attributes('aria-busy'), title).toBe('true')
      expect(section.find('[data-skeleton]').exists(), title).toBe(true)
    }
    expect(wrapper.find('h1').exists()).toBe(false)
    expect(skeletons().length).toBeGreaterThan(0)
  })

  it('puts nothing focusable inside a skeleton', () => {
    mountHome()
    const focusable = 'a, button, input, [tabindex]:not([tabindex="-1"])'
    for (const s of skeletons()) expect(s.element.querySelector(focusable)).toBeNull()
    // the hourly strip is not a scroll stop while it is a placeholder
    expect(wrapper.find('[role="region"]').attributes('tabindex')).toBeUndefined()
    // and the Details tiles are not buttons yet
    expect(card('Details').findAll('button')).toHaveLength(0)
  })

  it('shows the content after the minimum, faded in', async () => {
    const { weather } = mountHome()
    const load = weather.getCityWeather('Joar Sahara')
    await land()
    await load
    expect(skeletons().length).toBeGreaterThan(0)
    vi.advanceTimersByTime(MIN_SKELETON_MS)
    await flushPromises()
    expect(skeletons()).toHaveLength(0)
    expect(status()).toBe('')
    expect(wrapper.find('h1').text()).toBe('Joar Sahara, Bangladesh')
    expect(card('Current Conditions').attributes('aria-busy')).toBeUndefined()
    expect(card('Details').findAll('button').length).toBeGreaterThan(0)
    expect(wrapper.find('.tidy-fade-in').exists()).toBe(true)
  })

  it('does not bring the skeleton back for a refresh of the same city', async () => {
    const { weather } = mountHome()
    const first = weather.getCityWeather('Joar Sahara')
    await land()
    await first
    vi.advanceTimersByTime(MIN_SKELETON_MS)
    await flushPromises()

    const refresh = weather.refetchWeather()
    await flushPromises()
    expect(weather.isLoading).toBe(true)
    expect(skeletons()).toHaveLength(0)
    expect(wrapper.find('h1').text()).toBe('Joar Sahara, Bangladesh')
    await land()
    await refresh
    expect(skeletons()).toHaveLength(0)
  })

  it('brings it back when the city changes, until the new city lands', async () => {
    const { weather } = mountHome()
    const first = weather.getCityWeather('Joar Sahara')
    await land()
    await first
    vi.advanceTimersByTime(MIN_SKELETON_MS)
    await flushPromises()

    const next = weather.getCityWeather('Sydney')
    await flushPromises()
    expect(card('Current Conditions').attributes('aria-busy')).toBe('true')
    expect(wrapper.find('h1').exists()).toBe(false)
    await land(other())
    await next
    vi.advanceTimersByTime(MIN_SKELETON_MS)
    await flushPromises()
    expect(wrapper.find('h1').text()).toBe('Sydney, Australia')
  })
})
