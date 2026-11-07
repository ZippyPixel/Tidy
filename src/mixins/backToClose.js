// Phone only: the back gesture closes the surface instead of leaving the page. The
// component provides `open`, `isMd` and `historyKey`, emits 'close', and calls
// requestClose() instead of closing itself, because the history entry has to go too.
export default {
  data() {
    return {
      // this surface owns the current history entry
      pushed: false
    }
  },
  watch: {
    open(open) {
      if (open) window.addEventListener('popstate', this.onPopState)
      else window.removeEventListener('popstate', this.onPopState)
      this.syncHistory()
    },
    isMd() {
      this.syncHistory()
    }
  },
  mounted() {
    if (!this.open) return
    // mounted already open: useMediaQuery only has its real answer after this tick, and
    // reading it sooner would take a desktop for a phone and push an entry
    window.addEventListener('popstate', this.onPopState)
    this.$nextTick(() => this.syncHistory())
  },
  beforeUnmount() {
    window.removeEventListener('popstate', this.onPopState)
  },
  methods: {
    // Merged into the current state, because vue-router keeps its position there.
    syncHistory() {
      if (!this.open || this.isMd || this.pushed) return
      history.pushState({ ...history.state, [this.historyKey]: true }, '')
      this.pushed = true
    },
    requestClose() {
      if (this.pushed) {
        // popstate finishes the close
        this.pushed = false
        history.back()
      } else {
        this.$emit('close')
      }
    },
    onPopState() {
      this.pushed = false
      this.$emit('close')
    }
  }
}
