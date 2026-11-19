// What the composer's two buttons do, and the browser calls behind them. The decisions are
// pure; the calls take `nav` / `doc` so they can be tested without a browser.
//
//              primary                   secondary
//   phone      Share (Save if it can't)   Save
//   sticker    Share sticker (or Save)    Copy
//   md+        Download PNG               Copy image

/** { primary, secondary } action ids for the device, the look and Web Share support */
export function shareButtons({ phone, look, canShare }) {
  if (!phone) return { primary: 'download', secondary: 'copy' }
  const sticker = look === 'sticker'
  return {
    primary: canShare ? (sticker ? 'shareSticker' : 'share') : 'save',
    secondary: sticker ? 'copy' : 'save'
  }
}

/** can this browser share a PNG file? (Web Share level 2) */
export function canShareFiles(nav = globalThis.navigator, file = null) {
  if (!nav?.share || !nav?.canShare) return false
  try {
    const probe = file || new File([new Uint8Array(1)], 'tidy.png', { type: 'image/png' })
    return nav.canShare({ files: [probe] })
  } catch {
    return false
  }
}

/** can this browser put an image on the clipboard? */
export const canCopyImage = (nav = globalThis.navigator) =>
  !!nav?.clipboard?.write && typeof globalThis.ClipboardItem === 'function'

/** a share the user cancelled is not an error */
export const isCancel = (error) => error?.name === 'AbortError'

/**
 * Shares the PNG with its text. Resolves 'shared' or 'cancelled'; anything else throws, and
 * a share the browser refuses ('NotAllowedError', e.g. no user activation left) is for the
 * caller to turn into a Save.
 */
export async function shareFile({ blob, fileName, text }, nav = globalThis.navigator) {
  const file = new File([blob], fileName, { type: 'image/png' })
  try {
    await nav.share({ files: [file], text })
    return 'shared'
  } catch (error) {
    if (isCancel(error)) return 'cancelled'
    throw error
  }
}

/** saves the PNG through a download link */
export function downloadFile({ blob, fileName }, doc = globalThis.document) {
  const url = URL.createObjectURL(blob)
  const a = doc.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  doc.body.appendChild(a)
  a.click()
  a.remove()
  // the download has its own copy once it starts
  setTimeout(() => URL.revokeObjectURL(url), 30000)
  return 'saved'
}

/** puts the PNG on the clipboard */
export async function copyFile({ blob }, nav = globalThis.navigator) {
  // a promise keeps Safari's user activation while the image is still being made
  const item = new globalThis.ClipboardItem({ 'image/png': Promise.resolve(blob) })
  await nav.clipboard.write([item])
  return 'copied'
}

/** the share text: one line for the moment, then the link (no numbers: the image has them) */
export function shareText({ t, moment, placeName, url }) {
  const m = ['today', 'beach', 'sky', 'outfit'].includes(moment) ? moment : 'today'
  const lead = placeName ? t(`share.text.${m}`, { place: placeName }) : t(`share.text.${m}NoPlace`)
  return url ? `${lead} ${t('share.text.seeYours', { url })}` : lead
}
