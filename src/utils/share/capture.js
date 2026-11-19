// Turning the off-screen 1080 card into a PNG. modern-screenshot is imported on first use
// (its own chunk). The sky's SVG blur and grain don't survive every browser's DOM capture
// (foreignObject), so the sky is painted to a canvas first and drawn as a plain <img>.

const FONT_CSS = [
  'https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,100..1000&display=swap',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@300;400;500;700&display=swap'
]

/**
 * The @font-face blocks of a Google Fonts stylesheet for the given subsets. Google writes
 * each block after a comment naming its subset ("/* latin *\/"); everything else is dropped
 * so the capture downloads only what the card can show.
 */
export function pickFontFaces(css, subsets) {
  const out = []
  const re = /\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*{[^}]*})/g
  let m
  while ((m = re.exec(css))) if (subsets.includes(m[1])) out.push(m[2])
  return out.join('\n')
}

let fontCssRequest = null

/** the card's fonts as one CSS string for the capture to embed (cached for the visit) */
export function cardFontCss() {
  fontCssRequest ??= Promise.all(
    FONT_CSS.map((url) =>
      fetch(url)
        .then((r) => (r.ok ? r.text() : ''))
        .catch(() => '')
    )
  ).then((sheets) => sheets.map((css) => pickFontFaces(css, ['latin', 'latin-ext', 'bengali'])).join('\n'))
  return fontCssRequest
}

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image failed to load'))
    img.src = src
  })

/** paints an inline <svg> to a PNG data URL at width × height pixels */
export async function paintSvg(svg, width, height) {
  const clone = svg.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  clone.removeAttribute('class')
  const markup = new XMLSerializer().serializeToString(clone)
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }))
  try {
    const img = await loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** waits until every <img> under `node` has decoded */
export async function imagesReady(node) {
  await Promise.all(
    [...node.querySelectorAll('img')].map((img) => (img.decode ? img.decode().catch(() => {}) : null))
  )
}

/** the card node as a PNG blob, 1 CSS px = 1 image px */
export async function captureCard(node, { width, height }) {
  const [{ domToBlob }, cssText] = await Promise.all([import('modern-screenshot'), cardFontCss()])
  if (document.fonts?.ready) await document.fonts.ready
  await imagesReady(node)
  return domToBlob(node, {
    scale: 1,
    type: 'image/png',
    width,
    height,
    backgroundColor: null,
    font: cssText ? { cssText } : undefined
  })
}
