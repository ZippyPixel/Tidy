import { defineStore } from 'pinia'

export default defineStore('unit', {
  state: () => ({ unit: 'celsius' }),
  actions: {
    setUnit(unit) {
      this.unit = unit
    }
  }
})
