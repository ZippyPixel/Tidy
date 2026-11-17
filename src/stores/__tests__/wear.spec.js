import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import useWearStore from '@/stores/wear'
import { formatWearCookie, parseWearCookie } from '@/utils/preferences'

describe('wear settings cookie', () => {
  it('round-trips', () => {
    const prefs = { figure: 'woman', feel: -1, coverage: true, skirts: false }
    expect(parseWearCookie(formatWearCookie(prefs))).toEqual(prefs)
  })

  it('falls back to the defaults for anything it cannot read', () => {
    expect(parseWearCookie(undefined)).toEqual({
      figure: 'man',
      feel: 0,
      coverage: false,
      skirts: true
    })
    expect(parseWearCookie('alien|7|x').feel).toBe(0)
  })
})

describe('wear store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.cookie = 'tidy-wear=; max-age=0; path=/'
  })

  it('saves a change to the cookie', () => {
    const wear = useWearStore()
    wear.set('figure', 'woman')
    wear.set('feel', 1)
    expect(wear.prefs).toEqual({ figure: 'woman', feel: 1, coverage: false, skirts: true })
    expect(document.cookie).toContain('tidy-wear=woman%7C1%7C0%7C1')
  })

  it('ignores unknown keys', () => {
    const wear = useWearStore()
    wear.set('colour', 'red')
    expect(wear.colour).toBeUndefined()
  })
})
