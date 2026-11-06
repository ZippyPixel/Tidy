import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { DialogTitle } from 'reka-ui'
import { h } from 'vue'

import DetailModalShell from '@/components/common/DetailModalShell.vue'

const realMatchMedia = window.matchMedia
const dialog = () => document.querySelector('[role="dialog"]')

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

async function mountShell({ md = true, ...props } = {}) {
  setWidth(md)
  wrapper = mount(DetailModalShell, {
    attachTo: document.body,
    props: { value: null, ...props },
    slots: { default: ({ value }) => h(DialogTitle, () => `shown: ${value}`) }
  })
  await flushPromises()
  await wrapper.setProps({ value: 'wind' })
  await flushPromises()
}

describe('DetailModalShell', () => {
  beforeEach(() => history.replaceState(null, ''))

  afterEach(() => {
    wrapper?.unmount()
    window.matchMedia = realMatchMedia
  })

  it('applies the requested width from md', async () => {
    await mountShell({ maxWidthClass: 'max-w-[520px]' })
    expect(dialog().className).toContain('max-w-[520px]')
  })

  it('passes the value to its slot', async () => {
    await mountShell()
    expect(dialog().textContent).toContain('shown: wind')
  })

  it('keeps the last value on screen while closing', async () => {
    await mountShell()
    await wrapper.setProps({ value: null })
    expect(wrapper.vm.shown).toBe('wind')
  })

  it('marks its history entry with the given key on phone', async () => {
    await mountShell({ md: false, historyKey: 'tidyDetail' })
    expect(history.state?.tidyDetail).toBe(true)
    history.back()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(history.state?.tidyDetail).toBeUndefined()
  })

  it('has no close button', async () => {
    await mountShell()
    expect(dialog().querySelector('button')).toBeNull()
  })
})
