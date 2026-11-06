import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import WeatherDetails from '@/components/weather/WeatherDetails.vue'
import { activeI18n } from '@/i18n'
import useUnitStore from '@/stores/unit'
import useWeatherStore from '@/stores/weather'
import fixture from '@/utils/__tests__/fixtures/weatherapi-forecast.json'

const i18n = activeI18n()
const realMatchMedia = window.matchMedia
const INDEX = { humidity: 0, wind: 1, precip: 2, visibility: 3, pressure: 4, uv: 5, airQuality: 6 }

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

async function open(key, { md = true, unit = 'celsius', response = fixture } = {}) {
  setWidth(md)
  const pinia = createPinia()
  useUnitStore(pinia).unit = unit
  await useWeatherStore(pinia).setValues(response)
  wrapper = mount(WeatherDetails, { attachTo: document.body, global: { plugins: [pinia, i18n] } })
  await flushPromises()
  await wrapper.findAll('button')[INDEX[key]].trigger('click')
  await flushPromises()
}

const dialog = () => document.querySelector('[role="dialog"]')
const text = () => dialog()?.textContent.replace(/\s+/g, ' ').trim() ?? ''
const columns = () => [...dialog().querySelectorAll('[data-column]')]
const hero = () => dialog().querySelector('[data-hero]')

describe('condition detail modal', () => {
  beforeEach(() => history.replaceState(null, ''))

  afterEach(() => {
    wrapper?.unmount()
    window.matchMedia = realMatchMedia
    i18n.global.locale.value = 'en'
  })

  describe('shell', () => {
    it('is a 520px dialog from md, titled with the update time', async () => {
      await open('humidity')
      expect(dialog().className).toContain('max-w-[520px]')
      expect(dialog().hasAttribute('data-vaul-drawer')).toBe(false)
      expect(dialog().querySelector('h2').textContent).toBe('Humidity')
      expect(text()).toMatch(/Updated 12:45\sPM/)
    })

    it('is a drawer below md, and back closes it', async () => {
      await open('wind', { md: false })
      expect(dialog().hasAttribute('data-vaul-drawer')).toBe(true)
      expect(history.state?.tidyDetail).toBe(true)
      history.back()
      await new Promise((resolve) => setTimeout(resolve, 20))
      await flushPromises()
      expect(wrapper.vm.selected).toBeNull()
    })

    it('closes on Esc and returns focus to the tile', async () => {
      await open('humidity')
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 20))
      await flushPromises()
      expect(wrapper.vm.selected).toBeNull()
      expect(document.activeElement).toBe(wrapper.findAll('button')[INDEX.humidity].element)
    })

    it('has no close button and takes focus', async () => {
      await open('humidity')
      expect(dialog().querySelector('button')).toBeNull()
      expect(dialog().contains(document.activeElement)).toBe(true)
    })

    it('does not open a tile with no reading', async () => {
      const current = { ...fixture.current, uv: undefined }
      await open('uv', { response: { ...fixture, current } })
      expect(dialog()).toBeNull()
    })
  })

  describe('humidity', () => {
    it('shows the average, comfort and now', async () => {
      await open('humidity')
      expect(hero().textContent).toContain("Today's average")
      expect(hero().textContent.replace(/\s+/g, ' ')).toContain('58%')
      expect(hero().textContent).toContain('Humid')
      expect(hero().textContent).toContain('Now 51% · dew point 19°')
    })

    it('draws 12 pill bars in the humidity colour, Now first', async () => {
      await open('humidity')
      expect(columns()).toHaveLength(12)
      expect(columns()[0].textContent).toContain('Now')
      expect(columns()[0].textContent).toContain('40%')
      expect(columns()[0].querySelector('.bg-chart-humidity').style.height).toBe('40%')
    })

    it('gives dew point guidance in the chosen unit', async () => {
      await open('humidity')
      expect(text()).toContain('below 16° is comfortable, above 21° feels muggy')
      wrapper.unmount()
      await open('humidity', { unit: 'fahrenheit' })
      expect(text()).toContain('below 61° is comfortable, above 70° feels muggy')
      expect(text()).toContain('dew point 67°')
    })
  })

  describe('wind', () => {
    it('shows speed, Beaufort, direction and gusts', async () => {
      await open('wind')
      const hero_ = hero().textContent.replace(/\s+/g, ' ')
      expect(hero_).toContain('11 km/h')
      expect(hero_).toContain('Light breeze')
      expect(hero_).toContain('From NNW · gusts 19 km/h')
      expect(text()).toContain('Strongest today: 15 km/h.')
    })

    it('uses mph in °F without changing the label', async () => {
      await open('wind', { unit: 'fahrenheit' })
      const hero_ = hero().textContent.replace(/\s+/g, ' ')
      expect(hero_).toContain('7 mph')
      expect(hero_).toContain('Light breeze')
    })

    it('rotates the compass needle to where the wind blows', async () => {
      await open('wind')
      expect(dialog().querySelector('[data-needle]').getAttribute('transform')).toBe('rotate(518)')
    })

    it('puts a direction arrow on every column', async () => {
      await open('wind')
      expect(columns()).toHaveLength(12)
      expect(columns()[0].querySelector('[data-arrow]').style.transform).toBe('rotate(520deg)') // 340 + 180
    })
  })

  describe('bar strip layout', () => {
    it('is a 12-column grid from md and scrolls sideways below it', async () => {
      await open('humidity')
      const strip = dialog().querySelector('[data-strip]')
      expect(strip.className).toContain('md:grid-cols-12')
      expect(strip.className).toContain('overflow-x-auto')
      expect(strip.hasAttribute('data-vaul-no-drag')).toBe(true)
    })
  })

  it('renders in Bengali, with Bengali digits', async () => {
    i18n.global.locale.value = 'bn'
    await open('humidity')
    expect(dialog().querySelector('h2').textContent).toBe('আর্দ্রতা')
    expect(text()).toContain('৫৮')
  })
})
