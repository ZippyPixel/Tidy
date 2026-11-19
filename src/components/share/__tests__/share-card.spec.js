import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, ref, shallowRef } from 'vue'

import ShareCard from '@/components/share/ShareCard.vue'
import useShareData from '@/composables/useShareData'
import { activeI18n } from '@/i18n'
import useWeatherStore from '@/stores/weather'
import useTidesStore from '@/stores/tides'
import useUnitStore from '@/stores/unit'
import { HEADER_DEFAULT, momentDetails } from '@/utils/share/shareContent'
import fixture from '@/utils/__tests__/fixtures/weatherapi-forecast.json'

const i18n = activeI18n()
// 2026-11-06 13:01 in Dhaka (UTC+6), the fixture's own clock
const NOW = fixture.location.localtime_epoch * 1000

async function setup({ takenAt = null, props = {}, tide = null } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  await useWeatherStore().setValues(fixture)
  if (tide) useTidesStore().nearest.data = tide
  let api
  const Host = defineComponent({
    setup() {
      api = useShareData({ t: i18n.global.t, nowMs: ref(NOW), takenAt: ref(takenAt), sky: shallowRef(null) })
      return () =>
        h(ShareCard, {
          header: HEADER_DEFAULT,
          details: momentDetails('today', 6),
          data: api.data.value,
          site: 'tidy.example',
          ...props
        })
    }
  })
  const wrapper = mount(Host, { global: { plugins: [pinia, i18n] } })
  return { wrapper, api }
}

const details = (wrapper) => wrapper.findAll('[data-detail]').map((d) => d.attributes('data-detail'))

afterEach(() => {
  i18n.global.locale.value = 'en'
})

describe('share card', () => {
  it('reads the stores into the top lines', async () => {
    const { api } = await setup()
    const d = api.data.value
    expect(d.placeName).toBe('Joar Sahara')
    expect(d.dateLine).toBe('Fri, Nov 6 · 1:01 PM')
    expect(d.temp).toBe(`${Math.round(fixture.current.temp_c)}°`)
    expect(d.summary).toBe('Sunny')
    expect(d.sunrise).toBe('6:07 AM')
    expect(api.date.value).toBe('2026-11-06')
  })

  it('has one root element, the box the export captures', async () => {
    const { wrapper } = await setup()
    const card = wrapper.findComponent(ShareCard)
    expect(card.element.classList).toContain('share-card-box')
  })

  it('shows the Today details and reads them all out', async () => {
    const { wrapper } = await setup()
    expect(details(wrapper)).toEqual(['wind', 'visibility', 'uv', 'aqi', 'sun', 'moon'])
    const label = wrapper.find('[role="img"]').attributes('aria-label')
    expect(label).toContain('TIDY share card')
    expect(label).toContain('Joar Sahara')
    expect(label).toContain('Sunrise 6:07 AM, sunset 5:16 PM')
    expect(label).toContain('Moon: Waning Crescent, 6% lit')
    expect(wrapper.text()).toContain('tidy.example')
  })

  it('gives the summary the headline size with the temperature off', async () => {
    const { wrapper } = await setup({ props: { header: ['summary'] } })
    const summary = wrapper.findAll('span').find((s) => s.text() === 'Sunny')
    expect(summary.attributes('style')).toContain('calc(var(--u) * 36)')
  })

  it('drops the link text when the link is off', async () => {
    const { wrapper } = await setup({ props: { link: false } })
    expect(wrapper.text()).not.toContain('tidy.example')
    expect(wrapper.text()).toContain('TIDY')
  })

  it('shows the tide now with a rising arrow', async () => {
    const start = Math.floor(NOW / 1000) - 600
    const tide = { station: { id: 'x' }, timeline: { start, stepSec: 600, levels: [100, 110, 120, 130] } }
    const { wrapper, api } = await setup({ tide, props: { details: ['tide'] } })
    expect(api.data.value.tide).toEqual({ value: '1.10', unit: 'm', rising: true })
    expect(details(wrapper)).toEqual(['tide'])
    expect(wrapper.find('[role="img"]').attributes('aria-label')).toContain('Tide 1.10 m and rising')
  })

  it('formats in the chosen unit', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useUnitStore().unit = 'fahrenheit'
    await useWeatherStore().setValues(fixture)
    let api
    mount(
      defineComponent({
        setup() {
          api = useShareData({ t: i18n.global.t, nowMs: ref(NOW), takenAt: ref(null), sky: shallowRef(null) })
          return () => null
        }
      }),
      { global: { plugins: [pinia, i18n] } }
    )
    expect(api.data.value.temp).toBe(`${Math.round(fixture.current.temp_f)}°`)
    expect(api.data.value.wind.unit).toBe('mph')
  })

  it('hides the weather for a photo the forecast has no hour for', async () => {
    const { wrapper, api } = await setup({ takenAt: NOW - 30 * 86400 * 1000 })
    expect(api.hasWeather.value).toBe(false)
    expect(api.data.value.temp).toBe('')
    expect(api.data.value.dateLine.startsWith('Taken ')).toBe(true)
    expect(details(wrapper)).not.toContain('wind')
  })

  it('uses the forecast hour for a photo taken today', async () => {
    const { api } = await setup({ takenAt: NOW - 3 * 3600 * 1000 })
    expect(api.hasWeather.value).toBe(true)
    const hour = fixture.forecast.forecastday[0].hour[10]
    expect(api.data.value.temp).toBe(`${Math.round(hour.temp_c)}°`)
    expect(api.data.value.aqi).toBe(null)
  })
})
