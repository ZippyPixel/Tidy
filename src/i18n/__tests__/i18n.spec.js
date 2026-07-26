import { describe, it, expect, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import i18n, { currentIntlTag } from '@/i18n'
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

afterEach(() => {
  i18n.global.locale.value = 'en'
  localStorage.clear()
  document.documentElement.lang = 'en'
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
  it('switches i18n locale, persists it and sets the html lang attribute', () => {
    setActivePinia(createPinia())
    const store = useLocaleStore()

    store.setLocale('bn')
    expect(i18n.global.locale.value).toBe('bn')
    expect(localStorage.getItem('tidy-locale')).toBe('bn')
    expect(document.documentElement.lang).toBe('bn')
    expect(currentIntlTag()).toBe('bn-BD')

    store.toggleLocale()
    expect(i18n.global.locale.value).toBe('en')
  })

  it('ignores unsupported locales', () => {
    setActivePinia(createPinia())
    const store = useLocaleStore()
    store.setLocale('fr')
    expect(store.locale).toBe('en')
    expect(i18n.global.locale.value).toBe('en')
  })
})

describe('locale-aware formatting', () => {
  it('formats dates in English by default', () => {
    expect(weatherMixin.methods.formatDate('2026-07-16')).toBe('Thursday, Jul 16')
    expect(weatherMixin.methods.formatTemp(31.2)).toBe('32°')
  })

  it('formats dates and digits in Bangla when the locale is bn', () => {
    i18n.global.locale.value = 'bn'
    expect(weatherMixin.methods.formatDate('2026-07-16')).toContain('বৃহস্পতিবার')
    expect(weatherMixin.methods.formatTemp(31.2)).toBe('৩২°')
    expect(weatherMixin.methods.formatRainChance(80)).toBe('৮০%')
  })
})
