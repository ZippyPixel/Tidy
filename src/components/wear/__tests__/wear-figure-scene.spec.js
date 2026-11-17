import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import WearFigure from '@/components/wear/WearFigure.vue'
import WearScene from '@/components/wear/WearScene.vue'

describe('WearFigure', () => {
  it('is decorative unless it has a label', () => {
    const plain = mount(WearFigure)
    expect(plain.attributes('aria-hidden')).toBe('true')
    expect(plain.attributes('role')).toBeUndefined()
    const named = mount(WearFigure, { props: { label: 'Mannequin wearing a coat' } })
    expect(named.attributes('role')).toBe('img')
    expect(named.attributes('aria-label')).toBe('Mannequin wearing a coat')
  })

  it('draws the outfit, with a ground shadow', () => {
    const w = mount(WearFigure, {
      props: {
        outfit: { top: 'sweater', bottom: 'trousers', outer: 'coat', feet: 'boots', tone: 'dark' }
      }
    })
    expect(w.findAll('path').length).toBeGreaterThan(10)
    expect(w.find('ellipse').exists()).toBe(true)
  })

  it('crops to one slot for a thumbnail', () => {
    const w = mount(WearFigure, {
      props: { outfit: { top: 'tee', feet: 'boots' }, only: 'feet', crop: 'slot' }
    })
    expect(w.attributes('viewBox')).toBe('66 350 108 108')
    expect(w.find('ellipse').exists()).toBe(false)
  })
})

describe('WearScene', () => {
  it('paints the sky of the time of day and keeps the road at the bottom', () => {
    const w = mount(WearScene, { props: { tod: 'night' } })
    expect(w.attributes('style')).toContain('rgb(26, 33, 69)') // night sky #1A2145
    expect(w.find('svg').attributes('preserveAspectRatio')).toBe('xMidYMax slice')
    expect(w.attributes('aria-hidden')).toBe('true')
  })
})
