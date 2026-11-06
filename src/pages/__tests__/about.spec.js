import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import AboutPage from '@/pages/about.vue'
import AboutCard from '@/components/about/AboutCard.vue'
import { activeI18n } from '@/i18n'
import en from '@/i18n/locales/en.json'
import bn from '@/i18n/locales/bn.json'

const i18n = activeI18n()

function mountAbout() {
  return mount(AboutPage, { global: { plugins: [i18n] } })
}

afterEach(() => {
  i18n.global.locale.value = 'en'
})

describe('About page', () => {
  it('has one card per dashboard panel, in phone order', () => {
    const wrapper = mountAbout()
    const cards = wrapper.findAllComponents(AboutCard)
    expect(cards.map((c) => c.props('eyebrow'))).toEqual([
      'Current conditions',
      'Hourly',
      'Three-day forecast',
      'Sun & moon',
      'Air & UV'
    ])
    expect(cards.length).toBe(Object.keys(en.about.cards).length)
    wrapper.unmount()
  })

  it('gives every card its own decorative illustration', () => {
    const wrapper = mountAbout()
    const imgs = wrapper.findAll('img')
    expect(imgs).toHaveLength(5)
    expect(new Set(imgs.map((i) => i.attributes('src'))).size).toBe(5)
    imgs.forEach((img) => {
      expect(img.attributes('alt')).toBe('')
      expect(img.attributes('aria-hidden')).toBe('true')
    })
    wrapper.unmount()
  })

  it('puts the sun glow behind sunny skies only', () => {
    const wrapper = mountAbout()
    expect(wrapper.findAllComponents(AboutCard).map((c) => c.props('glow'))).toEqual([true, true, false, false, true])
    wrapper.unmount()
  })

  it('has one h1 and an h2 per card', () => {
    const wrapper = mountAbout()
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.findAll('h2')).toHaveLength(5)
    expect(wrapper.find('h1').text()).toContain('Everything about today,')
    wrapper.unmount()
  })

  it('describes the V3 dashboard, not the old one', () => {
    const text = mountAbout().text()
    expect(text).not.toMatch(/seven|week ahead/i)
    expect(text).toContain('Three-day forecast')
  })

  it('renders in Bangla with no missing keys', async () => {
    const wrapper = mountAbout()
    i18n.global.locale.value = 'bn'
    await nextTick()
    expect(wrapper.text()).toContain(bn.about.cards.week.eyebrow)
    expect(wrapper.text()).not.toContain('about.')
    wrapper.unmount()
  })
})

describe('AboutCard', () => {
  const props = {
    illustration: '/sky.svg',
    eyebrow: 'Current conditions',
    titleLead: 'Right now,',
    titleTail: 'where you are',
    body: 'Body copy.'
  }

  it('sets the tail of the title in light, muted type', () => {
    const wrapper = mount(AboutCard, { props })
    const tail = wrapper.find('h2 span')
    expect(tail.text()).toBe('where you are')
    expect(tail.classes()).toEqual(expect.arrayContaining(['font-light', 'text-muted-foreground']))
  })

  it('uses the token gradient card and stacks on phones', () => {
    const wrapper = mount(AboutCard, { props })
    const cls = wrapper.classes()
    expect(cls).toContain('border')
    expect(cls).toContain('md:grid-cols-[260px_minmax(0,1fr)]')
    expect(cls.some((c) => c.includes('hsl(var(--card))') && c.includes('hsl(var(--accent))'))).toBe(true)
  })

  it('is visible without IntersectionObserver (and never hidden before mount)', async () => {
    const wrapper = mount(AboutCard, { props })
    await nextTick()
    expect(wrapper.vm.revealed).toBe(true)
    expect(wrapper.classes()).not.toContain('is-pending')
  })
})
