import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import ShareButton from '@/components/share/ShareButton.vue'
import LocationHeading from '@/components/weather/LocationHeading.vue'
import { activeI18n } from '@/i18n'
import useShareStore from '@/stores/share'
import useWeatherStore from '@/stores/weather'
import fixture from '@/utils/__tests__/fixtures/weatherapi-forecast.json'

const i18n = activeI18n()

function setup(component, props = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const wrapper = mount(component, { props, global: { plugins: [pinia, i18n] } })
  return { wrapper, share: useShareStore() }
}

describe('share entry points', () => {
  it('opens the composer on the moment of where it is', async () => {
    const { wrapper, share } = setup(ShareButton, { variant: 'icon', origin: 'tides' })
    expect(wrapper.attributes('aria-label')).toBe('Share the tide')
    await wrapper.trigger('click')
    expect(share.open).toBe(true)
    expect(share.origin).toBe('tides')
    expect(share.everOpened).toBe(true)
  })

  it('reads "Share", and "Share today" from md', () => {
    const { wrapper } = setup(ShareButton)
    const [phone, wide] = wrapper.findAll('span')
    expect(phone.text()).toBe('Share')
    expect(phone.classes()).toContain('md:hidden')
    expect(wide.text()).toBe('Share today')
    expect(wide.classes()).toContain('md:inline')
  })

  it('sits beside the place name once the weather is in, not on the skeleton', async () => {
    const { wrapper } = setup(LocationHeading)
    expect(wrapper.find('[data-share-button]').exists()).toBe(false)
    await useWeatherStore().setValues(fixture)
    useWeatherStore().awaitingLocation = false
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 350))
    expect(wrapper.find('[data-share-button]').exists()).toBe(true)
  })

  it('falls back to the dashboard for an unknown origin', () => {
    setActivePinia(createPinia())
    const share = useShareStore()
    share.openShare('nowhere')
    expect(share.origin).toBe('dashboard')
  })
})
