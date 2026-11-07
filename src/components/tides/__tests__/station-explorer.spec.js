import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import StationExplorer from '@/components/tides/StationExplorer.vue'
import { activeI18n } from '@/i18n'

const INDEX = {
  count: 3,
  credit: { project: 'Slackwater database (https://example.org)' },
  countries: [
    { name: 'Bangladesh', center: [91, 22], s: [['ticon/c', 'Charchanga', 22.22, 91.05], ['ticon/d', 'Dhaka', 23, 90]] },
    { name: 'Iceland', center: [-21, 64], s: [['ticon/r', 'Reykjavík', 64.15, -21.94]] }
  ]
}
const LAND = { scale: 10, dots: [900, 235] }
const HOME = { name: 'Joar Sahara', country: 'Bangladesh', lat: 23.817, lon: 90.417, tzId: 'Asia/Dhaka' }
const realMatchMedia = window.matchMedia

function setWidth(md) {
  window.matchMedia = (query) => ({
    matches: md && query.includes('min-width: 768px'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false
  })
}

let wrapper
let fetchMock

async function setup({ md = true, ...props } = {}) {
  setWidth(md)
  wrapper = mount(StationExplorer, {
    attachTo: document.body,
    props: { open: true, home: HOME, ...props },
    global: { plugins: [createPinia(), activeI18n()] }
  })
  await flushPromises()
  await wrapper.vm.$nextTick()
  return wrapper
}

const panel = () => document.querySelector('[data-explorer]')
const all = (selector) => [...panel().querySelectorAll(selector)]
const one = (selector) => panel().querySelector(selector)
const type = async (value) => {
  const input = one('[data-search]')
  input.value = value
  input.dispatchEvent(new Event('input'))
  await vi.advanceTimersByTimeAsync(250)
  await flushPromises()
}

describe('StationExplorer', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    HTMLCanvasElement.prototype.getContext = () => null
    fetchMock = vi.fn(async (url, options) => {
      if (url === '/globe-land.json') return LAND
      if (options?.query?.q) return { stations: [{ id: 'ticon/c', name: 'Charchanga', country: 'Bangladesh', lat: 22.22, lon: 91.05 }] }
      if (options?.query?.near) return { stations: [{ id: 'ticon/c', name: 'Charchanga', country: 'Bangladesh', lat: 22.22, lon: 91.05, km: 189 }] }
      return INDEX
    })
    vi.stubGlobal('$fetch', fetchMock)
  })

  afterEach(() => {
    wrapper?.unmount()
    window.matchMedia = realMatchMedia
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('is a labelled dialog, with the count from the index', async () => {
    await setup()
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy()
    expect(one('[data-count]').textContent).toContain('3 stations in 2 countries')
  })

  it('locks the page behind it while open', async () => {
    document.body.style.overflow = ''
    await setup()
    await wrapper.vm.$nextTick()
    expect(document.body.style.overflow).toBe('hidden')
    await wrapper.setProps({ open: false })
    await flushPromises()
    expect(document.body.style.overflow).toBe('')
  })

  it('lists your country first, then all of them', async () => {
    await setup()
    const sections = all('[data-section]')
    expect(sections[0].textContent).toContain('Suggested')
    expect(sections[0].textContent).toContain('Bangladesh')
    expect(sections[1].textContent).toContain('All countries')
    expect(sections[1].textContent).toContain('Iceland')
  })

  it('opens a country to its stations and back', async () => {
    await setup()
    all('[data-row]')[0].click()
    await wrapper.vm.$nextTick()
    expect(all('[data-section]')[0].textContent).toContain('Bangladesh · 2')
    expect(all('[data-row]').map((r) => r.getAttribute('aria-label'))).toEqual(['Charchanga, Bangladesh', 'Dhaka, Bangladesh'])
    one('[data-all-countries]').click()
    await wrapper.vm.$nextTick()
    expect(one('[data-section]').textContent).toContain('Suggested')
  })

  it('searches the server for stations and the index for countries, ignoring accents', async () => {
    await setup()
    await type('ICELÁND')
    expect(fetchMock).toHaveBeenCalledWith('/api/tide-stations', { query: { q: 'ICELÁND' } })
    const text = panel().textContent
    expect(text).toContain('Countries')
    expect(text).toContain('Iceland')
    expect(text).toContain('Stations · 1')
    expect(text).toContain('Charchanga')
  })

  it('waits for a pause in typing', async () => {
    await setup()
    fetchMock.mockClear()
    const input = one('[data-search]')
    for (const value of ['C', 'Ch', 'Chi']) {
      input.value = value
      input.dispatchEvent(new Event('input'))
      await vi.advanceTimersByTimeAsync(50)
    }
    await vi.advanceTimersByTimeAsync(250)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/tide-stations', { query: { q: 'Chi' } })
  })

  it('says when nothing matches', async () => {
    fetchMock.mockImplementation(async (url, options) => {
      if (url === '/globe-land.json') return LAND
      return options?.query?.q ? { stations: [] } : INDEX
    })
    await setup()
    await type('zzz')
    expect(one('[data-message]').textContent).toContain('No station or country matches “zzz”.')
  })

  it('lists the nearest stations by distance from Near me, and clearing the search keeps it', async () => {
    await setup()
    await type('abc')
    one('[data-near]').click()
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(fetchMock).toHaveBeenCalledWith('/api/tide-stations', { query: { near: '23.817,90.417' } })
    expect(one('[data-near]').getAttribute('aria-pressed')).toBe('true')
    expect(one('[data-section]').textContent).toContain('Nearest to Joar Sahara')
    expect(one('[data-row]').textContent).toContain('189 km')
  })

  it('reports it when your position is unavailable', async () => {
    await setup({ home: null })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition: (_ok, fail) => fail(new Error('denied')) }
    })
    one('[data-near]').click()
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(one('[data-message]').textContent).toContain('Unable to retrieve your location')
  })

  it('picks a station from the list, and View tides hands over its id', async () => {
    await setup()
    await type('Char')
    all('[data-row]').at(-1).click()
    await wrapper.vm.$nextTick()
    const popup = one('[data-popup]')
    expect(popup.textContent).toContain('Charchanga')
    expect(popup.textContent).toContain('Bangladesh · 189 km from Joar Sahara')
    one('[data-view-tides]').click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('pick')[0]).toEqual(['ticon/c'])
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('groups long distances', async () => {
    await setup()
    await type('Reyk')
    wrapper.vm.chooseStation({ id: 'ticon/r', name: 'Reykjavík', country: 'Iceland', lat: 64.15, lon: -21.94 })
    await wrapper.vm.$nextTick()
    expect(one('[data-popup]').textContent).toContain('Iceland · 8,649 km from Joar Sahara')
  })

  it('closes on Esc', async () => {
    await setup()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('closes from the close button', async () => {
    await setup()
    one('[data-close]').click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('credits the database, not the design’s text', async () => {
    await setup()
    expect(panel().textContent).toContain('Stations: Slackwater database')
    expect(panel().textContent).not.toMatch(/neaps/i)
  })

  it('says so if the stations cannot load', async () => {
    fetchMock.mockRejectedValue(new Error('network'))
    await setup()
    expect(one('[data-message]').textContent).toContain("Couldn't load the stations")
  })

  it('downloads the data once, however often it opens', async () => {
    await setup()
    const first = fetchMock.mock.calls.length
    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })
    await flushPromises()
    expect(fetchMock.mock.calls.length).toBe(first)
  })

  describe('back navigation on a phone', () => {
    let length

    beforeEach(() => {
      length = history.length
    })

    it('adds a history entry when it opens, and back closes it', async () => {
      await setup({ md: false })
      expect(history.length).toBe(length + 1)
      expect(history.state.tidyExplorer).toBe(true)
      window.dispatchEvent(new PopStateEvent('popstate'))
      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('takes that entry back off when closed another way', async () => {
      const back = vi.spyOn(history, 'back').mockImplementation(() => {})
      await setup({ md: false })
      one('[data-close]').click()
      expect(back).toHaveBeenCalledTimes(1)
      // popstate finishes the close
      expect(wrapper.emitted('close')).toBeUndefined()
      window.dispatchEvent(new PopStateEvent('popstate'))
      expect(wrapper.emitted('close')).toHaveLength(1)
      back.mockRestore()
    })

    it('leaves history alone on desktop, even when mounted already open', async () => {
      await setup({ md: true })
      expect(history.length).toBe(length)
    })
  })
})
