import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import TideChart from '@/components/tides/TideChart.vue'
import { activeI18n } from '@/i18n'
import useUnitStore from '@/stores/unit'
import sample from '@/utils/__tests__/fixtures/tides-sample.json'

const tides = sample.stations[sample.defaultStation]

function setup(props = {}, unit = 'celsius') {
  const pinia = createPinia()
  useUnitStore(pinia).unit = unit
  return mount(TideChart, {
    props: { tides, now: sample.now, ...props },
    global: { plugins: [pinia, activeI18n()] }
  })
}

// jsdom has no PointerEvent, and trigger() cannot set clientX on a MouseEvent
async function point(wrapper, svg, type, clientX, pointerType) {
  const event = new MouseEvent(type, { clientX, bubbles: true })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  svg.element.dispatchEvent(event)
  await wrapper.vm.$nextTick()
}

describe('TideChart', () => {
  it('labels today’s highs and lows in the station’s time', () => {
    const wrapper = setup()
    const marks = wrapper.findAll('[data-mark]')
    expect(marks).toHaveLength(4)
    expect(marks[3].attributes('data-high')).toBe('false')
    expect(marks[3].text()).toMatch(/6:40\sPM/)
    expect(marks[3].text()).toContain('0.77 m')
  })

  it('names the station’s highs and lows for a screen reader', () => {
    const svg = setup().find('svg[role="img"]')
    expect(svg.attributes('aria-label')).toMatch(/low 6:40\sPM, 0\.77 m/)
  })

  it('shows feet with °F', () => {
    const mark = setup({}, 'fahrenheit').findAll('[data-mark]')[3]
    expect(mark.text()).toContain('2.5 ft')
  })

  it('draws night bands, a dimmed past and a now line today', () => {
    const wrapper = setup()
    expect(wrapper.findAll('[data-night]').length).toBeGreaterThan(0)
    expect(wrapper.find('[data-past]').exists()).toBe(true)
    expect(wrapper.find('[data-now]').exists()).toBe(true)
    expect(wrapper.find('[data-now-dot]').exists()).toBe(true)
  })

  it('has no now line on another day, and dims the marks already past', () => {
    expect(setup({ day: 1 }).find('[data-now]').exists()).toBe(false)
    const marks = setup().findAll('[data-mark]')
    expect(marks[0].classes()).toContain('opacity-50')
    expect(marks[3].classes()).not.toContain('opacity-50')
  })

  it('drops the labels in Week view, and names the days instead', () => {
    const wrapper = setup({ view: 'week' })
    expect(wrapper.find('[data-mark] span span').exists()).toBe(false)
    const ticks = wrapper.findAll('[data-tick]').map((t) => t.text())
    expect(ticks).toHaveLength(7)
    expect(ticks[0]).toBe('Fri 6')
  })

  it('marks every 3 h, leaving the odd ones to wider screens', () => {
    const ticks = setup().findAll('[data-tick]')
    expect(ticks).toHaveLength(8)
    expect(ticks[0].text()).toMatch(/12\sAM/)
    expect(ticks[0].classes()).not.toContain('hidden')
    expect(ticks[1].classes()).toContain('hidden')
  })

  it('reads the level under the pointer, and hides it when a mouse leaves', async () => {
    const wrapper = setup()
    const svg = wrapper.find('svg[role="img"]')
    svg.element.getBoundingClientRect = () => ({ left: 0, width: 1000 })
    await point(wrapper, svg, 'pointermove', 540, 'mouse')
    const readout = wrapper.find('[data-readout]')
    expect(readout.text()).toMatch(/12:58\sPM/)
    expect(readout.text()).toContain('▼ Falling')
    await point(wrapper, svg, 'pointerleave', 540, 'mouse')
    expect(wrapper.find('[data-readout]').exists()).toBe(false)
  })

  it('keeps a touch reading after the finger lifts', async () => {
    const wrapper = setup()
    const svg = wrapper.find('svg[role="img"]')
    svg.element.getBoundingClientRect = () => ({ left: 0, width: 1000 })
    await point(wrapper, svg, 'pointerdown', 100, 'touch')
    await point(wrapper, svg, 'pointerleave', 100, 'touch')
    expect(wrapper.find('[data-readout]').exists()).toBe(true)
  })

  it('does not scrub on the dashboard card, which is a link', async () => {
    const wrapper = setup({ view: 'card', interactive: false })
    const svg = wrapper.find('svg')
    expect(svg.attributes('aria-hidden')).toBe('true')
    await point(wrapper, svg, 'pointermove', 100, 'mouse')
    expect(wrapper.find('[data-readout]').exists()).toBe(false)
  })

  it('draws a placeholder while loading', () => {
    const wrapper = setup({ tides: null })
    expect(wrapper.find('[data-skeleton]').exists()).toBe(true)
    expect(wrapper.find('[data-mark]').exists()).toBe(false)
  })
})
