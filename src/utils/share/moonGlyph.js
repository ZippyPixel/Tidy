import { moonLitPath } from '@/utils/astro'

/** utils/astro moonLitPath, with nothing lit at new moon and the whole disc at full */
export function moonGlyphPath(r, k, waxing) {
  if (!(k > 0.01)) return ''
  if (k >= 0.99) return `M0,${-r} A${r},${r} 0 1 1 0,${r} A${r},${r} 0 1 1 0,${-r} Z`
  return moonLitPath(r, k, waxing)
}
