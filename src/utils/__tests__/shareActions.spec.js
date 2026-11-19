import { describe, expect, it, vi } from 'vitest'
import {
  canShareFiles,
  copyFile,
  downloadFile,
  shareButtons,
  shareFile,
  shareText
} from '@/utils/share/shareActions'
import { pickFontFaces, coversText, cardFontCss } from '@/utils/share/capture'

describe('share buttons', () => {
  it('shares on a phone and saves second', () => {
    expect(shareButtons({ phone: true, look: 'sky', canShare: true })).toEqual({ primary: 'share', secondary: 'save' })
  })

  it('becomes Save when the phone cannot share files', () => {
    expect(shareButtons({ phone: true, look: 'photo', canShare: false })).toEqual({ primary: 'save', secondary: 'save' })
  })

  it('shares a sticker and copies it second', () => {
    expect(shareButtons({ phone: true, look: 'sticker', canShare: true })).toEqual({
      primary: 'shareSticker',
      secondary: 'copy'
    })
  })

  it('downloads and copies on md+', () => {
    expect(shareButtons({ phone: false, look: 'sticker', canShare: true })).toEqual({
      primary: 'download',
      secondary: 'copy'
    })
  })
})

describe('share calls', () => {
  const blob = new Blob(['x'], { type: 'image/png' })

  it('asks canShare about files', () => {
    expect(canShareFiles({ share() {}, canShare: () => true })).toBe(true)
    expect(canShareFiles({ share() {} })).toBe(false)
    expect(canShareFiles(undefined)).toBe(false)
  })

  it('shares the PNG and the text', async () => {
    const nav = { share: vi.fn().mockResolvedValue() }
    await expect(shareFile({ blob, fileName: 'tidy.png', text: 'hi' }, nav)).resolves.toBe('shared')
    const [{ files, text }] = nav.share.mock.calls[0]
    expect(files[0].name).toBe('tidy.png')
    expect(files[0].type).toBe('image/png')
    expect(text).toBe('hi')
  })

  it('treats a cancelled share as nothing', async () => {
    const abort = Object.assign(new Error('cancel'), { name: 'AbortError' })
    const nav = { share: vi.fn().mockRejectedValue(abort) }
    await expect(shareFile({ blob, fileName: 'a.png', text: '' }, nav)).resolves.toBe('cancelled')
  })

  it('passes other failures on', async () => {
    const refused = Object.assign(new Error('no'), { name: 'NotAllowedError' })
    const nav = { share: vi.fn().mockRejectedValue(refused) }
    await expect(shareFile({ blob, fileName: 'a.png', text: '' }, nav)).rejects.toBe(refused)
  })

  it('downloads under the file name', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    URL.createObjectURL ??= () => 'blob:x'
    URL.revokeObjectURL ??= () => {}
    expect(downloadFile({ blob, fileName: 'tidy-dhaka-2026-11-19.png' })).toBe('saved')
    expect(click).toHaveBeenCalledOnce()
    expect(click.mock.contexts[0].download).toBe('tidy-dhaka-2026-11-19.png')
    click.mockRestore()
  })

  it('copies a PNG clipboard item', async () => {
    const Item = vi.fn(function (data) {
      this.data = data
    })
    vi.stubGlobal('ClipboardItem', Item)
    const nav = { clipboard: { write: vi.fn().mockResolvedValue() } }
    await expect(copyFile({ blob }, nav)).resolves.toBe('copied')
    expect(Object.keys(Item.mock.calls[0][0])).toEqual(['image/png'])
    vi.unstubAllGlobals()
  })
})

describe('share text', () => {
  const t = (key, params) => `${key}${params ? JSON.stringify(params) : ''}`

  it('is one line for the moment, then the link', () => {
    expect(shareText({ t, moment: 'beach', placeName: 'Dhaka', url: 'https://x/?from=share' })).toBe(
      'share.text.beach{"place":"Dhaka"} share.text.seeYours{"url":"https://x/?from=share"}'
    )
  })

  it('leaves the place and the link out when they are off', () => {
    expect(shareText({ t, moment: null, placeName: '', url: '' })).toBe('share.text.todayNoPlace')
  })
})

describe('font embedding', () => {
  const css = `/* cyrillic */
@font-face { font-family: 'Roboto Flex'; src: url(a.woff2); }
/* latin-ext */
@font-face { font-family: 'Roboto Flex'; src: url(b.woff2); }
/* latin */
@font-face { font-family: 'Roboto Flex'; src: url(c.woff2); }`

  it('keeps only the subsets the card needs', () => {
    const kept = pickFontFaces(css, ['latin', 'latin-ext'])
    expect(kept).toContain('b.woff2')
    expect(kept).toContain('c.woff2')
    expect(kept).not.toContain('a.woff2')
  })

  it('matches a face to the text by its unicode-range', () => {
    const latin = '@font-face { src: url(c.woff2); unicode-range: U+0000-00FF, U+0131; }'
    const bengali = '@font-face { src: url(d.woff2); unicode-range: U+0951-0952, U+0980-09FE; }'
    const wild = '@font-face { src: url(e.woff2); unicode-range: U+20??; }'
    expect(coversText(latin, 'Dhaka 31°')).toBe(true)
    expect(coversText(bengali, 'Dhaka 31°')).toBe(false)
    expect(coversText(bengali, 'ঢাকা')).toBe(true)
    expect(coversText(wild, '·')).toBe(false)
    expect(coversText(wild, '–')).toBe(true)
    expect(coversText('@font-face { src: url(f.woff2); }', 'x')).toBe(true)
  })

  it('inlines the font files, since the captured image cannot fetch them', async () => {
    const sheet = `/* bengali */
@font-face { font-family: 'Noto Sans Bengali'; src: url(https://fonts.gstatic.com/bn.woff2) format('woff2'); unicode-range: U+0980-09FE; }
/* latin */
@font-face { font-family: 'Roboto Flex'; src: url(https://fonts.gstatic.com/latin.woff2) format('woff2'); unicode-range: U+0000-00FF; }`
    const fetch = vi.fn(async (url) =>
      url.includes('googleapis')
        ? { ok: true, text: async () => sheet }
        : { ok: true, blob: async () => new Blob(['font'], { type: 'font/woff2' }) }
    )
    vi.stubGlobal('fetch', fetch)
    try {
      const css = await cardFontCss('Dhaka 31°')
      expect(css).toContain("font-family: 'Roboto Flex'")
      expect(css).toContain('url(data:font/woff2;base64,')
      expect(css).not.toContain('gstatic')
      expect(css).not.toContain('Noto Sans Bengali')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
