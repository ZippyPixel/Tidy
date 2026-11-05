import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import UnitToggle from '@/components/ui/UnitToggle.vue'
import { activeI18n } from '@/i18n'
import useUnitStore from '@/stores/unit'

const i18n = activeI18n()

function mountToggle() {
  const pinia = createPinia()
  const wrapper = mount(UnitToggle, { global: { plugins: [pinia, i18n] }, attachTo: document.body })
  return { wrapper, store: useUnitStore(pinia) }
}

const radios = (wrapper) => wrapper.findAll('[role="radio"]')

describe('UnitToggle', () => {
  it('renders a °C / °F radio group with celsius checked by default', () => {
    const { wrapper } = mountToggle()
    expect(wrapper.find('[role="radiogroup"]').attributes('aria-label')).toBe('Temperature')
    const [c, f] = radios(wrapper)
    expect(c.text()).toBe('°C')
    expect(f.text()).toBe('°F')
    expect(c.attributes('aria-checked')).toBe('true')
    expect(f.attributes('aria-checked')).toBe('false')
    wrapper.unmount()
  })

  it('switches to fahrenheit and back on click', async () => {
    const { wrapper, store } = mountToggle()
    await radios(wrapper)[1].trigger('click')
    expect(store.unit).toBe('fahrenheit')
    expect(radios(wrapper)[1].attributes('aria-checked')).toBe('true')
    await radios(wrapper)[0].trigger('click')
    expect(store.unit).toBe('celsius')
    wrapper.unmount()
  })

  it('moves with arrow keys and keeps a single tab stop', async () => {
    const { wrapper, store } = mountToggle()
    expect(radios(wrapper).map((r) => r.attributes('tabindex'))).toEqual(['0', '-1'])
    await wrapper.find('[role="radiogroup"]').trigger('keydown', { key: 'ArrowRight' })
    expect(store.unit).toBe('fahrenheit')
    expect(radios(wrapper).map((r) => r.attributes('tabindex'))).toEqual(['-1', '0'])
    expect(document.activeElement).toBe(radios(wrapper)[1].element)
    await wrapper.find('[role="radiogroup"]').trigger('keydown', { key: 'ArrowRight' })
    expect(store.unit).toBe('celsius')
    wrapper.unmount()
  })

  it('positions the thumb on the selected segment', async () => {
    const { wrapper } = mountToggle()
    const track = wrapper.find('[role="radiogroup"]')
    expect(track.attributes('style')).toContain('--index: 0')
    await radios(wrapper)[1].trigger('click')
    expect(track.attributes('style')).toContain('--index: 1')
    wrapper.unmount()
  })
})
