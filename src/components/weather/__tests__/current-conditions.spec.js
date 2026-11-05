import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import BasicWeatherInfo from '@/components/weather/BasicWeatherInfo.vue'
import WeatherDetails from '@/components/weather/WeatherDetails.vue'
import { activeI18n } from '@/i18n'
import useWeatherStore from '@/stores/weather'
import useUnitStore from '@/stores/unit'

const i18n = activeI18n()

function setup(component, props = {}, state = {}) {
  const pinia = createPinia()
  const store = useWeatherStore(pinia)
  store.$patch({
    condition: 'Patchy rain nearby',
    conditionCode: 1063,
    isDay: 1,
    chanceOfRain: '49%',
    date: '2026-07-15',
    today: '2026-07-15',
    rawTemperature: {
      avgTemp_c: 29,
      avgTemp_f: 84.2,
      feelsLike_c: 33.6,
      feelsLike_f: 92.5,
      maxTemp_c: 31,
      maxTemp_f: 87.8,
      minTemp_c: 26,
      minTemp_f: 78.8
    },
    basicWeatherInfo: { humidity: 69, visibility: 10, pressure: 1000, uv: 'moderate', airQuality: 'good' },
    ...state
  })
  const wrapper = mount(component, { props, global: { plugins: [pinia, i18n] } })
  return { wrapper, store, unit: useUnitStore(pinia) }
}

describe('BasicWeatherInfo', () => {
  it('shows the reading, condition, feels-like, rain and range', () => {
    const { wrapper } = setup(BasicWeatherInfo)
    const text = wrapper.text()
    expect(wrapper.find('h2').text()).toBe('Current Conditions')
    expect(text).toContain('29°')
    expect(text).toContain('Patchy rain nearby')
    expect(text).toContain('Feels like 34°')
    expect(text).toContain('49%')
    expect(text).toContain('26°')
    expect(text).toContain('31°')
    expect(wrapper.find('img').attributes('alt')).toBe('Patchy rain nearby')
  })

  it('follows the unit', async () => {
    const { wrapper, unit } = setup(BasicWeatherInfo)
    unit.setUnit('fahrenheit')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('85°')
    expect(wrapper.text()).toContain('Feels like 93°')
  })

  it('places the now dot between low and high for today only', async () => {
    const { wrapper, store } = setup(BasicWeatherInfo)
    // (29 - 26) / (31 - 26) = 60%
    expect(wrapper.find('.bg-card.rounded-full').attributes('style')).toContain('left: 60%')
    store.date = '2026-07-16'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.bg-card.rounded-full').exists()).toBe(false)
  })

  it('carries the md+ details row, hidden on phones', () => {
    const { wrapper } = setup(BasicWeatherInfo)
    const row = wrapper.findComponent(WeatherDetails)
    expect(row.props('variant')).toBe('row')
    expect(row.classes()).toEqual(expect.arrayContaining(['hidden', 'md:grid', 'grid-cols-5']))
  })
})

describe('WeatherDetails', () => {
  it('lists the five readings with units', () => {
    const { wrapper } = setup(WeatherDetails, { variant: 'tiles' })
    const cells = wrapper.findAll('[title]')
    expect(cells.map((c) => c.find('span').text())).toEqual([
      'Humidity',
      'Visibility',
      'Pressure',
      'UV',
      'Air Quality'
    ])
    expect(cells[0].text()).toContain('69%')
    expect(cells[1].text()).toContain('10 km')
    expect(cells[2].text()).toContain('1000 hPa')
    expect(cells[3].text()).toContain('Moderate')
    expect(cells[4].text()).toContain('Good')
  })

  it('spans Air Quality over two phone columns', () => {
    const { wrapper } = setup(WeatherDetails, { variant: 'tiles' })
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['grid-cols-2', 'sm:grid-cols-5']))
    expect(wrapper.findAll('[title]')[4].classes()).toContain('col-span-2')
  })

  it('dims a missing UV reading and explains it', () => {
    const { wrapper } = setup(WeatherDetails, { variant: 'row' }, {
      basicWeatherInfo: { humidity: 69, visibility: 10, pressure: 1000, uv: 'unknown', airQuality: 'good' }
    })
    const uv = wrapper.findAll('[title]')[3]
    expect(uv.attributes('title')).toBe('UV index not available')
    expect(uv.text()).toContain('—')
    expect(uv.findAll('span')[1].classes()).toContain('text-muted-foreground')
  })

  it('renders Bengali digits in bn', async () => {
    const { wrapper } = setup(WeatherDetails, { variant: 'row' })
    i18n.global.locale.value = 'bn'
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('৬৯%')
    i18n.global.locale.value = 'en'
  })
})
