// Pointer drag across a 24-hour strip (the time slider and the sky path chart): the x
// position is a minute of the local day, snapped to 5 minutes. While the pointer is down
// it emits `preview` (the page redraws once per animation frame); on release, `commit`.
export const SNAP_MINUTES = 5

export function minuteAt(fraction) {
  const f = Math.max(0, Math.min(1, fraction))
  return Math.min(1435, Math.round((f * 1440) / SNAP_MINUTES) * SNAP_MINUTES)
}

export default {
  emits: ['preview', 'commit'],
  data() {
    return { dragging: false, dragMinute: null }
  },
  methods: {
    scrubMinute(event) {
      const r = event.currentTarget.getBoundingClientRect()
      return minuteAt((event.clientX - r.left) / Math.max(1, r.width))
    },
    scrubDown(event) {
      if (event.button !== undefined && event.button !== 0) return
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // a synthetic event has no pointer to capture
      }
      this.dragging = true
      this.dragMinute = this.scrubMinute(event)
      this.$emit('preview', this.dragMinute)
    },
    scrubMove(event) {
      if (!this.dragging) return
      this.dragMinute = this.scrubMinute(event)
      this.$emit('preview', this.dragMinute)
    },
    scrubUp() {
      if (!this.dragging) return
      this.dragging = false
      this.$emit('commit', this.dragMinute)
      this.dragMinute = null
    }
  }
}
