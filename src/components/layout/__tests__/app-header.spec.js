import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import AppHeader from '@/components/layout/AppHeader.vue'
import useThemeStore from '@/stores/theme'
import useUnitStore from '@/stores/unit'

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))
}

async function openSettingsMenu(wrapper) {
  const trigger = wrapper.find('[aria-label="Open settings menu"]')
  await trigger.trigger('pointerdown', { button: 0, ctrlKey: false })
  await trigger.trigger('click')
  await wrapper.vm.$nextTick()
  return trigger
}

function menuItems() {
  return [...document.body.querySelectorAll('[role="menuitem"]')]
}

describe('AppHeader settings dropdown', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders a settings trigger instead of standalone toggles', () => {
    const wrapper = mount(AppHeader, { global: { plugins: [createPinia()] } })
    expect(wrapper.find('[aria-label="Open settings menu"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('settings')
    // unit pill and theme button only live inside the (closed) menu
    expect(wrapper.find('[role="switch"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('opens the menu with theme and temperature entries', async () => {
    const wrapper = mount(AppHeader, { global: { plugins: [createPinia()] } })
    await openSettingsMenu(wrapper)

    const items = menuItems()
    expect(items.length).toBe(2)
    const text = items.map((i) => i.textContent).join(' ')
    expect(text).toContain('Light mode')
    expect(text).toContain('Temperature')
    expect(document.body.querySelector('[role="switch"]')).toBeTruthy()
    wrapper.unmount()
  })

  it('toggles the theme from the menu without closing it', async () => {
    const pinia = createPinia()
    const wrapper = mount(AppHeader, { global: { plugins: [pinia] } })
    const themeStore = useThemeStore(pinia)
    await openSettingsMenu(wrapper)

    const themeItem = menuItems().find((i) => i.textContent.includes('mode'))
    themeItem.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(themeStore.isDark).toBe(true)
    expect(menuItems().length).toBe(2)
    wrapper.unmount()
  })

  it('toggles the unit from the menu row', async () => {
    const pinia = createPinia()
    const wrapper = mount(AppHeader, { global: { plugins: [pinia] } })
    const unitStore = useUnitStore(pinia)
    await openSettingsMenu(wrapper)

    const unitItem = menuItems().find((i) => i.textContent.includes('Temperature'))
    unitItem.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(unitStore.unit).toBe('fahrenheit')
    wrapper.unmount()
  })
})
