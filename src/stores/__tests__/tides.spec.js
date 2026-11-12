import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import useTidesStore from '@/stores/tides'
import useWeatherStore from '@/stores/weather'
import fixture from '@/utils/__tests__/fixtures/weatherapi-forecast.json'

const payload = (name) => ({ station: { name } })
const COORDS = { lat: 23.817, lon: 90.417 }

describe('tides store', () => {
  let store
  let fetchMock

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTidesStore()
    fetchMock = vi.fn(async (_url, { query }) => payload(query.station ?? 'nearest'))
    vi.stubGlobal('$fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('loads the nearest station by coordinates', async () => {
    await store.loadNearest(COORDS)
    expect(fetchMock).toHaveBeenCalledWith('/api/tides', { query: { ...COORDS, days: 7 } })
    expect(store.nearest.status).toBe('ready')
    expect(store.nearest.data.station.name).toBe('nearest')
  })

  it('loads a chosen station by id, without touching the nearest one', async () => {
    await store.loadNearest(COORDS)
    await store.loadStation('ticon/x')
    expect(fetchMock).toHaveBeenLastCalledWith('/api/tides', { query: { station: 'ticon/x', days: 7 } })
    expect(store.chosen.data.station.name).toBe('ticon/x')
    expect(store.nearest.data.station.name).toBe('nearest')
  })

  it('does nothing without coordinates', async () => {
    await store.loadNearest(null)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shares one request and reuses a fresh answer', async () => {
    await Promise.all([store.loadNearest(COORDS), store.loadNearest(COORDS)])
    await store.loadNearest(COORDS)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('asks again once the answer is old', async () => {
    vi.useFakeTimers()
    await store.loadNearest(COORDS)
    vi.advanceTimersByTime(31 * 60 * 1000)
    await store.loadNearest(COORDS)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('ignores a slow answer for a station the user has left', async () => {
    let finishSlow
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => (finishSlow = resolve)))
    const slow = store.loadStation('slow')
    await store.loadStation('fast')
    finishSlow(payload('slow'))
    await slow
    expect(store.chosen.key).toBe('fast')
    expect(store.chosen.data.station.name).toBe('fast')
  })

  it('clears the old station while the next one loads', () => {
    store.chosen.data = payload('old')
    store.chosen.status = 'ready'
    store.chosen.key = 'old'
    store.loadStation('new')
    expect(store.chosen.data).toBeNull()
    expect(store.chosen.status).toBe('loading')
  })

  it('keeps the same station on screen while it refreshes', async () => {
    vi.useFakeTimers()
    await store.loadStation('same')
    vi.advanceTimersByTime(31 * 60 * 1000)
    let finish
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)))
    const refresh = store.loadStation('same')
    expect(store.chosen.status).toBe('loading')
    expect(store.chosen.data.station.name).toBe('same')
    finish(payload('same, newer'))
    await refresh
    expect(store.chosen.data.station.name).toBe('same, newer')
  })

  it('keeps the last good prediction when a refresh fails', async () => {
    vi.useFakeTimers()
    await store.loadStation('same')
    vi.advanceTimersByTime(31 * 60 * 1000)
    fetchMock.mockRejectedValueOnce(new Error('network'))
    await store.loadStation('same')
    expect(store.chosen.status).toBe('ready')
    expect(store.chosen.data.station.name).toBe('same')
  })

  it('tells an unknown station from a failed request', async () => {
    fetchMock.mockRejectedValueOnce({ statusCode: 404 })
    await store.loadStation('nope')
    expect(store.chosen.status).toBe('notFound')
    fetchMock.mockRejectedValueOnce(new Error('network'))
    await store.loadStation('other')
    expect(store.chosen.status).toBe('error')
  })
})

describe('weather store coords', () => {
  it('keeps where the forecast is for', async () => {
    setActivePinia(createPinia())
    const weather = useWeatherStore()
    await weather.setValues(fixture)
    expect(weather.coords).toEqual({
      name: 'Joar Sahara',
      country: 'Bangladesh',
      lat: 23.817,
      lon: 90.417,
      tzId: 'Asia/Dhaka'
    })
  })
})

describe('explorer data', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('downloads once, and tries again after a failure', async () => {
    setActivePinia(createPinia())
    const store = useTidesStore()
    const index = { countries: [{ name: 'Iceland', s: [['ticon/r', 'Reykjavik', 64, -22]] }] }
    const fetchMock = vi.fn(async (url) => (url === '/globe-land.json' ? { dots: [] } : index))
    vi.stubGlobal('$fetch', fetchMock)

    fetchMock.mockRejectedValueOnce(new Error('network'))
    await expect(store.loadExplorerData()).rejects.toThrow('network')

    fetchMock.mockClear()
    const [first] = await Promise.all([store.loadExplorerData(), store.loadExplorerData()])
    await store.loadExplorerData()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(first.stations[0]).toMatchObject({ id: 'ticon/r', country: 'Iceland' })
  })
})
