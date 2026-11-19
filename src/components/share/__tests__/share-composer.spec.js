import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import ShareComposerBody from '@/components/share/ShareComposerBody.vue'
import { activeI18n } from '@/i18n'
import useWeatherStore from '@/stores/weather'
import fixture from '@/utils/__tests__/fixtures/weatherapi-forecast.json'

vi.mock('@/utils/share/capture', () => ({
  captureCard: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
  paintSvg: vi.fn(async () => 'data:image/png;base64,AA=='),
  cardFontCss: vi.fn(async () => '')
}))

const i18n = activeI18n()
const NOW = fixture.location.localtime_epoch * 1000
const realNow = Date.now

async function setup(props = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  await useWeatherStore().setValues(fixture)
  const wrapper = mount(ShareComposerBody, {
    props: { siteOrigin: 'https://tidy.example', ...props },
    global: { plugins: [pinia, i18n] },
    attachTo: document.body
  })
  await flushPromises()
  return wrapper
}

const tab = async (wrapper, name) => {
  const button = wrapper.findAll('[role="tab"]').find((b) => b.text() === name)
  await button.trigger('click')
}
const button = (wrapper, text) => wrapper.findAll('button').find((b) => b.text().includes(text))
const pressed = (wrapper) =>
  wrapper
    .findAll('[aria-pressed="true"]')
    .map((b) => b.text())
    .filter(Boolean)

beforeEach(() => {
  Date.now = () => NOW
  global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ station: null }) }))
  globalThis.$fetch = vi.fn(async () => ({ station: null }))
  URL.createObjectURL = vi.fn(() => 'blob:card')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  Date.now = realNow
  delete navigator.share
  delete navigator.canShare
  document.body.innerHTML = ''
})

describe('share composer', () => {
  it('opens on the moment of the page it came from', async () => {
    const wrapper = await setup({ origin: 'tides' })
    expect(wrapper.text()).toContain('Share the tide')
    await tab(wrapper, 'Content')
    expect(pressed(wrapper)).toContain('Beach dayTide, wind, UV, sun arc')
    expect(wrapper.text()).toContain('4 of 6')
  })

  it('has a real tablist with three tabs', async () => {
    const wrapper = await setup()
    expect(wrapper.find('[role="tablist"]').exists()).toBe(true)
    expect(wrapper.findAll('[role="tab"]').map((t) => t.text())).toEqual(['Look', 'Content', 'Privacy'])
    expect(wrapper.find('[role="tabpanel"]').attributes('aria-label')).toBe('Look')
  })

  it('trims the details to four on a post', async () => {
    const wrapper = await setup()
    await button(wrapper, 'Post').trigger('click')
    await tab(wrapper, 'Content')
    expect(wrapper.text()).toContain('4 of 4')
    const chip = button(wrapper, 'Rain chance')
    expect(chip.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('or switch to Story for six')
  })

  it('clears the moment when a detail is edited by hand', async () => {
    const wrapper = await setup()
    await tab(wrapper, 'Content')
    await button(wrapper, 'Moon phase').trigger('click')
    expect(pressed(wrapper).some((t) => t.startsWith('Today'))).toBe(false)
    expect(wrapper.text()).toContain('5 of 6')
  })

  it('turns the location detail off with Location', async () => {
    const wrapper = await setup()
    await tab(wrapper, 'Content')
    await button(wrapper, 'Location').trigger('click')
    await tab(wrapper, 'Privacy')
    const radios = wrapper.findAll('[role="radio"]')
    expect(radios.every((r) => r.attributes('disabled') !== undefined)).toBe(true)
    expect(wrapper.text()).toContain('the link carries no place')
    expect(wrapper.vm.url).toBe('https://tidy.example/?d=2026-11-06&from=share&m=today')
  })

  it('links to the place, rounded for a region', async () => {
    const wrapper = await setup()
    expect(wrapper.vm.url).toContain('lat=23.82&lon=90.42&name=Joar+Sahara')
    await tab(wrapper, 'Privacy')
    await button(wrapper, 'Region').trigger('click')
    expect(wrapper.vm.url).toContain('lat=23.8&lon=90.4&country=Bangladesh')
    expect(wrapper.vm.url).not.toContain('name=')
  })

  it('needs a photo before the photo look can share', async () => {
    const wrapper = await setup({ phone: true })
    await button(wrapper, 'Photo').trigger('click')
    expect(wrapper.find('.share-btn-primary').attributes('disabled')).toBeDefined()
  })

  it('downloads and copies on md+', async () => {
    const wrapper = await setup()
    expect(wrapper.find('.share-btn-primary').text()).toBe('Download PNG')
    expect(wrapper.find('.share-btn-secondary').text()).toBe('Copy image')
  })

  it('shares the PNG with the text and the link on a phone', async () => {
    navigator.canShare = () => true
    navigator.share = vi.fn(async () => {})
    const wrapper = await setup({ phone: true })
    expect(wrapper.find('.share-btn-primary').text()).toBe('Share')
    await wrapper.find('.share-btn-primary').trigger('click')
    await flushPromises()
    const [{ files, text }] = navigator.share.mock.calls[0]
    expect(files[0].name).toBe('tidy-joar-sahara-2026-11-06.png')
    expect(text).toContain("Today's weather in Joar Sahara, made with TIDY.")
    expect(text).toContain('See yours: https://tidy.example/?')
    expect(wrapper.find('[role="dialog"]').text()).toContain('Your card is on its way')
  })

  it('does nothing when the share is cancelled', async () => {
    navigator.canShare = () => true
    navigator.share = vi.fn(async () => {
      throw Object.assign(new Error('cancel'), { name: 'AbortError' })
    })
    const wrapper = await setup({ phone: true })
    await wrapper.find('.share-btn-primary').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.find('.share-message').exists()).toBe(false)
  })

  it('saves instead when the phone cannot share files', async () => {
    const wrapper = await setup({ phone: true })
    expect(wrapper.find('.share-btn-primary').text()).toBe('Save')
  })
})
