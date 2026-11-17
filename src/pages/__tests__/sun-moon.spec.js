import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { reactive } from 'vue'
import SunMoonPage from '@/pages/sun-moon.vue'
import { activeI18n } from '@/i18n'
import { MIN_SKELETON_MS } from '@/composables/useSkeletonGate'
import useWeatherStore from '@/stores/weather'

const COORDS = {
  name: 'Joar Sahara',
  country: 'Bangladesh',
  lat: 23.817,
  lon: 90.417,
  tzId: 'Asia/Dhaka'
}
const NOW = Date.UTC(2026, 10, 16, 9, 48) // 3:48 PM in Dhaka
const TROMSO = { lat: '69.65', lon: '18.96', name: 'Troms', country: 'Norway', tz: 'Europe/Oslo' }

let wrapper
async function setup({ query = {}, coords = COORDS } = {}) {
  const pinia = createPinia()
  const weather = useWeatherStore(pinia)
  weather.coords = coords
  weather.awaitingLocation = false
  const route = reactive({ query })
  const router = {
    replace: vi.fn(async (to) => {
      route.query = to.query
    })
  }
  wrapper = mount(SunMoonPage, {
    global: {
      plugins: [pinia, activeI18n()],
      mocks: { $route: route, $router: router },
      stubs: {
        StationExplorer: {
          name: 'StationExplorer',
          props: ['open', 'kind'],
          emits: ['pick', 'close'],
          template: '<div data-explorer />'
        }
      }
    }
  })
  return { route, router }
}
const ready = async () => {
  await vi.dynamicImportSettled()
  await flushPromises()
  await vi.advanceTimersByTimeAsync(MIN_SKELETON_MS + 50)
  await flushPromises()
}

describe('Sun & Moon page', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date']
    })
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('shows the skeleton until astronomy-engine has loaded', async () => {
    await setup()
    expect(wrapper.find('[data-loading]').exists()).toBe(true)
    expect(wrapper.find('[role="status"]').text()).toBe('Working out the sky…')
    await ready()
    expect(wrapper.find('[data-loading]').exists()).toBe(false)
    expect(wrapper.find('[data-time-bar]').exists()).toBe(true)
  })

  it('starts live at the forecast location', async () => {
    await setup()
    await ready()
    expect(wrapper.find('h1').text()).toBe('Joar Sahara')
    expect(wrapper.find('[data-summary]').text()).toBe(
      'Monday, November 16, 3:48 PM · Sun up, sets 5:12 PM (in 1h 24m) · Waxing crescent'
    )
    expect(wrapper.find('[data-live]').classes()).not.toContain('invisible')
    expect(wrapper.find('[data-back-to-now]').classes()).toContain('invisible')
  })

  it('follows the clock every 30 seconds while live', async () => {
    await setup()
    await ready()
    await vi.advanceTimersByTimeAsync(12 * 60000)
    expect(wrapper.find('[data-summary]').text()).toContain('4:00 PM')
  })

  it('reads the instant and place from the URL', async () => {
    await setup({ query: { t: '2026-12-03T12:00', ...TROMSO } })
    await ready()
    expect(wrapper.find('h1').text()).toBe('Troms')
    expect(wrapper.find('[data-summary]').text()).toContain(
      'Thursday, December 3, 12:00 PM · Sun down, stays below the horizon'
    )
    expect(wrapper.find('[data-back-to-now]').classes()).not.toContain('invisible')
    expect(wrapper.find('[data-live]').classes()).toContain('invisible')
    expect(wrapper.find('[data-home]').exists()).toBe(true)
  })

  it('writes a chosen instant to the URL and goes back to live', async () => {
    const { route } = await setup()
    await ready()
    await wrapper.find('[data-next-day]').trigger('click')
    await flushPromises()
    expect(route.query).toEqual({ t: '2026-11-17T15:48' })
    expect(wrapper.find('[data-date-tag]').text()).toBe('Tomorrow')
    await wrapper.find('[data-back-to-now]').trigger('click')
    await flushPromises()
    expect(route.query).toEqual({})
  })

  it('changes place after the finder closes, keeping the clock time, and comes back home', async () => {
    const { route } = await setup({ query: { t: '2026-11-16T21:00' } })
    await ready()
    await wrapper.find('[data-place]').trigger('click')
    const finder = wrapper.findComponent({ name: 'StationExplorer' })
    expect(finder.props('kind')).toBe('places')
    finder.vm.$emit('pick', {
      name: 'Troms',
      country: 'Norway',
      lat: 69.65,
      lon: 18.96,
      tz: 'Europe/Oslo'
    })
    expect(route.query).toEqual({ t: '2026-11-16T21:00' })
    finder.vm.$emit('close')
    await flushPromises()
    expect(route.query).toEqual({ t: '2026-11-16T21:00', ...TROMSO })
    expect(wrapper.find('[data-hour]').element.value).toBe('09')
    await wrapper.find('[data-home]').trigger('click')
    await flushPromises()
    expect(route.query).toEqual({ t: '2026-11-16T21:00' })
    // the weather location is untouched
    expect(useWeatherStore().coords).toEqual(COORDS)
  })

  it('asks for a place when there is no forecast location', async () => {
    await setup({ coords: null })
    await ready()
    expect(wrapper.find('[data-no-place]').exists()).toBe(true)
  })
})
