import { markRaw } from 'vue'
import { defineStore } from 'pinia'
import { API_ENDPOINTS } from '@/constants/api'
import { flattenPlaces } from '@/utils/globe'

// The location finder's downloads for the Sun & Moon page: kept for the visit
export default defineStore('places', {
  state: () => ({ explorer: null }),
  actions: {
    async loadExplorerData() {
      if (this.explorer) return this.explorer
      this.explorerRequest ??= Promise.all([
        $fetch(API_ENDPOINTS.PLACES),
        $fetch('/globe-land.json')
      ])
      try {
        const [index, land] = await this.explorerRequest
        // thousands of rows that never change: reactivity would only slow them down
        this.explorer = markRaw({ index, land, stations: flattenPlaces(index) })
        return this.explorer
      } finally {
        this.explorerRequest = null
      }
    }
  }
})
