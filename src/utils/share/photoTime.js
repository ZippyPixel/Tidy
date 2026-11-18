// When a photo was taken, from its EXIF DateTimeOriginal ("2026:11:04 17:42:00"). EXIF keeps the
// camera's wall clock; OffsetTimeOriginal ("+06:00"), when the camera wrote one, pins it to
// an instant. Without it the clock is read as the place's own.

import { zoneOffsetMin } from '@/utils/tideTime'

const EXIF_DATE = /^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/

/** the wall clock as UTC ms of its fields, or null */
export function exifWallClock(value) {
  if (value instanceof Date) return Number.isNaN(+value) ? null : value.getTime() - value.getTimezoneOffset() * 60000
  const m = EXIF_DATE.exec(String(value || '').trim())
  if (!m) return null
  const [, y, mo, d, h, mi, s] = m.map(Number)
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null
  return Date.UTC(y, mo - 1, d, h, mi, s || 0)
}

/** "+05:30" → 330, "-04:00" → -240, else null */
export function exifOffsetMinutes(value) {
  const m = /^([+-])(\d{2}):?(\d{2})$/.exec(String(value || '').trim())
  if (!m) return null
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]))
}

/** epoch ms when the photo was taken, or null without a usable date */
export function photoTakenAt({ dateTimeOriginal, offsetTimeOriginal }, tz) {
  const wall = exifWallClock(dateTimeOriginal)
  if (wall == null) return null
  const offset = exifOffsetMinutes(offsetTimeOriginal)
  if (offset != null) return wall - offset * 60000
  // the place's wall clock to an instant (twice, for a daylight saving edge)
  const at = (t) => zoneOffsetMin(t / 1000, tz) * 60000
  return wall - at(wall - at(wall))
}

/** reads DateTimeOriginal with exifr (lite, imported on the first photo) */
export async function readPhotoTakenAt(file, tz) {
  try {
    const { default: exifr } = await import('exifr/dist/lite.esm.mjs')
    const tags = await exifr.parse(file, {
      pick: ['DateTimeOriginal', 'OffsetTimeOriginal'],
      reviveValues: false
    })
    if (!tags) return null
    return photoTakenAt(
      { dateTimeOriginal: tags.DateTimeOriginal, offsetTimeOriginal: tags.OffsetTimeOriginal },
      tz
    )
  } catch {
    return null
  }
}
