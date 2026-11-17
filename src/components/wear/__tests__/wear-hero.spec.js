import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

import WearHero from '@/components/wear/WearHero.vue'
import { activeI18n } from '@/i18n'
import { wearText, windows } from '@/utils/wear'
import { buildLooks } from '@/utils/wearLooks'
import { forecast, NOW } from './fixtures'

const i18n = activeI18n()
const t = i18n.global.t
const text = (m) => wearText(t, m)

// a dry, warm afternoon: several everyday outfits fit
const win = windows(
  forecast({ feelslike_c: 28, chance_of_rain: 0, precip_mm: 0, wind_kph: 8, gust_kph: 10 }),
  NOW / 1000
).find((w) => w.id === 'today')
const looks = buildLooks(win.summary, {})

function setup({ look = 0, ...props } = {}) {
  // a parent with v-model:look, like the page
  const Host = defineComponent({
    components: { WearHero },
    data: () => ({ look }),
    template: '<WearHero v-model:look="look" v-bind="rest" />',
    computed: { rest: () => ({ win, looks, text, ...props }) }
  })
  const host = mount(Host, { global: { plugins: [i18n] }, attachTo: document.body })
  const w = host.findComponent(WearHero)
  w.look = () => host.vm.look
  w.unmount = () => host.unmount()
  return w
}

const dots = (w) => w.findAll('[data-wear-dot]')
const headline = (w) => w.find('[data-wear-hero-headline]').text()
// jsdom has no PointerEvent: a MouseEvent with the pointer fields added
const pointer = (w, type, x, y, pointerType = 'touch') => {
  const e = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true })
  Object.defineProperties(e, {
    pointerId: { value: 1 },
    pointerType: { value: pointerType }
  })
  w.find('[data-wear-hero]').element.dispatchEvent(e)
  return nextTick()
}

describe('WearHero looks', () => {
  it('has three looks to choose from', () => {
    expect(looks).toHaveLength(3)
  })

  it('shows a dot per look on the road band, the first one current', () => {
    const w = setup()
    const d = dots(w)
    expect(d.map((b) => b.attributes('aria-label'))).toEqual([
      'Look 1 of 3',
      'Look 2 of 3',
      'Look 3 of 3'
    ])
    expect(d.map((b) => b.attributes('aria-current'))).toEqual(['true', undefined, undefined])
    expect(w.find('[role="group"]').attributes('aria-label')).toBe('Outfits for this weather')
    w.unmount()
  })

  it('no dots when only one outfit fits', () => {
    const w = setup({ looks: looks.slice(0, 1) })
    expect(dots(w)).toHaveLength(0)
    expect(w.find('[data-wear-live]').text()).toBe(text(looks[0].rec.headline))
    w.unmount()
  })

  it('a dot switches the look, and the live region reads it', async () => {
    const w = setup()
    await dots(w)[2].trigger('click')
    expect(w.look()).toBe(2)
    expect(dots(w)[2].attributes('aria-current')).toBe('true')
    expect(headline(w)).toBe(text(looks[2].rec.headline))
    expect(w.find('[data-wear-live]').text()).toBe(`Look 3 of 3. ${text(looks[2].rec.headline)}`)
    w.unmount()
  })

  it('hides the other looks from assistive tech', async () => {
    const w = setup({ look: 1 })
    const figs = w.findAll('[data-wear-look]')
    expect(figs.map((f) => f.attributes('aria-hidden'))).toEqual(['true', undefined, 'true'])
    expect(figs[1].find('svg').attributes('aria-label')).toMatch(/^Mannequin wearing /)
    w.unmount()
  })

  it('arrow keys, Home and End move between dots and keep focus', async () => {
    const w = setup()
    const group = w.find('[role="group"]')
    await dots(w)[0].element.focus()
    await group.trigger('keydown', { key: 'ArrowRight' })
    await w.vm.$nextTick()
    expect(w.look()).toBe(1)
    expect(document.activeElement).toBe(dots(w)[1].element)
    await group.trigger('keydown', { key: 'End' })
    await w.vm.$nextTick()
    expect(w.look()).toBe(2)
    expect(document.activeElement).toBe(dots(w)[2].element)
    await group.trigger('keydown', { key: 'ArrowRight' })
    expect(w.look()).toBe(2)
    await group.trigger('keydown', { key: 'Home' })
    await w.vm.$nextTick()
    expect(w.look()).toBe(0)
    expect(document.activeElement).toBe(dots(w)[0].element)
    w.unmount()
  })

  it('the hero lets the page scroll vertically', () => {
    const w = setup()
    expect(w.find('[data-wear-hero]').classes()).toContain('touch-pan-y')
    w.unmount()
  })

  it('a touch swipe past 48px commits to the next look', async () => {
    const w = setup()
    await pointer(w, 'pointerdown', 200, 300)
    await pointer(w, 'pointermove', 170, 302)
    // the character follows the finger while the swipe is live
    expect(w.findAll('[data-wear-look]')[0].attributes('style')).toContain('transition: none')
    await pointer(w, 'pointermove', 140, 303)
    await pointer(w, 'pointerup', 140, 303)
    expect(w.look()).toBe(1)
    w.unmount()
  })

  it('a short swipe springs back', async () => {
    const w = setup({ look: 1 })
    await pointer(w, 'pointerdown', 200, 300)
    await pointer(w, 'pointermove', 230, 300)
    await pointer(w, 'pointerup', 240, 300)
    expect(w.look()).toBe(1)
    expect(w.findAll('[data-wear-look]')[1].attributes('style')).not.toContain('transition: none')
    w.unmount()
  })

  it('ignores the mouse and vertical drags', async () => {
    const w = setup()
    await pointer(w, 'pointerdown', 200, 300, 'mouse')
    await pointer(w, 'pointermove', 100, 300, 'mouse')
    await pointer(w, 'pointerup', 100, 300, 'mouse')
    expect(w.look()).toBe(0)
    await pointer(w, 'pointerdown', 200, 300)
    await pointer(w, 'pointermove', 190, 340)
    await pointer(w, 'pointermove', 100, 340)
    await pointer(w, 'pointerup', 100, 340)
    expect(w.look()).toBe(0)
    w.unmount()
  })

  it('stops at the last look, and a cancelled swipe goes back', async () => {
    const w = setup({ look: 2 })
    await pointer(w, 'pointerdown', 200, 300)
    await pointer(w, 'pointermove', 60, 300)
    await pointer(w, 'pointerup', 60, 300)
    expect(w.look()).toBe(2)
    await pointer(w, 'pointerdown', 200, 300)
    await pointer(w, 'pointermove', 260, 300)
    await pointer(w, 'pointercancel', 260, 300)
    expect(w.look()).toBe(2)
    expect(w.findAll('[data-wear-look]')[2].attributes('style')).not.toContain('transition: none')
    w.unmount()
  })
})
