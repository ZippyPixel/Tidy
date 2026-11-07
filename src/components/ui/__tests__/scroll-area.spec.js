import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ScrollArea } from '@/components/ui/scroll-area'

const css = readFileSync(resolve(process.cwd(), 'src/assets/style.css'), 'utf8')

let wrapper

function setup(props) {
  wrapper = mount(ScrollArea, {
    attachTo: document.body,
    props,
    attrs: { 'aria-label': 'List' },
    slots: { default: '<p>content</p>' }
  })
  return wrapper
}

const viewport = () => wrapper.find('[data-reka-scroll-area-viewport]')

function size(element, { scrollTop = 0, scrollHeight = 1000, clientHeight = 200 }) {
  Object.defineProperties(element, {
    scrollTop: { value: scrollTop, configurable: true },
    scrollHeight: { value: scrollHeight, configurable: true },
    clientHeight: { value: clientHeight, configurable: true }
  })
}

// the bar only mounts once the content overflows and the pointer is over the area
async function showBar() {
  size(viewport().element, {})
  Object.defineProperty(viewport().element, 'offsetHeight', { value: 200, configurable: true })
  wrapper.element.dispatchEvent(new Event('pointerenter'))
  await flushPromises()
  await vi.advanceTimersByTimeAsync(20)
  await flushPromises()
  return wrapper.find('[data-scrollbarimpl]')
}

describe('ScrollArea', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('keeps native scrolling in a focusable, contained viewport', () => {
    setup()
    const classes = viewport().classes()
    expect(viewport().attributes('tabindex')).toBe('0')
    expect(classes).toContain('overscroll-contain')
    expect(classes).toContain('focus-visible:outline-2')
    expect(classes).toContain('outline-ring')
    expect(classes).toContain('[outline-offset:-2px]')
    expect(viewport().text()).toBe('content')
  })

  it('passes attributes and classes to the root', () => {
    setup({ class: 'flex-1' })
    expect(wrapper.attributes('aria-label')).toBe('List')
    expect(wrapper.classes()).toContain('flex-1')
  })

  it('reports how far it has scrolled, for the thumb', async () => {
    setup()
    size(viewport().element, { scrollTop: 400 })
    await viewport().trigger('scroll')
    expect(wrapper.element.style.getPropertyValue('--scroll-progress')).toBe('0.5')
  })

  it('keeps the progress in range when the content overscrolls or fits', async () => {
    setup()
    size(viewport().element, { scrollTop: -50 })
    await viewport().trigger('scroll')
    expect(wrapper.element.style.getPropertyValue('--scroll-progress')).toBe('0')
    size(viewport().element, { scrollTop: 900 })
    await viewport().trigger('scroll')
    expect(wrapper.element.style.getPropertyValue('--scroll-progress')).toBe('1')
    size(viewport().element, { scrollHeight: 200 })
    await viewport().trigger('scroll')
    expect(wrapper.element.style.getPropertyValue('--scroll-progress')).toBe('0')
  })

  it('shows the Tidy bar on hover, and hides it 600ms after the pointer leaves', async () => {
    setup()
    const bar = await showBar()
    expect(bar.exists()).toBe(true)
    expect(bar.attributes('data-state')).toBe('visible')
    expect(bar.classes()).toEqual(expect.arrayContaining(['w-3', 'px-[3px]', 'hover:px-0.5', 'active:px-0.5', '!top-1', '!bottom-1', '!right-0.5', 'rounded-full']))

    wrapper.element.dispatchEvent(new Event('pointerleave'))
    await vi.advanceTimersByTimeAsync(590)
    await flushPromises()
    expect(wrapper.find('[data-scrollbarimpl]').exists()).toBe(true)
    await vi.advanceTimersByTimeAsync(20)
    await flushPromises()
    expect(wrapper.find('[data-scrollbarimpl]').exists()).toBe(false)
  })

  it('fades with an animation, which reka-ui waits for, and not under reduced motion', async () => {
    setup()
    const bar = await showBar()
    expect(bar.classes()).toEqual(
      expect.arrayContaining(['data-[state=visible]:animate-in', 'data-[state=hidden]:animate-out', '[animation-duration:150ms]', 'motion-reduce:!animate-none'])
    )
  })

  it('keeps the thumb at 32px or longer, inside the track', async () => {
    setup()
    const bar = await showBar()
    const thumb = bar.element.firstElementChild
    expect(thumb.className).toContain('min-h-8')
    expect(thumb.className).toContain('var(--scroll-progress')
  })
})

describe('Scrollbar styles', () => {
  it.each(['--scrollbar-thumb', '--scrollbar-thumb-hover', '--scrollbar-thumb-active', '--scrollbar-track'])('defines %s for light and dark', (token) => {
    expect(css.match(new RegExp(`${token}: [^;]+;`, 'g'))).toHaveLength(2)
  })

  it('has the .tidy-scrollbar utility', () => {
    expect(css).toContain('.tidy-scrollbar {')
    expect(css).toContain('.tidy-scrollbar::-webkit-scrollbar-thumb:hover {')
  })
})
