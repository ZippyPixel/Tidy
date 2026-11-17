import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import useWearStore from '@/stores/wear'
import { formatWearCookie, parseWearCookie } from '@/utils/preferences'

describe('wear settings cookie', () => {
  it('round-trips', () => {
    const prefs = {
      figure: 'woman',
      feel: -1,
      coverage: true,
      skirts: false,
      style: 'traditional',
      exclude: ['cap', 'jeans']
    }
    expect(parseWearCookie(formatWearCookie(prefs))).toEqual(prefs)
  })

  it('falls back to the defaults for anything it cannot read', () => {
    expect(parseWearCookie(undefined)).toEqual({
      figure: 'man',
      feel: 0,
      coverage: false,
      skirts: true,
      style: 'everyday',
      exclude: []
    })
    expect(parseWearCookie('alien|7|x').feel).toBe(0)
    expect(parseWearCookie('man|0|0|1|fancy|ok.<b>').style).toBe('everyday')
    expect(parseWearCookie('man|0|0|1|fancy|ok.<b>').exclude).toEqual(['ok'])
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
    expect(wear.prefs).toEqual({
      figure: 'woman',
      feel: 1,
      coverage: false,
      skirts: true,
      style: 'everyday',
      exclude: []
    })
    expect(document.cookie).toContain('tidy-wear=woman%7C1%7C0%7C1%7Ceveryday%7C')
  })

  it('switches wardrobe pieces off and back on', () => {
    const wear = useWearStore()
    wear.toggle('jeans')
    wear.toggle('cap')
    expect(wear.exclude).toEqual(['cap', 'jeans'])
    expect(document.cookie).toContain('cap.jeans')
    wear.toggle('cap')
    expect(wear.exclude).toEqual(['jeans'])
    wear.allOn()
    expect(wear.exclude).toEqual([])
  })

  it('ignores unknown keys', () => {
    const wear = useWearStore()
    wear.set('colour', 'red')
    expect(wear.colour).toBeUndefined()
  })
})
