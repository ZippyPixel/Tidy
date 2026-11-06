import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import HourDetailModal from '@/components/weather/HourDetailModal.vue'
import { activeI18n } from '@/i18n'
import useUnitStore from '@/stores/unit'
import { normalizeHour, previousHour } from '@/utils/hourly'
import fixture from '@/utils/__tests__/fixtures/weatherapi-forecast.json'

const i18n = activeI18n()
const hourly = Object.fromEntries(
  fixture.forecast.forecastday.map((day) => [day.date, day.hour.map(normalizeHour)])
)
const DATE = '2026-11-06'
const hour = (h, patch = {}) => ({ ...hourly[DATE][h], ...patch })
const realMatchMedia = window.matchMedia

function setWidth(md) {
  window.matchMedia = (query) => ({
    matches: md && query.includes('min-width: 768px'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false
  })
}

let wrapper
let opener
let closes

async function open({ md = false, h = 13, patch, unit = 'celsius' } = {}) {
  setWidth(md)
  const pinia = createPinia()
  useUnitStore(pinia).unit = unit
  const selected = hour(h, patch)
  wrapper = mount(HourDetailModal, {
    attachTo: document.body,
    global: { plugins: [pinia, i18n] },
    props: {
      hour: null,
      previous: null,
      when: 'Today · Now',
      opener,
      onClose: () => {
        closes++
        wrapper.setProps({ hour: null })
      }
    }
  })
  await flushPromises()
  await wrapper.setProps({ hour: selected, previous: previousHour(hourly, DATE, h) })
  await flushPromises()
}

const dialog = () => document.querySelector('[role="dialog"]')
const text = () => dialog()?.textContent.replace(/\s+/g, ' ') ?? ''
const tileTexts = () =>
  [...dialog().querySelectorAll('[data-tile]')].map((tile) =>
    [...tile.children].map((part) => part.textContent.trim()).join(' ')
  )
const waitForClose = async () => {
  await new Promise((resolve) => setTimeout(resolve, 20))
  await flushPromises()
}

describe('HourDetailModal', () => {
  beforeEach(() => {
    closes = 0
    // entries pushed by earlier tests must not look like this test's
    history.replaceState(null, '')
    opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
  })

  afterEach(() => {
    wrapper?.unmount()
    opener.remove()
    window.matchMedia = realMatchMedia
    document.body.innerHTML = ''
  })

  describe('content', () => {
    it('renders the header', async () => {
      await open()
      expect(text()).toContain('Today · Now')
      expect(text()).toContain('32°')
      expect(text()).toContain('Feels like 31°')
      expect(text()).toContain('Sunny')
      expect(dialog().querySelector('img')).not.toBeNull()
    })

    it('renders the six tiles with their sub-lines', async () => {
      await open()
      const tiles = tileTexts()
      expect(tiles).toEqual([
        'Chance of rain 1% No rain expected',
        'Wind 14 km/h From NNW · gusts 25',
        'Humidity 40% Dew point 17°',
        'UV index 6 High',
        'Visibility 10 km Clear view',
        'Pressure 1012 hPa Falling'
      ])
    })

    it('lets a long sub-line wrap, so the gust value is never cut off in three columns', async () => {
      await open({ md: true })
      const wind = dialog().querySelectorAll('[data-tile]')[1]
      const sub = wind.lastElementChild
      expect(sub.textContent).toContain('gusts 25')
      expect(sub.classList).not.toContain('truncate')
    })

    it('keeps an empty, non-collapsing sub-line when the hour has no previous reading', async () => {
      await open({ h: 0 })
      const pressure = dialog().querySelectorAll('[data-tile]')[5]
      expect(pressure.lastElementChild.textContent).toBe('\u00a0')
    })

    it('draws the footer divider with a token that shows on the popover in both themes', async () => {
      await open()
      expect(dialog().querySelector('.border-t').classList).toContain('border-input')
    })

    it('uses imperial values in °F, with the heat index in the footer', async () => {
      await open({ unit: 'fahrenheit' })
      const tiles = tileTexts()
      expect(text()).toContain('90°')
      expect(tiles[1]).toBe('Wind 9 mph From NNW · gusts 16')
      expect(tiles[4]).toBe('Visibility 6 mi Clear view')
      expect(tiles[5]).toBe('Pressure 29.88 inHg Falling')
      expect(text()).toContain('Cloud cover 8%')
      expect(text()).toContain('Heat index 91°')
    })

    it('has only cloud cover in the °C footer for the same hour', async () => {
      await open()
      expect(text()).toContain('Cloud cover 8%')
      expect(text()).not.toContain('Heat index')
    })

    it('shows the expected rain amount', async () => {
      await open({ patch: { rain: 60, precipMm: 1.2 } })
      expect(text()).toContain('1.2 mm expected')
    })

    it('says no UV at night', async () => {
      await open({ h: 2 })
      expect(text()).toContain('None at night')
    })

    it('has no close button, and names the dialog by its time label', async () => {
      await open()
      expect(dialog().querySelector('button')).toBeNull()
      const title = document.getElementById(dialog().getAttribute('aria-labelledby'))
      expect(title.textContent).toContain('Today · Now')
    })
  })

  describe('reduced motion', () => {
    it('turns the sheet animations off, which are vaul\u2019s own and not utility classes', () => {
      const css = readFileSync('src/assets/style.css', 'utf8')
      const block = css.slice(css.indexOf('[data-vaul-drawer]'))
      expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\s*\[data-vaul-drawer\]/)
      expect(block).toMatch(/animation: none !important/)
      expect(block).toMatch(/transition: none !important/)
    })

    it('turns the dialog animations off', async () => {
      await open({ md: true })
      expect(dialog().className).toContain('motion-reduce:!animate-none')
    })
  })

  describe('surface', () => {
    it('is a bottom sheet with a drag handle below md', async () => {
      await open()
      expect(dialog().hasAttribute('data-vaul-drawer')).toBe(true)
      expect(dialog().querySelector('[aria-hidden="true"].bg-muted-foreground\\/35')).not.toBeNull()
      expect(dialog().querySelector('.pb-\\[calc\\(24px\\+env\\(safe-area-inset-bottom\\)\\)\\]')).not.toBeNull()
    })

    it('is a centered 480px dialog with the card radius from md', async () => {
      await open({ md: true })
      expect(dialog().hasAttribute('data-vaul-drawer')).toBe(false)
      expect(dialog().className).toContain('max-w-[480px]')
      expect(dialog().className).toContain('rounded-card')
    })
  })

  describe('focus', () => {
    it.each([[false], [true]])('moves focus into the modal (md: %s)', async (md) => {
      await open({ md })
      expect(dialog().contains(document.activeElement)).toBe(true)
    })

    it('returns focus to the card that opened it', async () => {
      await open({ md: true })
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await waitForClose()
      expect(document.activeElement).toBe(opener)
    })
  })

  describe('closing', () => {
    it('does not treat the sheet being mounted closed as a close request', async () => {
      await open()
      expect(closes).toBe(0)
    })

    it('closes on an outside tap on phone, going back once', async () => {
      await open()
      document.querySelector('[data-vaul-overlay]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      await waitForClose()
      await waitForClose()
      expect(closes).toBe(1)
      expect(history.state?.tidyHour).toBeUndefined()
    })

    it('closes on Esc', async () => {
      await open({ md: true })
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await waitForClose()
      expect(closes).toBe(1)
    })

    it('leaves history alone from md', async () => {
      const before = history.length
      await open({ md: true })
      expect(history.length).toBe(before)
      expect(history.state?.tidyHour).toBeUndefined()
    })

    it('pushes a history entry on phone, keeping the router state', async () => {
      history.replaceState({ position: 3 }, '')
      await open()
      expect(history.state).toMatchObject({ position: 3, tidyHour: true })
      history.back()
      await waitForClose()
    })

    it('closes on back navigation, without going back a second time', async () => {
      await open()
      const entries = history.length
      history.back()
      await waitForClose()
      expect(closes).toBe(1)
      expect(history.length).toBe(entries)
      expect(history.state?.tidyHour).toBeUndefined()
    })

    it('goes back when closed by anything other than back navigation', async () => {
      await open()
      expect(history.state?.tidyHour).toBe(true)
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await waitForClose()
      expect(history.state?.tidyHour).toBeUndefined()
      expect(closes).toBe(1)
    })
  })
})
