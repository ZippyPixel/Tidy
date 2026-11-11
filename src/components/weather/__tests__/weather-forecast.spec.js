import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import WeatherForecast from '@/components/weather/WeatherForecast.vue'
import { activeI18n } from '@/i18n'
import useWeatherStore from '@/stores/weather'
import useUnitStore from '@/stores/unit'

const i18n = activeI18n()

const day = (date, lo, hi, rain) => ({
  date,
  day: {
    mintemp_c: lo,
    maxtemp_c: hi,
    mintemp_f: lo * 1.8 + 32,
    maxtemp_f: hi * 1.8 + 32,
    daily_chance_of_rain: rain,
    condition: { text: 'Sunny', code: 1000 }
  },
  astro: {}
})

function setup() {
  const pinia = createPinia()
  const store = useWeatherStore(pinia)
  store.$patch({
    awaitingLocation: false,
    today: '2026-09-25',
    rawTemperature: { avgTemp_c: 27 },
    forecast: [day('2026-09-25', 25, 32, 87), day('2026-09-26', 26, 35, 57), day('2026-09-27', 27, 34, 22)]
  })
  const wrapper = mount(WeatherForecast, { global: { plugins: [pinia, i18n] } })
  return { wrapper, store, unit: useUnitStore(pinia) }
}

const rows = (wrapper) => wrapper.findAll('button[aria-pressed]')

describe('WeatherForecast', () => {
  it('titles the card with the day count and lists one row per day', () => {
    const { wrapper } = setup()
    expect(wrapper.find('h2').text()).toBe('3 Days Forecast')
    expect(rows(wrapper)).toHaveLength(3)
    const first = rows(wrapper)[0].text()
    expect(first).toContain('Friday')
    expect(first).toContain('Fri')
    expect(first).toContain('Sep 25')
    expect(first).toContain('87%')
    expect(first).toContain('25°')
    expect(first).toContain('32°')
  })

  it('draws every range bar on one shared scale', () => {
    const { wrapper } = setup()
    // scale 25..35: day 2 runs 26..35 -> 10%..100%
    const seg = rows(wrapper)[1].find('.bg-primary')
    expect(seg.attributes('style')).toContain('left: 10%')
    expect(seg.attributes('style')).toContain('right: 0%')
  })

  it('marks the current reading on today only', () => {
    const { wrapper } = setup()
    const dots = wrapper.findAll('.border-primary.bg-card')
    expect(dots).toHaveLength(1)
    expect(dots[0].attributes('style')).toContain('left: 20%')
  })

  it('highlights today until another day is picked', async () => {
    const { wrapper, store } = setup()
    expect(rows(wrapper).map((r) => r.attributes('aria-pressed'))).toEqual(['true', 'false', 'false'])
    await rows(wrapper)[2].trigger('click')
    expect(store.selectedForecastDate.date).toBe('2026-09-27')
    expect(rows(wrapper).map((r) => r.attributes('aria-pressed'))).toEqual(['false', 'false', 'true'])
    expect(rows(wrapper)[2].classes()).toContain('bg-accent')
  })

  it('follows the unit', async () => {
    const { wrapper, unit } = setup()
    unit.setUnit('fahrenheit')
    await wrapper.vm.$nextTick()
    expect(rows(wrapper)[0].text()).toContain('77°')
    expect(rows(wrapper)[0].text()).toContain('90°')
  })
})
