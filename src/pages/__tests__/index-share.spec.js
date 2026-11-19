import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import HomeView from '@/pages/index.vue'
import { activeI18n } from '@/i18n'
import useTidesStore from '@/stores/tides'
import useWeatherStore from '@/stores/weather'
import fixture from '@/utils/__tests__/fixtures/weatherapi-forecast.json'

const i18n = activeI18n()
const SHARE = {
  lat: '23.82',
  lon: '90.42',
  name: 'Joar Sahara',
  country: 'Bangladesh',
  tz: 'Asia/Dhaka',
  d: '2026-11-07',
  from: 'share',
  m: 'beach'
}

let wrapper

function mountHome(query) {
  const pinia = createPinia()
  const weather = useWeatherStore(pinia)
  useTidesStore(pinia).loadNearest = vi.fn()
  const router = { replace: vi.fn(async () => {}) }
  wrapper = mount(HomeView, {
    global: { plugins: [pinia, i18n], mocks: { $route: { path: '/', query }, $router: router } },
    attachTo: document.body
  })
  return { weather, router }
}

beforeEach(() => {
  globalThis.$fetch = vi.fn(async () => fixture)
})

afterEach(() => {
  wrapper?.unmount()
  document.body.innerHTML = ''
})

describe('dashboard opened from a share link', () => {
  it('loads the shared place and day and says where you are', async () => {
    const { weather } = mountHome(SHARE)
    await flushPromises()
    expect(globalThis.$fetch).toHaveBeenCalledWith(
      '/api/forecast',
      expect.objectContaining({ query: expect.objectContaining({ q: '23.82,90.42' }) })
    )
    expect(weather.selectedForecastDate?.date).toBe('2026-11-07')
    const banner = wrapper.find('[data-share-banner]')
    expect(banner.text()).toContain('From a shared TIDY card')
    expect(banner.text()).toContain("You're looking at Joar Sahara on Sat, Nov 7.")
  })

  it('names the region for a link without a name', async () => {
    const { name, ...region } = SHARE
    expect(name).toBeTruthy()
    mountHome(region)
    await flushPromises()
    expect(wrapper.find('[data-share-banner]').text()).toContain('Bangladesh')
  })

  it('X only hides the banner', async () => {
    const { router } = mountHome(SHARE)
    await flushPromises()
    await wrapper.find('[data-share-dismiss]').trigger('click')
    expect(wrapper.find('[data-share-banner]').exists()).toBe(false)
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('"Show my weather" drops the link and finds you', async () => {
    const { weather, router } = mountHome({ ...SHARE, keep: '1' })
    await flushPromises()
    weather.detectUserLocation = vi.fn(async () => {})
    await wrapper.find('[data-share-mine]').trigger('click')
    await flushPromises()
    expect(router.replace).toHaveBeenCalledWith({ query: { keep: '1' } })
    expect(weather.detectUserLocation).toHaveBeenCalled()
    expect(wrapper.find('[data-share-banner]').exists()).toBe(false)
  })

  it('shows no banner on a plain visit', async () => {
    mountHome({})
    await flushPromises()
    expect(wrapper.find('[data-share-banner]').exists()).toBe(false)
    expect(globalThis.$fetch).not.toHaveBeenCalledWith('/api/forecast', expect.anything())
  })
})
