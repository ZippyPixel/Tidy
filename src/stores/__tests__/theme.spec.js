import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import useThemeStore, { THEME_TRANSITION_CLASS, THEME_TRANSITION_MS } from '@/stores/theme'

// vitest.config sets root to the project, so cwd is stable for reading the stylesheet
const css = readFileSync(resolve(process.cwd(), 'src/assets/style.css'), 'utf8')
// comments mention the forbidden pattern by name; only check real rules
const rules = css.replace(/\/\*[\s\S]*?\*\//g, '')

describe('theme store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    document.documentElement.className = ''
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('toggles isDark and persists the choice in a cookie', () => {
    const store = useThemeStore()
    store.toggleTheme()
    expect(store.isDark).toBe(true)
    expect(document.cookie).toContain('tidy-theme=dark')
    store.toggleTheme()
    expect(store.isDark).toBe(false)
    expect(document.cookie).toContain('tidy-theme=light')
  })

  it('adds the transition class for THEME_TRANSITION_MS, then removes it', () => {
    const store = useThemeStore()
    const root = document.documentElement
    store.toggleTheme()
    expect(root.classList.contains(THEME_TRANSITION_CLASS)).toBe(true)
    vi.advanceTimersByTime(THEME_TRANSITION_MS - 1)
    expect(root.classList.contains(THEME_TRANSITION_CLASS)).toBe(true)
    vi.advanceTimersByTime(1)
    expect(root.classList.contains(THEME_TRANSITION_CLASS)).toBe(false)
  })

  it('restarts the window when toggled again mid-transition', () => {
    const store = useThemeStore()
    const root = document.documentElement
    store.toggleTheme()
    vi.advanceTimersByTime(THEME_TRANSITION_MS - 50)
    store.toggleTheme()
    vi.advanceTimersByTime(100)
    expect(root.classList.contains(THEME_TRANSITION_CLASS)).toBe(true)
    vi.advanceTimersByTime(THEME_TRANSITION_MS)
    expect(root.classList.contains(THEME_TRANSITION_CLASS)).toBe(false)
  })

  it('does not touch the transition class on initial theme', () => {
    useThemeStore().setInitialTheme(true)
    expect(document.documentElement.classList.contains(THEME_TRANSITION_CLASS)).toBe(false)
  })
})

describe('theme transition CSS', () => {
  it('has no global * transition rule', () => {
    // rules that set a transition on a selector starting with a bare `*`
    const offenders = rules
      .split('}')
      .filter((block) => /\btransition(-[a-z]+)?\s*:/.test(block))
      .map((block) => block.slice(0, block.indexOf('{')).trim())
      .filter((selector) => selector.split(',').some((s) => /^\*/.test(s.trim())))
    expect(offenders).toEqual([])
  })

  it('drives every element from one duration and easing while the class is on', () => {
    const block = rules.match(/\.theme-transition,[^{]*\{([^}]*)\}/)
    expect(block).not.toBeNull()
    expect(block[0]).toContain('.theme-transition *')
    expect(block[1]).toMatch(/transition-duration:\s*var\(--theme-transition-duration\)\s*!important/)
    expect(block[1]).toMatch(/transition-timing-function:\s*var\(--theme-transition-ease\)\s*!important/)
  })

  it('keeps the CSS duration within THEME_TRANSITION_MS', () => {
    const ms = Number(rules.match(/--theme-transition-duration:\s*(\d+)ms/)[1])
    expect(ms).toBeLessThanOrEqual(THEME_TRANSITION_MS)
  })
})
