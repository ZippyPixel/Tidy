import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import WearWardrobe from '@/components/wear/WearWardrobe.vue'
import { activeI18n } from '@/i18n'
import useWearStore from '@/stores/wear'
import { wardrobe } from '@/utils/wear'

const i18n = activeI18n()

function setup() {
  const pinia = createPinia()
  const wrapper = mount(WearWardrobe, { global: { plugins: [pinia, i18n] } })
  return { wrapper, wear: useWearStore(pinia) }
}

const head = (w) => w.find('[data-wear-ward-head]')
const total = (fig) => wardrobe(fig).reduce((n, g) => n + g.items.length, 0)

describe('Your wardrobe', () => {
  beforeEach(() => {
    document.cookie = 'tidy-wear=; max-age=0; path=/'
  })

  it('is closed by default: a button in the h2 that controls the panel', () => {
    const { wrapper } = setup()
    const btn = head(wrapper)
    expect(btn.element.parentElement.tagName).toBe('H2')
    expect(btn.attributes('aria-expanded')).toBe('false')
    const panel = wrapper.find('[data-wear-ward-panel]')
    expect(btn.attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(panel.classes()).toContain('grid-rows-[0fr]')
    // collapsed content is out of the tab order and hidden
    const inner = panel.element.firstElementChild
    expect(inner.hasAttribute('inert')).toBe(true)
    expect(inner.classList).toContain('invisible')
  })

  it('opens and closes, turning the chevron', async () => {
    const { wrapper } = setup()
    await head(wrapper).trigger('click')
    expect(head(wrapper).attributes('aria-expanded')).toBe('true')
    const panel = wrapper.find('[data-wear-ward-panel]')
    expect(panel.classes()).toContain('grid-rows-[1fr]')
    expect(panel.element.firstElementChild.hasAttribute('inert')).toBe(false)
    expect(wrapper.find('[data-wear-ward-chev]').classes()).toContain('rotate-180')
    await head(wrapper).trigger('click')
    expect(head(wrapper).attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[data-wear-ward-chev]').classes()).not.toContain('rotate-180')
  })

  it('animates the height with grid rows on the shared curve', () => {
    const { wrapper } = setup()
    const panel = wrapper.find('[data-wear-ward-panel]').classes()
    expect(panel).toEqual(
      expect.arrayContaining(['transition-[grid-template-rows]', 'duration-[380ms]', 'ease-tidy'])
    )
    expect(wrapper.find('section').classes()).toContain('tidy-motion')
  })

  it('sums up what is on in the header', async () => {
    const { wrapper, wear } = setup()
    const n = total('man')
    expect(wrapper.find('[data-wear-ward-sum]').text()).toBe(`All ${n} on`)
    wear.toggle('jeans')
    wear.toggle('cap')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-wear-ward-sum]').text()).toBe(`${n - 2} of ${n} on`)
  })

  it('chips switch pieces off and on, grouped with a count', async () => {
    const { wrapper, wear } = setup()
    await head(wrapper).trigger('click')
    const groups = wrapper.findAll('[data-wear-ward-group]')
    expect(groups.map((g) => g.find('span').text())).toEqual([
      'Tops',
      'Bottoms',
      'Layers',
      'Shoes',
      'Extras'
    ])
    const chip = wrapper.find('[data-wear-chip="jeans"]')
    expect(chip.attributes('aria-pressed')).toBe('true')
    await chip.trigger('click')
    expect(wear.exclude).toEqual(['jeans'])
    expect(wrapper.find('[data-wear-chip="jeans"]').attributes('aria-pressed')).toBe('false')
    const bottoms = wardrobe('man').find((g) => g.id === 'bottoms').items.length
    expect(groups[1].text()).toContain(`${bottoms - 1} of ${bottoms}`)
    expect(wrapper.text()).toContain('1 switched off')
    await wrapper.find('[data-wear-ward-all]').trigger('click')
    expect(wear.exclude).toEqual([])
    expect(wrapper.find('[data-wear-ward-all]').exists()).toBe(false)
  })

  it('lists the pieces of the chosen figure', async () => {
    const { wrapper, wear } = setup()
    expect(wrapper.find('[data-wear-chip="dupatta"]').exists()).toBe(false)
    wear.set('figure', 'woman')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-wear-chip="dupatta"]').exists()).toBe(true)
    expect(wrapper.find('[data-wear-ward-sum]').text()).toBe(`All ${total('woman')} on`)
  })

  it('starts closed again on the next visit', async () => {
    const first = setup()
    await head(first.wrapper).trigger('click')
    first.wrapper.unmount()
    expect(document.cookie).not.toContain('open')
    expect(head(setup().wrapper).attributes('aria-expanded')).toBe('false')
  })
})
