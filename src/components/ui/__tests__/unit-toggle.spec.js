import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import UnitToggle from '@/components/ui/UnitToggle.vue'
import i18n from '@/i18n'
import useUnitStore from '@/stores/unit'

function mountToggle() {
  const pinia = createPinia()
  const wrapper = mount(UnitToggle, { global: { plugins: [pinia, i18n] } })
  return { wrapper, store: useUnitStore(pinia) }
}

describe('UnitToggle', () => {
  it('renders both unit labels with celsius active by default', () => {
    const { wrapper } = mountToggle()
    expect(wrapper.text()).toContain('°C')
    expect(wrapper.text()).toContain('°F')
    expect(wrapper.find('[role="switch"]').attributes('aria-checked')).toBe('false')
  })

  it('switches to fahrenheit on click', async () => {
    const { wrapper, store } = mountToggle()
    await wrapper.find('[role="switch"]').trigger('click')
    expect(store.unit).toBe('fahrenheit')
    expect(wrapper.find('[role="switch"]').attributes('aria-checked')).toBe('true')
  })

  it('switches back to celsius on second click', async () => {
    const { wrapper, store } = mountToggle()
    await wrapper.find('[role="switch"]').trigger('click')
    await wrapper.find('[role="switch"]').trigger('click')
    expect(store.unit).toBe('celsius')
  })

  it('highlights the active unit label', async () => {
    const { wrapper } = mountToggle()
    const [celsius, fahrenheit] = wrapper.findAll('.pointer-events-none.absolute span')
    expect(celsius.classes()).toContain('text-slate-800')
    expect(fahrenheit.classes()).toContain('text-gray-400')

    await wrapper.find('[role="switch"]').trigger('click')
    expect(celsius.classes()).toContain('text-gray-400')
    expect(fahrenheit.classes()).toContain('text-slate-800')
  })
})
