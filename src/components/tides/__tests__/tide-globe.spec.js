import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TideGlobe from '@/components/tides/TideGlobe.vue'
import { activeI18n } from '@/i18n'

let wrapper
let frames

function setup() {
  wrapper = mount(TideGlobe, {
    attachTo: document.body,
    props: { stations: [], home: { lon: 90, lat: 23 } },
    global: { plugins: [activeI18n()] }
  })
  return wrapper
}

// a real event, so that defaultPrevented reflects what the browser would see
function wheel(init, selector = '[data-globe]') {
  const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init })
  wrapper.find(selector).element.dispatchEvent(event)
  return event
}

describe('TideGlobe wheel zoom', () => {
  beforeEach(() => {
    frames = []
    vi.stubGlobal('requestAnimationFrame', (callback) => frames.push(callback))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    HTMLCanvasElement.prototype.getContext = () => null
    setup()
    // run the frame mounting asked for, with nothing left to animate
    wrapper.vm.spinning = false
    frames.shift()()
  })

  afterEach(() => {
    wrapper.unmount()
    vi.unstubAllGlobals()
  })

  it('zooms in on a scroll up and out on a scroll down', () => {
    wrapper.vm.view.zoom = 2
    wheel({ deltaY: -100 })
    expect(wrapper.vm.view.zoom).toBeCloseTo(2 * Math.exp(0.2))
    wheel({ deltaY: 100 })
    expect(wrapper.vm.view.zoom).toBeCloseTo(2)
  })

  it('clamps at 5×', () => {
    for (let i = 0; i < 40; i++) wheel({ deltaY: -500 })
    expect(wrapper.vm.view.zoom).toBe(5)
  })

  it('clamps at 1×', () => {
    wrapper.vm.view.zoom = 3
    for (let i = 0; i < 40; i++) wheel({ deltaY: 500 })
    expect(wrapper.vm.view.zoom).toBe(1)
  })

  it('always calls preventDefault, also at the limits, for a pinch and over the controls', () => {
    expect(wheel({ deltaY: 100 }).defaultPrevented).toBe(true)
    wrapper.vm.view.zoom = 5
    expect(wheel({ deltaY: -100 }).defaultPrevented).toBe(true)
    expect(wheel({ deltaY: 10, ctrlKey: true }).defaultPrevented).toBe(true)
    expect(wheel({ deltaY: 0 }).defaultPrevented).toBe(true)
    expect(wheel({ deltaY: 10 }, 'canvas').defaultPrevented).toBe(true)
    expect(wheel({ deltaY: 10 }, '[data-zoom-in]').defaultPrevented).toBe(true)
  })

  it('zooms faster for a pinch', () => {
    wrapper.vm.view.zoom = 2
    wheel({ deltaY: -10, ctrlKey: true })
    expect(wrapper.vm.view.zoom).toBeCloseTo(2 * Math.exp(0.1))
  })

  it('reads line and page deltas as pixels', () => {
    wrapper.vm.view.zoom = 2
    wheel({ deltaY: -3, deltaMode: 1 })
    expect(wrapper.vm.view.zoom).toBeCloseTo(2 * Math.exp(3 * 16 * 0.002))
    wrapper.vm.view.zoom = 2
    wheel({ deltaY: -1, deltaMode: 2 })
    expect(wrapper.vm.view.zoom).toBeCloseTo(2 * Math.exp(400 * 0.002))
  })

  it('stops the spin and cancels a fly-to', async () => {
    await wrapper.setData({ spinning: true })
    wrapper.vm.reducedMotion = false
    wrapper.vm.flyTo(10, 10, 3)
    expect(wrapper.vm.fly).not.toBeNull()
    wheel({ deltaY: -100 })
    expect(wrapper.vm.spinning).toBe(false)
    expect(wrapper.vm.fly).toBeNull()
  })

  it('redraws once per frame, however many events arrive', () => {
    const draw = vi.spyOn(wrapper.vm.$.ctx, 'draw')
    wheel({ deltaY: -10 })
    wheel({ deltaY: -10 })
    wheel({ deltaY: -10 })
    expect(draw).not.toHaveBeenCalled()
    expect(frames).toHaveLength(1)
    frames.shift()()
    expect(draw).toHaveBeenCalledTimes(1)
    expect(frames).toHaveLength(0)
  })
})
