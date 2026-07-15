import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))
}

// jsdom has no SVG layout engine; unovis axis rendering needs these
if (!SVGElement.prototype.getBBox) {
  SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 0, height: 0 })
}
if (!SVGElement.prototype.getComputedTextLength) {
  SVGElement.prototype.getComputedTextLength = () => 0
}

import { AreaChart } from '@/components/ui/chart-area'
import DailyChart from '@/components/weather/DailyChart.vue'
import useWeatherStore from '@/stores/weather'

const sampleData = [
  { hour: '12 AM', temperature: 21 },
  { hour: '1 AM', temperature: 20 },
  { hour: '2 AM', temperature: 24 }
]

describe('AreaChart', () => {
  it('mounts and renders the unovis container with gradient defs', () => {
    const wrapper = mount(AreaChart, {
      props: {
        data: sampleData,
        categories: ['temperature'],
        index: 'hour',
        showLegend: false,
        showGridLine: false
      }
    })
    expect(wrapper.find('.unovis-xy-container').exists()).toBe(true)
    expect(wrapper.find('linearGradient').exists()).toBe(true)
    expect(wrapper.find('linearGradient stop').attributes('stop-opacity')).toBe('0.4')
  })

  it('uses the default theme colors when none are passed', () => {
    const wrapper = mount(AreaChart, {
      props: { data: sampleData, categories: ['temperature'], index: 'hour' }
    })
    expect(wrapper.find('linearGradient stop').attributes('stop-color')).toContain(
      '--vis-primary-color'
    )
  })
})

describe('DailyChart', () => {
  it('renders the area chart from store data', async () => {
    const pinia = createPinia()
    const wrapper = mount(DailyChart, { global: { plugins: [pinia] } })
    const store = useWeatherStore(pinia)
    store.date = '2026-07-15'
    store.dailySummary = {
      '2026-07-15': {
        hours: ['12 AM', '1 AM'],
        tempDataC: [21, 20],
        tempDataF: [69.8, 68]
      }
    }
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Daily Summary')
    expect(wrapper.find('.unovis-xy-container').exists()).toBe(true)
  })
})
