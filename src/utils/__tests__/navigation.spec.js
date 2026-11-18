import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { followLocation } from '@/utils/navigation'

const routerAt = (path, query = {}) => ({
  currentRoute: ref({ path, query }),
  push: vi.fn(),
  replace: vi.fn()
})

describe('followLocation', () => {
  it('never leaves the page: What to wear and About stay open', () => {
    for (const path of ['/wear', '/about']) {
      const router = routerAt(path)
      followLocation(router)
      expect(router.push).not.toHaveBeenCalled()
      expect(router.replace).not.toHaveBeenCalled()
    }
  })

  it('stays put on home, and without a router', () => {
    const router = routerAt('/')
    followLocation(router)
    expect(router.push).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
    expect(() => followLocation(undefined)).not.toThrow()
  })

  it('drops a share link from home, keeping anything else', () => {
    const router = routerAt('/', {
      lat: '23.82',
      lon: '90.42',
      tz: 'Asia/Dhaka',
      d: '2026-11-06',
      from: 'share',
      m: 'today',
      x: '1'
    })
    followLocation(router)
    expect(router.replace).toHaveBeenCalledWith({ query: { x: '1' } })
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
