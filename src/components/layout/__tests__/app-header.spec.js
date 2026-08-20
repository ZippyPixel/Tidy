import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import AppHeader from '@/components/layout/AppHeader.vue'
import { activeI18n } from '@/i18n'
import useThemeStore from '@/stores/theme'
import useUnitStore from '@/stores/unit'
import useWeatherStore from '@/stores/weather'
import useLocaleStore from '@/stores/locale'

const i18n = activeI18n()

// the store now talks to the Nitro proxy through Nuxt's global $fetch
const $fetch = vi.fn()
vi.stubGlobal('$fetch', $fetch)

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))
}

if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn()
}

// jsdom exposes button/ctrlKey as read-only getters, so they have to be passed to the
// constructor — test-utils' trigger() assigns them after construction and throws.
function pointerEvent(type, init = {}) {
  const Ctor = typeof PointerEvent === 'function' ? PointerEvent : MouseEvent
  return new Ctor(type, { bubbles: true, cancelable: true, button: 0, ...init })
}

async function openSettingsMenu(wrapper) {
  const trigger = wrapper.find('[aria-label="Open settings menu"]')
  trigger.element.dispatchEvent(pointerEvent('pointerdown', { ctrlKey: false }))
  trigger.element.dispatchEvent(pointerEvent('click'))
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
    const wrapper = mount(AppHeader, { global: { plugins: [createPinia(), i18n] } })
    expect(wrapper.find('[aria-label="Open settings menu"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Open settings menu"] svg.lucide-settings-icon').exists()).toBe(true)
    // unit pill and theme button only live inside the (closed) menu
    expect(wrapper.find('[role="switch"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('opens the menu with theme, temperature and language entries', async () => {
    const wrapper = mount(AppHeader, { global: { plugins: [createPinia(), i18n] } })
    await openSettingsMenu(wrapper)

    const items = menuItems()
    expect(items.length).toBe(3)
    const text = items.map((i) => i.textContent).join(' ')
    expect(text).toContain('Light mode')
    expect(text).toContain('Temperature')
    expect(text).toContain('Language')
    expect(text).toContain('English')
    expect(document.body.querySelector('[role="switch"]')).toBeTruthy()
    wrapper.unmount()
  })

  it('toggles the theme from the menu without closing it', async () => {
    const pinia = createPinia()
    const wrapper = mount(AppHeader, { global: { plugins: [pinia, i18n] } })
    const themeStore = useThemeStore(pinia)
    await openSettingsMenu(wrapper)

    const themeItem = menuItems().find((i) => i.textContent.includes('mode'))
    themeItem.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(themeStore.isDark).toBe(true)
    expect(menuItems().length).toBe(3)
    wrapper.unmount()
  })

  it('toggles the unit from the menu row', async () => {
    const pinia = createPinia()
    const wrapper = mount(AppHeader, { global: { plugins: [pinia, i18n] } })
    const unitStore = useUnitStore(pinia)
    await openSettingsMenu(wrapper)

    const unitItem = menuItems().find((i) => i.textContent.includes('Temperature'))
    unitItem.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(unitStore.unit).toBe('fahrenheit')
    wrapper.unmount()
  })

  it('switches the app language to Bangla from the menu row', async () => {
    const pinia = createPinia()
    const wrapper = mount(AppHeader, { global: { plugins: [pinia, i18n] } })
    const localeStore = useLocaleStore(pinia)
    await openSettingsMenu(wrapper)

    const languageItem = menuItems().find((i) => i.textContent.includes('Language'))
    languageItem.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(localeStore.locale).toBe('bn')
    expect(i18n.global.locale.value).toBe('bn')
    // menu re-renders in Bangla
    const text = menuItems().map((i) => i.textContent).join(' ')
    expect(text).toContain('ভাষা')
    expect(text).toContain('তাপমাত্রা')

    // toggle back so the shared i18n instance does not leak into other tests
    localeStore.setLocale('en')
    await wrapper.vm.$nextTick()
    expect(i18n.global.locale.value).toBe('en')
    wrapper.unmount()
  })
})

describe('AppHeader search autocomplete', () => {
  const SUGGESTIONS = [
    { id: 1283240, name: 'Dhaka', region: '', country: 'Bangladesh', lat: 23.72, lon: 90.41 },
    { id: 9000037, name: 'Dhahran', region: 'Dhahran', country: 'Saudi Arabia', lat: 26.27, lon: 50.15 }
  ]

  beforeEach(() => {
    document.body.innerHTML = ''
    vi.useFakeTimers()
    $fetch.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function typeInSearch(wrapper, text) {
    const input = wrapper.find('input[placeholder="Search City"]')
    await input.setValue(text)
    await vi.advanceTimersByTimeAsync(300)
    await wrapper.vm.$nextTick()
    return input
  }

  function options() {
    return [...document.body.querySelectorAll('[role="option"]')]
  }

  it('does not query the API for fewer than 3 characters', async () => {
    const wrapper = mount(AppHeader, { global: { plugins: [createPinia(), i18n] } })
    await typeInSearch(wrapper, 'dh')
    await vi.advanceTimersByTimeAsync(500)

    expect($fetch).not.toHaveBeenCalled()
    expect(options().length).toBe(0)
    wrapper.unmount()
  })

  it('shows debounced suggestions below the search bar', async () => {
    $fetch.mockResolvedValue(SUGGESTIONS)
    const wrapper = mount(AppHeader, { global: { plugins: [createPinia(), i18n] } })
    await typeInSearch(wrapper, 'dha')

    expect($fetch).toHaveBeenCalledTimes(1)
    // hits our own Nitro route, never WeatherAPI directly, so no key reaches the client
    const [url, options_] = $fetch.mock.calls[0]
    expect(url).toBe('/api/search')
    expect(options_.query).toEqual({ q: 'dha' })

    const items = options()
    expect(items.length).toBe(2)
    expect(items[0].textContent).toContain('Dhaka')
    expect(items[0].textContent).toContain('Bangladesh')
    expect(items[1].textContent).toContain('Dhahran, Saudi Arabia')
    wrapper.unmount()
  })

  it('shows an empty state when no city matches', async () => {
    $fetch.mockResolvedValue([])
    const wrapper = mount(AppHeader, { global: { plugins: [createPinia(), i18n] } })
    await typeInSearch(wrapper, 'zzz')

    expect(options().length).toBe(0)
    expect(document.body.textContent).toContain('No matching cities')
    wrapper.unmount()
  })

  it('fetches weather by location id when a suggestion is clicked', async () => {
    $fetch.mockResolvedValue(SUGGESTIONS)
    const pinia = createPinia()
    const wrapper = mount(AppHeader, { global: { plugins: [pinia, i18n] } })
    const weatherStore = useWeatherStore(pinia)
    const getCityWeather = vi.spyOn(weatherStore, 'getCityWeather').mockResolvedValue()

    const input = await typeInSearch(wrapper, 'dha')
    options()[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(0)
    await wrapper.vm.$nextTick()

    expect(getCityWeather).toHaveBeenCalledWith('id:1283240')
    expect(options().length).toBe(0)
    expect(input.element.value).toBe('')
    wrapper.unmount()
  })
})
