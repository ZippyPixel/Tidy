import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

import WearTabs from '@/components/wear/WearTabs.vue'
import { activeI18n } from '@/i18n'

const i18n = activeI18n()

// jsdom has no layout: each tab is as wide as its label (8px a letter, plus 32px padding),
// laid out from the list's 3px padding with 2px gaps
const box = (el) => {
  const tabs = [...el.parentElement.querySelectorAll('[role="tab"]')]
  const w = (t) => t.textContent.trim().length * 8 + 32
  const i = tabs.indexOf(el)
  return { left: 3 + tabs.slice(0, i).reduce((s, t) => s + w(t) + 2, 0), width: w(el) }
}
let observers = []
const saved = {}
beforeAll(() => {
  for (const k of ['offsetLeft', 'offsetWidth'])
    saved[k] = Object.getOwnPropertyDescriptor(HTMLElement.prototype, k)
  Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
    configurable: true,
    get() {
      return this.getAttribute('role') === 'tab' ? box(this).left : 0
    }
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get() {
      return this.getAttribute('role') === 'tab' ? box(this).width : 0
    }
  })
  globalThis.ResizeObserver = class {
    constructor(cb) {
      this.cb = cb
      observers.push(this)
    }
    observe() {}
    disconnect() {
      observers = observers.filter((o) => o !== this)
    }
  }
})
afterAll(() => {
  for (const k in saved) Object.defineProperty(HTMLElement.prototype, k, saved[k])
  delete globalThis.ResizeObserver
})

const TABS = [
  { id: 'now', label: 'Now', sub: 'Next 3 hours' },
  { id: 'today', label: 'Today', sub: '1 PM–10 PM' },
  { id: 'tomorrow', label: 'Tomorrow', sub: '6 AM–10 PM' }
]

async function setup(selected = 'today') {
  const Host = defineComponent({
    components: { WearTabs },
    data: () => ({ sel: selected, labels: TABS }),
    computed: {
      tabs() {
        return this.labels.map((t) => ({ ...t, on: t.id === this.sel }))
      }
    },
    template: '<WearTabs :tabs="tabs" label="When" @pick="sel = $event" />'
  })
  const host = mount(Host, { global: { plugins: [i18n] }, attachTo: document.body })
  await nextTick()
  return host
}

const tabs = (w) => w.findAll('[role="tab"]')
const thumb = (w) => w.find('[data-wear-tab-thumb]')
const thumbBox = (w) => {
  const s = thumb(w).attributes('style')
  return {
    left: Number(s.match(/translateX\(([\d.]+)px\)/)[1]),
    width: parseFloat(s.match(/width: ([\d.]+)px/)[1])
  }
}

describe('WearTabs', () => {
  it('is a tablist with one selected, focusable tab', async () => {
    const w = await setup()
    expect(w.find('[role="tablist"]').attributes('aria-label')).toBe('When')
    expect(tabs(w).map((t) => t.attributes('aria-selected'))).toEqual(['false', 'true', 'false'])
    expect(tabs(w).map((t) => t.attributes('tabindex'))).toEqual(['-1', '0', '-1'])
    w.unmount()
  })

  it('puts the thumb under the active tab, measured from the tab itself', async () => {
    const w = await setup()
    expect(thumb(w).attributes('aria-hidden')).toBe('true')
    expect(thumbBox(w)).toEqual(box(tabs(w)[1].element))
    // the active tab leaves its background to the thumb
    expect(tabs(w)[1].classes()).not.toContain('bg-card')
    w.unmount()
  })

  it('slides with transform on the shared curve, after the first placement', async () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame'] })
    const w = await setup()
    expect(thumb(w).classes()).not.toContain('duration-[420ms]')
    vi.advanceTimersToNextFrame()
    await nextTick()
    expect(thumb(w).classes()).toEqual(
      expect.arrayContaining(['transition-[transform,width]', 'duration-[420ms]', 'ease-tidy'])
    )
    expect(tabs(w)[0].classes()).toEqual(
      expect.arrayContaining(['transition-colors', 'duration-[240ms]'])
    )
    vi.useRealTimers()
    w.unmount()
  })

  it('a click selects the tab and the thumb follows', async () => {
    const w = await setup()
    await tabs(w)[2].trigger('click')
    await nextTick()
    expect(tabs(w)[2].attributes('aria-selected')).toBe('true')
    expect(thumbBox(w)).toEqual(box(tabs(w)[2].element))
    w.unmount()
  })

  it('arrow keys move, select and keep focus, wrapping at the ends', async () => {
    const w = await setup('now')
    tabs(w)[0].element.focus()
    await tabs(w)[0].trigger('keydown', { key: 'ArrowRight' })
    await nextTick()
    await nextTick()
    expect(tabs(w)[1].attributes('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(tabs(w)[1].element)
    await tabs(w)[1].trigger('keydown', { key: 'ArrowLeft' })
    await nextTick()
    await tabs(w)[0].trigger('keydown', { key: 'ArrowLeft' })
    await nextTick()
    await nextTick()
    expect(tabs(w)[2].attributes('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(tabs(w)[2].element)
    w.unmount()
  })

  it('measures again when the labels change language or the list resizes', async () => {
    const w = await setup()
    const before = thumbBox(w)
    // a longer label, as in Bengali
    w.vm.labels = TABS.map((t) => (t.id === 'now' ? { ...t, label: 'এখনকার আবহাওয়া' } : t))
    await nextTick()
    await nextTick()
    expect(thumbBox(w)).toEqual(box(tabs(w)[1].element))
    expect(thumbBox(w).left).toBeGreaterThan(before.left)
    expect(observers).toHaveLength(1)
    observers[0].cb()
    await nextTick()
    expect(thumbBox(w)).toEqual(box(tabs(w)[1].element))
    w.unmount()
    expect(observers).toHaveLength(0)
  })
})
