import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import * as A from 'astronomy-engine'
import TimeBar from '@/components/sky/TimeBar.vue'
import { activeI18n } from '@/i18n'
import { createSky, dayStart, formatT, parseT } from '@/utils/sky'

const PLACE = {
  name: 'Joar Sahara',
  country: 'Bangladesh',
  lat: 23.817,
  lon: 90.417,
  tz: 'Asia/Dhaka'
}
const TZ = PLACE.tz
const NOW = parseT('2026-11-16T15:48', TZ)
const sky = createSky(A, PLACE)

let wrapper
function setup(props = {}) {
  const t = props.t ?? NOW
  const ds = dayStart(t, TZ)
  wrapper = mount(TimeBar, {
    attachTo: document.body,
    props: {
      place: PLACE,
      t,
      now: NOW,
      tz: TZ,
      live: true,
      sky,
      day: sky.day(ds),
      ahead: sky.ahead(ds),
      ...props
    },
    global: { plugins: [createPinia(), activeI18n()] }
  })
  return wrapper
}
const commits = () => wrapper.emitted('commit')?.map(([t]) => formatT(t, TZ)) ?? []
const typeInto = async (selector, value) => {
  const input = wrapper.find(selector)
  input.element.value = value
  await input.trigger('input')
}

describe('TimeBar', () => {
  afterEach(() => wrapper?.unmount())

  it('shows the place, the date and today, and live mode', () => {
    setup()
    expect(wrapper.find('[data-place]').text()).toContain('Joar Sahara')
    expect(wrapper.find('[data-place-tag]').text()).toBe('Bangladesh · your location')
    expect(wrapper.find('[data-date-text]').text()).toBe('Mon, Nov 16, 2026')
    expect(wrapper.find('[data-date-tag]').text()).toBe('Today')
    expect(wrapper.find('[data-hour]').element.value).toBe('03')
    expect(wrapper.find('[data-minute]').element.value).toBe('48')
    expect(wrapper.find('[data-pm]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[data-live]').exists()).toBe(true)
    expect(wrapper.find('[data-home]').exists()).toBe(false)
  })

  it('names days ahead and offers the way back to now', () => {
    setup({ t: parseT('2026-11-21T09:00', TZ), live: false })
    expect(wrapper.find('[data-date-tag]').text()).toBe('5 days ahead')
    wrapper.find('[data-back-to-now]').trigger('click')
    expect(wrapper.emitted('live')).toHaveLength(1)
  })

  it('steps a day either way at the same clock time', async () => {
    setup()
    await wrapper.find('[data-prev-day]').trigger('click')
    await wrapper.find('[data-next-day]').trigger('click')
    expect(commits()).toEqual(['2026-11-15T15:48', '2026-11-17T15:48'])
  })

  it('reads typed hours: 1–12 keep AM/PM, 13–23 are 24-hour, anything else reverts', async () => {
    setup()
    await typeInto('[data-hour]', '7')
    await typeInto('[data-hour]', '15')
    await typeInto('[data-hour]', '25')
    expect(commits()).toEqual(['2026-11-16T19:48', '2026-11-16T15:48'])
    expect(wrapper.find('[data-hour]').element.value).toBe('03')
  })

  it('waits for a second hour digit after 0–2, and applies it on blur', async () => {
    setup()
    await typeInto('[data-hour]', '1')
    expect(commits()).toEqual([])
    await wrapper.find('[data-hour]').trigger('blur')
    expect(commits()).toEqual(['2026-11-16T13:48'])
  })

  it('reads typed minutes and reverts past 59', async () => {
    setup()
    await typeInto('[data-minute]', '05')
    await typeInto('[data-minute]', '75')
    expect(commits()).toEqual(['2026-11-16T15:05'])
    expect(wrapper.find('[data-minute]').element.value).toBe('48')
  })

  it('steps and wraps with the arrow keys', async () => {
    setup({ t: parseT('2026-11-16T23:30', TZ) })
    await wrapper.find('[data-hour]').trigger('keydown', { key: 'ArrowUp' })
    await wrapper.find('[data-minute]').trigger('keydown', { key: 'ArrowDown' })
    expect(commits()).toEqual(['2026-11-16T00:30', '2026-11-16T23:29'])
  })

  it('switches AM and PM', async () => {
    setup()
    await wrapper.find('[data-am]').trigger('click')
    await wrapper.find('[data-pm]').trigger('click')
    expect(commits()).toEqual(['2026-11-16T03:48'])
  })

  it('drives the slider from the keyboard', async () => {
    setup()
    const slider = wrapper.find('[data-slider]')
    expect(slider.attributes('aria-valuenow')).toBe(String(15 * 60 + 48))
    expect(slider.attributes('aria-valuetext')).toBe('3:48 PM')
    await slider.trigger('keydown', { key: 'ArrowRight' })
    await slider.trigger('keydown', { key: 'ArrowLeft', shiftKey: true })
    await slider.trigger('keydown', { key: 'PageUp' })
    await slider.trigger('keydown', { key: 'Home' })
    await slider.trigger('keydown', { key: 'End' })
    expect(commits()).toEqual([
      '2026-11-16T15:49',
      '2026-11-16T15:38',
      '2026-11-16T16:48',
      '2026-11-16T00:00',
      '2026-11-16T23:59'
    ])
  })

  it('offers the jump chips', () => {
    setup()
    const chips = wrapper.findAll('[data-jump]').map((c) => c.text())
    expect(chips).toEqual([
      'Sunrise6:13 AM',
      'Solar noon11:43 AM',
      'Sunset5:12 PM',
      'Moonrise11:44 AM',
      'Next full moonNov 24',
      'Next new moonDec 9'
    ])
  })

  it('offers the way back home when away', async () => {
    setup({ away: true, homeName: 'Joar Sahara', place: { ...PLACE, name: 'Dhaka Division' } })
    expect(wrapper.find('[data-place-tag]').text()).toBe('Bangladesh · chosen on the globe')
    await wrapper.find('[data-home]').trigger('click')
    expect(wrapper.emitted('reset-place')).toHaveLength(1)
  })
})
