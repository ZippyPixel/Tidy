import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { reactive } from 'vue'
import TidesPage from '@/pages/tides.vue'
import { activeI18n } from '@/i18n'
import useTidesStore from '@/stores/tides'
import useUnitStore from '@/stores/unit'
import useWeatherStore from '@/stores/weather'
import sample from '@/utils/__tests__/fixtures/tides-sample.json'

const payload = sample.stations[sample.defaultStation]
const SF = sample.stations['ticon/sanfrancisco_fort_point-9414920-usa-da_sat']
const COORDS = { name: 'Joar Sahara', country: 'Bangladesh', lat: 23.817, lon: 90.417, tzId: 'Asia/Dhaka' }
const ready = (data) => ({ key: 'x', status: 'ready', fetchedAt: 0, data })

function setup({ query = {}, nearest = ready(payload), chosen, coords = COORDS, unit = 'celsius', awaitingLocation = false } = {}) {
  const pinia = createPinia()
  useUnitStore(pinia).unit = unit
  const weather = useWeatherStore(pinia)
  weather.coords = coords
  // the location probe has settled unless a test says otherwise
  weather.awaitingLocation = awaitingLocation
  const store = useTidesStore(pinia)
  store.loadNearest = vi.fn()
  store.loadStation = vi.fn()
  store.nearest = nearest
  if (chosen) store.chosen = chosen
  const route = reactive({ query })
  const router = {
    replace: vi.fn(async (to) => {
      route.query = to.query
    })
  }
  const wrapper = mount(TidesPage, {
    global: {
      plugins: [pinia, activeI18n()],
      mocks: { $route: route, $router: router },
      stubs: { StationExplorer: { name: 'StationExplorer', props: ['open'], emits: ['pick', 'close'], template: '<div data-explorer />' } }
    }
  })
  return { wrapper, store, route, router }
}

describe('Tides page', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(sample.now * 1000)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('heads the page with the nearest station', () => {
    const { wrapper, store } = setup()
    expect(wrapper.find('h1').text()).toBe('Charchanga')
    expect(wrapper.find('[data-meta]').text()).toBe('Bangladesh · Khulna Division')
    expect(wrapper.find('[data-distance]').text()).toBe('189 km from Joar Sahara · Times in Asia/Dhaka (UTC+6)')
    expect(store.loadNearest).toHaveBeenCalledWith(COORDS)
    expect(store.loadStation).not.toHaveBeenCalled()
  })

  it('shows every section, with nothing left of the prototype', () => {
    const text = setup().wrapper.text()
    for (const title of ['Right now', 'Tide chart', "Today's tides", 'Moon & tides', 'Next 7 days', 'About this station', 'Nearby stations']) {
      expect(text).toContain(title)
    }
    expect(text).not.toMatch(/prototype/i)
    expect(text).not.toMatch(/neaps/i)
  })

  it('reads Right now against the fixture', () => {
    const { wrapper } = setup()
    expect(wrapper.find('[data-level]').text()).toBe('2.86 m')
    const next = wrapper.find('[data-next]').text()
    expect(next).toContain('Next low tide')
    expect(next).toMatch(/0\.77 m · in 5h 39m · then high at 12:43\sAM/)
  })

  it('names the spring and neap days', () => {
    const { wrapper } = setup()
    expect(wrapper.find('[data-spring]').text()).toMatch(/^Tue, Nov 10 · range up to/)
    expect(wrapper.find('[data-neap]').text()).toMatch(/^Thu, Nov 19 · range only/)
  })

  it('switches to feet with °F, in the chart note too', () => {
    const { wrapper } = setup({ unit: 'fahrenheit' })
    expect(wrapper.find('[data-level]').text()).toBe('9.4 ft')
    expect(wrapper.find('[data-note]').text()).toBe('Heights in feet above lowest astronomical tide (LAT)')
  })

  it('steps days from yesterday to six ahead, and no further', async () => {
    const { wrapper } = setup()
    expect(wrapper.find('[data-range-title]').text()).toBe('Friday, November 6')
    expect(wrapper.find('[data-range-tag]').text()).toBe('Today')

    await wrapper.find('[data-previous]').trigger('click')
    expect(wrapper.find('[data-range-tag]').text()).toBe('Yesterday')
    expect(wrapper.find('[data-previous]').attributes('disabled')).toBeDefined()

    for (let i = 0; i < 7; i++) await wrapper.find('[data-next-day]').trigger('click')
    expect(wrapper.find('[data-range-title]').text()).toBe('Thursday, November 12')
    expect(wrapper.find('[data-next-day]').attributes('disabled')).toBeDefined()
  })

  it('titles the list for the day the chart is on', async () => {
    const { wrapper } = setup()
    await wrapper.find('[data-next-day]').trigger('click')
    expect(wrapper.text()).toContain('Tides on Saturday')
  })

  it('shows the week’s range in Week view, without day arrows', async () => {
    const { wrapper } = setup()
    await wrapper.findAll('[role="tab"]')[1].trigger('click')
    expect(wrapper.find('[data-range-title]').text()).toBe('Nov 6 – 12')
    expect(wrapper.find('[data-range-tag]').text()).toBe('Next 7 days')
    expect(wrapper.find('[data-previous]').exists()).toBe(false)
  })

  it('credits the source and the licence from the database, not the design’s text', () => {
    const { wrapper } = setup()
    expect(wrapper.find('[data-credit]').text()).toContain(payload.credit.project)
    expect(wrapper.find('[data-credit]').text()).toContain('TICON-4')
    expect(wrapper.find('[data-attribution]').text()).toBe(payload.credit.attribution)
    expect(wrapper.find('[data-attribution] a').attributes('rel')).toContain('noopener')
  })

  describe('a station in the link', () => {
    it('loads it by id and shows it, working out the distance itself', () => {
      const { wrapper, store } = setup({ query: { station: SF.station.id }, chosen: ready(SF) })
      expect(store.loadStation).toHaveBeenCalledWith(SF.station.id)
      expect(wrapper.find('h1').text()).toBe('San Francisco Fort Point')
      expect(wrapper.find('[data-distance]').text()).toMatch(/^12,350 km from Joar Sahara · Times in America\/Los Angeles \(UTC−8\)$/)
    })

    it('still works with no forecast location', () => {
      const { wrapper } = setup({ query: { station: SF.station.id }, chosen: ready({ ...SF, station: { ...SF.station, distanceKm: null } }), coords: null })
      expect(wrapper.find('[data-distance]').text()).toBe('Times in America/Los Angeles (UTC−8)')
    })

    it('says "local time" for a station in another zone', () => {
      const { wrapper } = setup({ query: { station: SF.station.id }, chosen: ready(SF) })
      expect(wrapper.find('[data-now-line]').text()).toContain('local time')
    })

    it('goes back to the nearest station from one that does not exist', async () => {
      const { wrapper, router, route } = setup({
        query: { station: 'nope' },
        chosen: { key: 'nope', status: 'notFound', fetchedAt: 0, data: null }
      })
      expect(wrapper.text()).toContain("We can't find that station")
      const back = wrapper.find('[data-back-home]')
      expect(back.text()).toBe('Back to Charchanga')
      await back.trigger('click')
      expect(router.replace).toHaveBeenCalledWith({ query: {} })
      expect(route.query).toEqual({})
    })
  })

  it('offers the globe when nothing is within 300 km', async () => {
    const { wrapper } = setup({ nearest: ready({ station: null, credit: payload.credit }) })
    expect(wrapper.text()).toContain('No tide station nearby')
    expect(wrapper.find('[data-credit]').exists()).toBe(true)
    await wrapper.find('[data-empty-explore]').trigger('click')
    expect(wrapper.find('[data-explorer]').exists()).toBe(true)
  })

  it('lets someone pick a station before the weather knows where they are', () => {
    const { wrapper } = setup({ coords: null, nearest: { key: null, status: 'idle', fetchedAt: 0, data: null } })
    expect(wrapper.text()).toContain('Find a tide station')
    expect(wrapper.find('[data-empty-explore]').exists()).toBe(true)
  })

  it('shows one skeleton per section while waiting, with the page chrome real', () => {
    const { wrapper } = setup({ nearest: { key: 'x', status: 'loading', fetchedAt: 0, data: null } })
    const grid = wrapper.find('[data-loading]')
    expect(grid.exists()).toBe(true)
    const titles = grid.findAll('section h2').map((h) => h.text())
    expect(titles).toEqual(['Right now', 'Tide chart', "Today's tides", 'Next 7 days', 'Moon & tides', 'About this station', 'Nearby stations'])
    expect(grid.findAll('section').every((s) => s.attributes('aria-busy') === 'true')).toBe(true)
    // real: the back link, the kicker, the legend; waiting: Change station, at 50%
    expect(wrapper.find('a[href="/"]').text()).toContain('Weather')
    expect(grid.text()).toContain('High')
    const change = wrapper.find('[data-change]')
    expect(change.attributes('disabled')).toBeDefined()
    expect(change.classes()).toContain('disabled:opacity-50')
    expect(wrapper.find('h1').exists()).toBe(false)
    expect(wrapper.find('[role="status"]').text()).toBe('Loading tides…')
    // nothing in a skeleton takes focus
    const focusable = 'a, input, [tabindex]:not([tabindex="-1"]), button:not([disabled])'
    for (const s of wrapper.findAll('[data-skeleton]')) expect(s.element.querySelector(focusable)).toBeNull()
    expect(grid.element.querySelector('button:not([disabled]):not([inert] *)')).toBeNull()
  })

  it('waits for the forecast location before it can look up the nearest station', () => {
    const { wrapper } = setup({ coords: null, awaitingLocation: true, nearest: { key: null, status: 'idle', fetchedAt: 0, data: null } })
    expect(wrapper.find('[data-loading]').exists()).toBe(true)
    expect(wrapper.find('[data-empty]').exists()).toBe(false)
  })

  it('swaps the skeleton for the sections after the minimum, faded in', async () => {
    const { wrapper, store } = setup({ nearest: { key: 'x', status: 'loading', fetchedAt: 0, data: null } })
    store.nearest = ready(payload)
    await vi.advanceTimersByTimeAsync(299)
    expect(wrapper.find('[data-loading]').exists()).toBe(true)
    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.find('[data-loading]').exists()).toBe(false)
    expect(wrapper.find('h1').text()).toBe('Charchanga')
    expect(wrapper.find('.tidy-fade-in').exists()).toBe(true)
    expect(wrapper.find('[data-change]').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[role="status"]').text()).toBe('')
  })

  it('keeps the station on screen while the same one refreshes', async () => {
    const { wrapper, store } = setup()
    store.nearest = { ...store.nearest, status: 'loading' }
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-loading]').exists()).toBe(false)
    expect(wrapper.find('h1').text()).toBe('Charchanga')
  })

  it('can retry a failed request', async () => {
    const { wrapper, store } = setup({ nearest: { key: 'x', status: 'error', fetchedAt: 0, data: null } })
    store.loadNearest.mockClear()
    await wrapper.find('[data-retry]').trigger('click')
    expect(store.nearest.key).toBeNull()
    expect(store.loadNearest).toHaveBeenCalledWith(COORDS)
  })

  it('moves to a nearby station through the URL, back at today', async () => {
    const { wrapper, router, store } = setup()
    await wrapper.find('[data-next-day]').trigger('click')
    await wrapper.find('[data-nearby]').trigger('click')
    expect(router.replace).toHaveBeenCalledWith({ query: { station: payload.station.nearby[0].id } })
    await wrapper.vm.$nextTick()
    expect(store.loadStation).toHaveBeenCalledWith(payload.station.nearby[0].id)
    expect(wrapper.vm.day).toBe(0)
  })

  it('only changes the URL once the explorer has finished closing', async () => {
    const { wrapper, router } = setup()
    await wrapper.find('[data-change]').trigger('click')
    const explorer = wrapper.findComponent({ name: 'StationExplorer' })
    expect(explorer.props('open')).toBe(true)

    explorer.vm.$emit('pick', 'ticon/x')
    await wrapper.vm.$nextTick()
    expect(router.replace).not.toHaveBeenCalled()

    explorer.vm.$emit('close')
    await wrapper.vm.$nextTick()
    expect(explorer.props('open')).toBe(false)
    expect(router.replace).toHaveBeenCalledWith({ query: { station: 'ticon/x' } })
  })

  it('keeps the station when the explorer is closed without a pick', async () => {
    const { wrapper, router } = setup()
    await wrapper.find('[data-change]').trigger('click')
    wrapper.findComponent({ name: 'StationExplorer' }).vm.$emit('close')
    await wrapper.vm.$nextTick()
    expect(router.replace).not.toHaveBeenCalled()
  })
})
