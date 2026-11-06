import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { showWeather } from '@/utils/navigation'

const routerAt = (path) => ({ currentRoute: ref({ path }), push: vi.fn() })

describe('showWeather', () => {
  it('returns to home from another page', () => {
    const router = routerAt('/about')
    showWeather(router)
    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('stays put on home, and without a router', () => {
    const router = routerAt('/')
    showWeather(router)
    expect(router.push).not.toHaveBeenCalled()
    expect(() => showWeather(undefined)).not.toThrow()
  })
})
