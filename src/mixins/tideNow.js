// "Now" for a tides view, kept current while it stays open. Station times come from this
// and the station's zone, so the browser's own zone never shows.
export default {
  data() {
    return { now: Math.floor(Date.now() / 1000), nowTimer: null }
  },
  mounted() {
    this.now = Math.floor(Date.now() / 1000)
    this.nowTimer = setInterval(() => {
      this.now = Math.floor(Date.now() / 1000)
    }, 60000)
  },
  beforeUnmount() {
    clearInterval(this.nowTimer)
  }
}
