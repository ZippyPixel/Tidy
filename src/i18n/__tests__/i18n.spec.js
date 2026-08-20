import { describe, it, expect, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { activeI18n, currentIntlTag, LOCALE_COOKIE_KEY } from '@/i18n'
import en from '@/i18n/locales/en.json'
import bn from '@/i18n/locales/bn.json'
import useLocaleStore from '@/stores/locale'
import weatherMixin from '@/mixins/weatherMixin'

function keyPaths(messages, prefix = '') {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? keyPaths(value, `${prefix}${key}.`)
      : [`${prefix}${key}`]
  )
}

function readCookie(name) {
  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
    ?.split('=')[1]
}

afterEach(() => {
  activeI18n().global.locale.value = 'en'
  document.cookie = `${LOCALE_COOKIE_KEY}=; path=/; max-age=0`
})

describe('locale messages', () => {
  it('en and bn cover exactly the same keys', () => {
    expect(keyPaths(bn).sort()).toEqual(keyPaths(en).sort())
  })

  it('has no empty translations', () => {
    for (const messages of [en, bn]) {
      keyPaths(messages).forEach((path) => {
        const value = path.split('.').reduce((node, key) => node[key], messages)
        expect(value, `empty message for ${path}`).not.toBe('')
      })
    }
  })
})

describe('locale store', () => {
  it('switches i18n locale and persists it to a cookie', () => {
    setActivePinia(createPinia())
    const store = useLocaleStore()

    store.setLocale('bn')
    expect(store.locale).toBe('bn')
    expect(activeI18n().global.locale.value).toBe('bn')
    // a cookie, not localStorage, so the server can read it and render bn on first paint
    expect(readCookie(LOCALE_COOKIE_KEY)).toBe('bn')
    expect(currentIntlTag()).toBe('bn-BD')

    store.toggleLocale()
    expect(activeI18n().global.locale.value).toBe('en')
  })

  it('ignores unsupported locales', () => {
    setActivePinia(createPinia())
    const store = useLocaleStore()
    store.setLocale('fr')
    expect(store.locale).toBe('en')
    expect(activeI18n().global.locale.value).toBe('en')
  })
})

describe('locale-aware formatting', () => {
  it('formats dates in English by default', () => {
    expect(weatherMixin.methods.formatDate('2026-07-16')).toBe('Thursday, Jul 16')
    expect(weatherMixin.methods.formatTemp(31.2)).toBe('32°')
  })

  it('formats dates and digits in Bangla when the locale is bn', () => {
    activeI18n().global.locale.value = 'bn'
    expect(weatherMixin.methods.formatDate('2026-07-16')).toContain('বৃহস্পতিবার')
    expect(weatherMixin.methods.formatTemp(31.2)).toBe('৩২°')
    expect(weatherMixin.methods.formatRainChance(80)).toBe('৮০%')
  })
})
