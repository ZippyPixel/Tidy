import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
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

async function openSettings(wrapper) {
  await wrapper.find('[aria-label="Open settings menu"]').trigger('click')
  await flushPromises()
}

function settingsSurface() {
  return document.body.querySelector('[role="dialog"]')
}

function row(text) {
  return [...settingsSurface().querySelectorAll('div, button')].find(
    (el) => el.textContent.trim().startsWith(text) && el.className.includes('min-h-14')
  )
}

function stubMatchMedia(matches) {
  vi.stubGlobal('matchMedia', (query) => ({
    matches,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {}
  }))
}

describe('AppHeader layout', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('has 44px search, locate and settings buttons for phones', () => {
    const wrapper = mount(AppHeader, { global: { plugins: [createPinia(), i18n] } })
    const search = wrapper.find('[aria-label="Search city"]')
    expect(search.classes()).toContain('size-11')
    expect(search.classes()).toContain('md:hidden')
    expect(wrapper.findAll('[aria-label="Get current location"]').length).toBe(2)
    expect(wrapper.find('[aria-label="Open settings menu"]').classes()).toContain('size-11')
    wrapper.unmount()
  })

  it('opens the full-screen search from the phone search button', async () => {
    const wrapper = mount(AppHeader, { global: { plugins: [createPinia(), i18n] }, attachTo: document.body })
    await wrapper.find('[aria-label="Search city"]').trigger('click')
    await flushPromises()
    const dialog = settingsSurface()
    expect(dialog).toBeTruthy()
    expect(dialog.querySelector('[aria-label="Close search"]')).toBeTruthy()
    expect(dialog.querySelector('input[placeholder="Search City"]')).toBeTruthy()

    dialog.querySelector('[aria-label="Close search"]').click()
    await flushPromises()
    expect(settingsSurface()).toBeNull()
    wrapper.unmount()
  })
})

describe('AppHeader settings', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.stubGlobal('$fetch', $fetch)
  })

  it('renders a settings trigger instead of standalone toggles', () => {
    const wrapper = mount(AppHeader, { global: { plugins: [createPinia(), i18n] } })
    expect(wrapper.find('[aria-label="Open settings menu"] svg.lucide-settings-icon').exists()).toBe(true)
    // switch and unit control only live inside the (closed) settings surface
    expect(document.body.querySelector('[role="switch"]')).toBeNull()
    expect(document.body.querySelector('[role="radiogroup"]')).toBeNull()
    wrapper.unmount()
  })

  it('opens a bottom sheet below md with theme, temperature and language rows', async () => {
    const wrapper = mount(AppHeader, { global: { plugins: [createPinia(), i18n] }, attachTo: document.body })
    await openSettings(wrapper)

    const sheet = settingsSurface()
    expect(sheet).toBeTruthy()
    expect(sheet.className).toContain('rounded-t-[28px]')
    expect(sheet.textContent).toContain('Settings')
    expect(sheet.querySelector('[aria-label="Close"]')).toBeTruthy()
    expect(sheet.textContent).toContain('Dark mode')
    expect(sheet.textContent).toContain('Temperature')
    expect(sheet.textContent).toContain('Language')
    expect(sheet.textContent).toContain('English')
    expect(sheet.querySelector('[role="switch"]')).toBeTruthy()
    expect(sheet.querySelectorAll('[role="radio"]').length).toBe(2)
    wrapper.unmount()
  })

  it('opens a popover from md', async () => {
    stubMatchMedia(true)
    const wrapper = mount(AppHeader, { global: { plugins: [createPinia(), i18n] }, attachTo: document.body })
    await openSettings(wrapper)

    const popover = settingsSurface()
    expect(popover).toBeTruthy()
    expect(popover.className).not.toContain('rounded-t-[28px]')
    expect(popover.className).toContain('w-80')
    expect(popover.textContent).toContain('Dark mode')
    wrapper.unmount()
  })

  it('toggles the theme from its row without closing the sheet', async () => {
    const pinia = createPinia()
    const wrapper = mount(AppHeader, { global: { plugins: [pinia, i18n] }, attachTo: document.body })
    const themeStore = useThemeStore(pinia)
    await openSettings(wrapper)

    row('Dark mode').click()
    await flushPromises()
    expect(themeStore.isDark).toBe(true)
    expect(settingsSurface().querySelector('[role="switch"]').getAttribute('aria-checked')).toBe('true')

    // the switch itself toggles exactly once
    settingsSurface().querySelector('[role="switch"]').click()
    await flushPromises()
    expect(themeStore.isDark).toBe(false)
    expect(settingsSurface()).toBeTruthy()
    wrapper.unmount()
  })

  it('sets the unit from the °C / °F control', async () => {
    const pinia = createPinia()
    const wrapper = mount(AppHeader, { global: { plugins: [pinia, i18n] }, attachTo: document.body })
    const unitStore = useUnitStore(pinia)
    await openSettings(wrapper)

    const [, fahrenheit] = settingsSurface().querySelectorAll('[role="radio"]')
    fahrenheit.click()
    await flushPromises()
    expect(unitStore.unit).toBe('fahrenheit')
    wrapper.unmount()
  })

  it('switches the app language to Bangla from its row', async () => {
    const pinia = createPinia()
    const wrapper = mount(AppHeader, { global: { plugins: [pinia, i18n] }, attachTo: document.body })
    const localeStore = useLocaleStore(pinia)
    await openSettings(wrapper)

    row('Language').click()
    await flushPromises()

    expect(localeStore.locale).toBe('bn')
    expect(i18n.global.locale.value).toBe('bn')
    // sheet re-renders in Bangla
    const text = settingsSurface().textContent
    expect(text).toContain('ভাষা')
    expect(text).toContain('তাপমাত্রা')

    // toggle back so the shared i18n instance does not leak into other tests
    localeStore.setLocale('en')
    await flushPromises()
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
