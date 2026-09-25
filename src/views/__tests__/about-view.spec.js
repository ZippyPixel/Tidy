import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import AboutView from '@/views/AboutView.vue'
import AboutCard from '@/components/about/AboutCard.vue'
import i18n from '@/i18n'
import en from '@/i18n/locales/en.json'

function mountAbout() {
  return mount(AboutView, { global: { plugins: [i18n] } })
}

afterEach(() => {
  i18n.global.locale.value = 'en'
})

describe('AboutView', () => {
  it('renders one card per home-screen panel', () => {
    const wrapper = mountAbout()
    const cards = wrapper.findAllComponents(AboutCard)

    expect(cards.length).toBe(Object.keys(en.about.cards).length)
    expect(cards.map((c) => c.props('tone'))).toEqual(['day', 'night', 'overcast', 'haze', 'day'])
    // no two skies of the same family touch
    expect(cards.map((c) => c.props('flip'))).toEqual([false, true, false, true, false])
    wrapper.unmount()
  })

  it('gives every card its own animated illustration', () => {
    const wrapper = mountAbout()
    const sources = wrapper.findAll('img').map((img) => img.attributes('src'))

    expect(sources.length).toBe(5)
    expect(new Set(sources).size).toBe(5)
    sources.forEach((src) => expect(src).toMatch(/\.svg$/))
    wrapper.unmount()
  })

  it('marks the illustrations decorative so the copy carries the meaning', () => {
    const wrapper = mountAbout()
    wrapper.findAll('img').forEach((img) => {
      expect(img.attributes('alt')).toBe('')
      expect(img.attributes('aria-hidden')).toBe('true')
    })
    wrapper.unmount()
  })

  it('translates every heading and body copy', () => {
    const wrapper = mountAbout()
    expect(wrapper.text()).toContain(en.about.cards.now.eyebrow)
    expect(wrapper.text()).toContain(en.about.cards.hours.body)
    expect(wrapper.text()).not.toContain('about.')

    i18n.global.locale.value = 'bn'
    wrapper.unmount()

    const bnWrapper = mountAbout()
    expect(bnWrapper.text()).toContain('সাত দিনের পূর্বাভাস')
    expect(bnWrapper.text()).not.toContain('about.')
    bnWrapper.unmount()
  })

  it('exposes the card titles as headings', () => {
    const wrapper = mountAbout()
    expect(wrapper.findAll('h1').length).toBe(1)
    expect(wrapper.findAll('h2').length).toBe(5)
    wrapper.unmount()
  })
})

describe('AboutCard', () => {
  const base = {
    illustration: '/sky.svg',
    eyebrow: 'Current conditions',
    titleLead: 'Right now,',
    titleTail: 'where you are',
    body: 'Body copy.'
  }

  it('emphasises the lead phrase on light skies and the tail on dark ones', () => {
    const day = mount(AboutCard, { props: { ...base, tone: 'day' } })
    const [dayLead, dayTail] = day.findAll('h2 span')
    expect(dayLead.classes()).toContain('font-semibold')
    expect(dayTail.classes()).toContain('font-light')
    day.unmount()

    const night = mount(AboutCard, { props: { ...base, tone: 'night' } })
    const [nightLead, nightTail] = night.findAll('h2 span')
    expect(nightLead.classes()).toContain('font-light')
    expect(nightTail.classes()).toContain('font-semibold')
    night.unmount()
  })

  it('reveals immediately when IntersectionObserver is unavailable', async () => {
    const wrapper = mount(AboutCard, { props: { ...base, tone: 'day' } })
    await nextTick()
    expect(wrapper.vm.revealed).toBe(true)
    expect(wrapper.classes()).toContain('opacity-100')
    expect(wrapper.classes()).not.toContain('opacity-0')
    wrapper.unmount()
  })

  it('rejects a sky it has no palette for', () => {
    const { validator } = AboutCard.props.tone
    expect(validator('day')).toBe(true)
    expect(validator('sunset')).toBe(false)
  })
})
