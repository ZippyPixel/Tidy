import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import PlanetaryInfo from '@/components/weather/PlanetaryInfo.vue'
import { activeI18n } from '@/i18n'
import useWeatherStore from '@/stores/weather'

const i18n = activeI18n()
const realNow = Date.now

const TODAY = {
  sunrise: '05:48 AM',
  sunset: '05:51 PM',
  moonrise: '05:04 PM',
  moonset: '04:27 AM',
  moon_phase: 'Waxing Gibbous',
  moon_illumination: 97
}
const TOMORROW = { ...TODAY, sunrise: '05:49 AM', moonrise: '05:50 PM', moonset: '05:15 AM' }

// local clock: 3:37 PM in UTC+6
function setup({ hour = 15, minute = 37, astro = TODAY, date = '2026-09-25' } = {}) {
  Date.now = () => Date.UTC(2026, 8, 25, hour - 6, minute)
  const pinia = createPinia()
  const store = useWeatherStore(pinia)
  store.$patch({
    astro,
    date,
    today: '2026-09-25',
    zoneOffsetMs: 6 * 3600000,
    forecast: [
      { date: '2026-09-25', astro },
      { date: '2026-09-26', astro: TOMORROW }
    ]
  })
  return mount(PlanetaryInfo, { global: { plugins: [pinia, i18n] } })
}

describe('Sun & Moon card', () => {
  beforeEach(() => {
    i18n.global.locale.value = 'en'
  })
  afterEach(() => {
    Date.now = realNow
  })

  it('counts down to sunset and to moonrise', () => {
    const text = setup().text()
    expect(text).toContain('Sun & Moon')
    expect(text).toContain('Sets in 2h 14m')
    expect(text).toContain('12h 03m of daylight')
    expect(text).toContain('Rises in 1h 27m')
    expect(text).toContain('Waxing Gibbous · 97% illuminated')
  })

  it('labels a moonset after midnight as tomorrow', () => {
    const text = setup().text()
    expect(text).toContain('Moonset · Tomorrow')
    expect(text).toContain('4:27 AM')
  })

  it('counts down to tomorrow’s sunrise after dark', () => {
    // 10:40 PM -> 5:49 AM tomorrow
    expect(setup({ hour: 22, minute: 40 }).text()).toContain('Rises in 7h 09m')
  })

  it('shows a glowing marker only while the sun is up', () => {
    const day = setup()
    expect(day.find('.bg-sun').exists()).toBe(true)
    const night = setup({ hour: 22, minute: 40 })
    expect(night.find('.bg-sun').exists()).toBe(false)
    expect(night.find('.bg-horizon').exists()).toBe(true)
  })

  it('has no countdown or marker for another day', () => {
    const wrapper = setup({ date: '2026-09-26' })
    expect(wrapper.text()).toContain('Rises at 5:48 AM')
    expect(wrapper.find('.marker').exists()).toBe(false)
  })

  it('explains a day with no moonrise', () => {
    const text = setup({ astro: { ...TODAY, moonrise: 'No moonrise', moonset: '01:20 PM' } }).text()
    expect(text).toContain('No moonrise today · next rise tomorrow, 5:50 PM')
    expect(text).toContain('Moonrise · Yesterday')
  })

  it('stacks on phones, sits side by side on md and stacks again from lg', () => {
    const groups = setup().find('section > div:last-child')
    expect(groups.classes()).toEqual(expect.arrayContaining(['flex-col', 'md:flex-row', 'lg:flex-col']))
  })
})
