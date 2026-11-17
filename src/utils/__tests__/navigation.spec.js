import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { followLocation } from '@/utils/navigation'

const routerAt = (path, query = {}) => ({
  currentRoute: ref({ path, query }),
  push: vi.fn(),
  replace: vi.fn()
})

describe('followLocation', () => {
  it('returns to home from a page without weather', () => {
    const router = routerAt('/about')
    followLocation(router)
    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('stays put on home, and without a router', () => {
    const router = routerAt('/')
    followLocation(router)
    expect(router.push).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
    expect(() => followLocation(undefined)).not.toThrow()
  })

  it('keeps Sun & Moon open on the new location, keeping its time', () => {
    const router = routerAt('/sun-moon', {
      t: '2026-11-24T21:30',
      lat: '69.65',
      lon: '18.96',
      name: 'Troms',
      country: 'Norway',
      tz: 'Europe/Oslo'
    })
    followLocation(router)
    expect(router.push).not.toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith({ query: { t: '2026-11-24T21:30' } })
  })

  it('keeps Tides open on the station nearest the new location, keeping its date', () => {
    const router = routerAt('/tides', { station: 'abc', date: '2026-11-20' })
    followLocation(router)
    expect(router.push).not.toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith({ query: { date: '2026-11-20' } })

    const near = routerAt('/tides', { lat: '1', lon: '2', name: 'X' })
    followLocation(near)
    expect(near.replace).toHaveBeenCalledWith({ query: {} })
  })

  it('leaves a page already on the forecast location alone', () => {
    const router = routerAt('/sun-moon', { t: '2026-11-24T21:30' })
    followLocation(router)
    expect(router.push).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
  })
})
