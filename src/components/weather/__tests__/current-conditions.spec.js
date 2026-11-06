import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import BasicWeatherInfo from '@/components/weather/BasicWeatherInfo.vue'
import WeatherDetails from '@/components/weather/WeatherDetails.vue'
import { activeI18n } from '@/i18n'
import useWeatherStore from '@/stores/weather'
import useUnitStore from '@/stores/unit'
import fixture from '@/utils/__tests__/fixtures/weatherapi-forecast.json'

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
    current: fixture.current,
    forecast: fixture.forecast.forecastday,
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
    expect(wrapper.text()).toContain('84°') // 84.2 rounds down
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
    expect(row.classes()).toEqual(expect.arrayContaining(['hidden', 'md:grid', 'md:grid-cols-[repeat(6,minmax(0,1fr))_minmax(96px,1fr)]', 'lg:grid-cols-4', 'xl:grid-cols-7']))
  })
})

describe('WeatherDetails', () => {
  const tiles = (wrapper) => wrapper.findAll('button')
  const withReading = (patch) => ({ current: { ...fixture.current, ...patch } })

  it('lists the seven readings in order, with units', () => {
    const { wrapper } = setup(WeatherDetails, { variant: 'tiles' })
    expect(tiles(wrapper).map((tile) => tile.find('span').text())).toEqual([
      'Humidity',
      'Wind',
      'Precipitation',
      'Visibility',
      'Pressure',
      'UV',
      'Air Quality'
    ])
    const values = tiles(wrapper).map((tile) => tile.findAll('span')[1].text().replace(/\s+/g, ' '))
    expect(values).toEqual(['51%', '11 km/h', '0 mm', '10 km', '1014 hPa', '7', 'Moderate'])
  })

  it('uses miles, mph, inches and inHg in °F', async () => {
    const { wrapper, unit } = setup(WeatherDetails, { variant: 'tiles' })
    unit.setUnit('fahrenheit')
    await wrapper.vm.$nextTick()
    const values = tiles(wrapper).map((tile) => tile.findAll('span')[1].text().replace(/\s+/g, ' '))
    expect(values.slice(1, 5)).toEqual(['7 mph', '0 in', '6 mi', '29.94 inHg'])
  })

  it('points the wind arrow where the wind blows to, in the wind colour', () => {
    const { wrapper } = setup(WeatherDetails)
    const arrow = tiles(wrapper)[1].find('svg')
    expect(arrow.attributes('style')).toContain('rotate(518deg)') // 338 + 180
    expect(arrow.classes()).toContain('text-chart-wind')
  })

  it('marks air quality with a dot in its category colour', () => {
    const { wrapper } = setup(WeatherDetails)
    const dot = tiles(wrapper)[6].find('[aria-hidden="true"]')
    expect(dot.attributes('style')).toContain('background')
    expect(tiles(wrapper)[0].find('[aria-hidden="true"]').exists()).toBe(false)
  })

  it('shows EPA 3 under its own short name', () => {
    const { wrapper } = setup(WeatherDetails, {}, withReading({ air_quality: { 'us-epa-index': 3 } }))
    expect(tiles(wrapper)[6].text()).toContain('Sensitive')
  })

  it('names each tile for screen readers and opens a dialog', () => {
    const { wrapper } = setup(WeatherDetails)
    expect(tiles(wrapper)[1].attributes('aria-label')).toBe('Wind from NNW: 11 km/h. Show details')
    expect(tiles(wrapper)[6].attributes('aria-label')).toBe('Air quality: Moderate. Show details')
    expect(tiles(wrapper)[0].attributes('aria-haspopup')).toBe('dialog')
  })

  // md: Air Quality keeps enough width for its name, or "Moderate" truncates at 768px
  it('lays the row out in 7 columns, 4 at lg, offsetting its padding', () => {
    const { wrapper } = setup(WeatherDetails, { variant: 'row' })
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['md:grid-cols-[repeat(6,minmax(0,1fr))_minmax(96px,1fr)]', 'lg:grid-cols-4', 'xl:grid-cols-7']))
    expect(tiles(wrapper)[0].classes()).toEqual(expect.arrayContaining(['-mx-2', 'px-2', '-my-1.5', 'py-1.5']))
  })

  it('lays phone tiles out in 2 columns, 4 from sm, Air Quality spanning 2 at base', () => {
    const { wrapper } = setup(WeatherDetails, { variant: 'tiles' })
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['grid-cols-2', 'sm:grid-cols-4']))
    expect(tiles(wrapper)[6].classes()).toEqual(expect.arrayContaining(['col-span-2', 'sm:col-span-1']))
    expect(tiles(wrapper)[0].classes()).toEqual(expect.arrayContaining(['-mx-3', 'px-3', '-my-2.5', 'py-2.5']))
  })

  it('dims a missing UV reading and explains it, with nothing to open', () => {
    const { wrapper } = setup(WeatherDetails, { variant: 'row' }, withReading({ uv: undefined }))
    const uv = tiles(wrapper)[5]
    expect(uv.attributes('title')).toBe('UV index not available')
    expect(uv.text()).toContain('—')
    expect(uv.findAll('span')[1].find('.text-muted-foreground').exists()).toBe(true)
    expect(uv.attributes('disabled')).toBeDefined()
  })

  it('dims missing air quality rather than claiming Good', () => {
    const { wrapper } = setup(WeatherDetails, {}, withReading({ air_quality: undefined }))
    const aq = tiles(wrapper)[6]
    expect(aq.text()).not.toContain('Good')
    expect(aq.attributes('disabled')).toBeDefined()
  })

  it('has nothing to open before the first fetch', () => {
    const { wrapper } = setup(WeatherDetails, {}, { current: null, forecast: [] })
    expect(tiles(wrapper).every((tile) => tile.attributes('disabled') !== undefined)).toBe(true)
  })

  it('renders Bengali digits in bn', async () => {
    const { wrapper } = setup(WeatherDetails, { variant: 'row' })
    i18n.global.locale.value = 'bn'
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('৫১%')
    i18n.global.locale.value = 'en'
  })
})
