import { markRaw } from 'vue'
import { defineStore } from 'pinia'
import { API_ENDPOINTS } from '@/constants/api'
import { flattenIndex } from '@/utils/globe'

// One forecast is good for a while: predictions only change as the day rolls over.
const FRESH_FOR_MS = 30 * 60 * 1000
const DAYS = 7

const emptySlot = () => ({ key: null, data: null, status: 'idle', fetchedAt: 0 })

// Two slots, because they answer different questions: `nearest` is the station for the
// forecast location and always drives the dashboard card; `chosen` is the one in the
// /tides?station= link. Looking at Sydney must not change what the dashboard shows.
export default defineStore('tides', {
  state: () => ({
    nearest: emptySlot(),
    chosen: emptySlot(),
    // the explorer's downloads: kept for the visit, however often it opens
    explorer: null
  }),
  actions: {
    async load(slotName, key, query) {
      const slot = this[slotName]
      const fresh = Date.now() - slot.fetchedAt < FRESH_FOR_MS
      if (slot.key === key && (slot.status === 'loading' || (slot.status === 'ready' && fresh))) return

      // a station the user has moved on from must not show under the new one's name;
      // a refresh of the same one keeps its numbers until the new ones arrive
      if (slot.key !== key) slot.data = null
      slot.key = key
      slot.status = 'loading'
      try {
        const data = await $fetch(API_ENDPOINTS.TIDES, { query: { ...query, days: DAYS } })
        // a slower, older request lost the race
        if (slot.key !== key) return
        // read only and walked point by point while scrubbing, so no deep reactivity
        slot.data = markRaw(data)
        slot.status = 'ready'
        slot.fetchedAt = Date.now()
      } catch (error) {
        if (slot.key !== key) return
        // a failed refresh leaves the last good prediction on screen
        if (slot.data) {
          slot.status = 'ready'
          return
        }
        slot.status = error?.statusCode === 404 || error?.response?.status === 404 ? 'notFound' : 'error'
      }
    },
    loadNearest(coords) {
      if (!coords) return undefined
      return this.load('nearest', `${coords.lat},${coords.lon}`, { lat: coords.lat, lon: coords.lon })
    },
    loadStation(id) {
      return this.load('chosen', id, { station: id })
    },
    async loadExplorerData() {
      if (this.explorer) return this.explorer
      this.explorerRequest ??= Promise.all([$fetch(API_ENDPOINTS.TIDE_STATIONS), $fetch('/globe-land.json')])
      try {
        const [index, land] = await this.explorerRequest
        // thousands of rows that never change: reactivity would only slow them down
        this.explorer = markRaw({ index, land, stations: flattenIndex(index) })
        return this.explorer
      } finally {
        this.explorerRequest = null
      }
    }
  }
})
