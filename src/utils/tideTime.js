// Station-zone calendar arithmetic, used by the server and the page. Days are found per
// date, never as start + n * 86400, because a daylight saving day is 23 or 25 hours long.
// Times are epoch seconds and dates 'YYYY-MM-DD'.
const formatters = new Map()

function formatterFor(timeZone) {
  if (!formatters.has(timeZone)) {
    formatters.set(
      timeZone,
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    )
  }
  return formatters.get(timeZone)
}

function wallClock(epoch, timeZone) {
  const parts = {}
  for (const { type, value } of formatterFor(timeZone).formatToParts(new Date(epoch * 1000))) parts[type] = value
  return parts
}

export function zoneOffsetMin(epoch, timeZone) {
  const p = wallClock(epoch, timeZone)
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return Math.round((asUtc - Math.floor(epoch) * 1000) / 60000)
}

export function dateInZone(epoch, timeZone) {
  const p = wallClock(epoch, timeZone)
  return `${p.year}-${p.month}-${p.day}`
}

export function addDays(date, days) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export function zonedMidnight(date, timeZone) {
  const [y, m, d] = date.split('-').map(Number)
  const utc = Date.UTC(y, m - 1, d) / 1000
  // the offset at midnight itself, which can differ from the one at the first guess
  const guess = utc - zoneOffsetMin(utc, timeZone) * 60
  return utc - zoneOffsetMin(guess, timeZone) * 60
}

export function hourInZone(epoch, timeZone) {
  return +wallClock(epoch, timeZone).hour
}

// Whole local hours from `from` to `to` that are a multiple of `every`, read from the wall
// clock so a daylight saving day and a half-hour zone still land on the right marks.
export function hourTicks(from, to, timeZone, every) {
  const start = wallClock(from, timeZone)
  const past = +start.minute * 60 + +start.second
  const ticks = []
  for (let time = past ? from - past + 3600 : from; time <= to; time += 3600) {
    const hour = hourInZone(time, timeZone)
    if (hour % every === 0) ticks.push({ time, hour })
  }
  return ticks
}
