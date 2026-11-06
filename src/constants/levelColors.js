// Fixed data colours: the same in light and dark, because they are the published UV
// and AQI scales rather than part of the theme. Everything else uses theme tokens.

// `max` is exclusive and compared with the rounded index (the bands are whole numbers)
export const UV_LEVELS = [
  { key: 'low', max: 3, color: 'hsl(142 55% 42%)' },
  { key: 'moderate', max: 6, color: 'hsl(46 92% 50%)' },
  { key: 'high', max: 8, color: 'hsl(28 92% 52%)' },
  { key: 'veryHigh', max: 11, color: 'hsl(0 72% 52%)' },
  { key: 'extreme', max: Infinity, color: 'hsl(282 42% 50%)' }
]

// Position + 1 is the US EPA index
export const EPA_LEVELS = [
  { key: 'good', color: 'hsl(142 55% 42%)' },
  { key: 'moderate', color: 'hsl(46 92% 50%)' },
  { key: 'sensitive', color: 'hsl(28 92% 52%)' },
  { key: 'unhealthy', color: 'hsl(0 72% 52%)' },
  { key: 'veryUnhealthy', color: 'hsl(282 42% 50%)' },
  { key: 'hazardous', color: 'hsl(345 62% 34%)' }
]
