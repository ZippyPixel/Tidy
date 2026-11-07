<template>
  <div ref="box" data-globe class="relative min-h-0 min-w-0 overflow-hidden bg-background">
    <!-- Drawn on a canvas, which has to know its pixel size: the one place tides measures -->
    <canvas
      ref="canvas"
      role="img"
      :aria-label="ariaLabel"
      class="absolute inset-0 block size-full cursor-grab"
      style="touch-action: none"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
      @pointerleave="onLeave"
    />

    <div class="absolute right-3 top-3 flex flex-col gap-2 md:right-5 md:top-5">
      <button type="button" data-spin :aria-label="$t(spinning ? 'tides.explorer.spinStop' : 'tides.explorer.spinStart')" :class="controlClass" @click="toggleSpin">
        <svg v-if="spinning" viewBox="0 0 24 24" aria-hidden="true" class="size-4 fill-current">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true" class="size-4 fill-current">
          <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
        </svg>
      </button>
      <button type="button" data-zoom-in :aria-label="$t('tides.explorer.zoomIn')" :class="controlClass" @click="zoomBy(zoomStep)">
        <svg viewBox="0 0 24 24" aria-hidden="true" class="size-[18px]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </button>
      <button type="button" data-zoom-out :aria-label="$t('tides.explorer.zoomOut')" :class="controlClass" @click="zoomBy(1 / zoomStep)">
        <svg viewBox="0 0 24 24" aria-hidden="true" class="size-[18px]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M5 12h14" />
        </svg>
      </button>
      <button type="button" data-recenter :aria-label="$t('tides.explorer.recenter')" :class="controlClass" @click="recenter">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          class="size-[18px]"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14 14 0 0 1 0 18" />
          <path d="M12 3a14 14 0 0 0 0 18" />
        </svg>
      </button>
    </div>

    <div
      ref="tip"
      aria-hidden="true"
      class="pointer-events-none absolute left-0 top-0 flex items-baseline gap-1.5 whitespace-nowrap rounded-lg border bg-popover px-2 py-1 text-[13px] leading-5 text-popover-foreground opacity-0 shadow-[0_4px_12px_hsl(220_30%_4%/0.14)]"
    >
      <span class="font-semibold">{{ hover?.name }}</span>
      <span class="text-muted-foreground">{{ hover?.country }}</span>
    </div>

    <!-- docked at the bottom on a phone; from md it follows the dot, moved in placeOverlays -->
    <div
      v-if="pick"
      ref="popup"
      data-popup
      role="group"
      :aria-label="pick.name"
      class="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-tile border bg-popover py-3 pl-4 pr-3 text-popover-foreground shadow-[0_8px_24px_hsl(220_30%_4%/0.18)] md:inset-x-auto md:bottom-auto md:left-0 md:top-0 md:w-[300px]"
    >
      <div class="flex min-w-0 flex-col gap-0.5">
        <span class="truncate text-base font-semibold leading-[22px]">{{ pick.name }}</span>
        <span class="truncate text-[13px] leading-[18px] text-muted-foreground">{{ pickSub }}</span>
      </div>
      <button
        type="button"
        data-view-tides
        class="inline-flex h-10 flex-none items-center whitespace-nowrap rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground outline-ring hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        @click="$emit('view', pick)"
      >
        {{ $t('tides.explorer.viewTides') }}
      </button>
    </div>

    <TideCredit
      v-if="credit"
      :text="credit"
      class="absolute bottom-2.5 left-3 max-w-[calc(100%-24px)] truncate text-[11px] leading-[14px] text-muted-foreground md:bottom-4 md:left-5"
      :class="{ 'max-md:hidden': pick }"
    />
  </div>
</template>

<script>
import TideCredit from '@/components/tides/TideCredit.vue'
import { prefersReducedMotion } from '@/utils/astro'
import {
  camera,
  clampDragLat,
  clampFlyLat,
  clampZoom,
  hitTest,
  landPoints,
  pointSet,
  project,
  projectAngles,
  shortestTurn,
  ZOOM_STEP
} from '@/utils/globe'

const TAU = Math.PI * 2
const SPIN_PER_FRAME = 0.05
const FLY_MS = 700
const DRAG_THRESHOLD = 4
const DEFAULT_VIEW = { lon: 88, lat: 16 }

export default {
  name: 'TideGlobe',
  components: { TideCredit },
  props: {
    /** flat { id, name, country, lat, lon }[] */
    stations: { type: Array, default: () => [] },
    /** globe-land.json, or null until it has loaded */
    land: { type: Object, default: null },
    /** the station on the page: ringed, and where the globe starts */
    selected: { type: Object, default: null },
    /** the forecast location */
    home: { type: Object, default: null },
    /** the station picked in the list or on the globe */
    pick: { type: Object, default: null },
    pickSub: { type: String, default: '' },
    isMd: { type: Boolean, default: false },
    ariaLabel: { type: String, default: '' },
    credit: { type: String, default: '' }
  },
  emits: ['update:pick', 'view'],
  data() {
    return {
      spinning: false,
      hover: null,
      zoomStep: ZOOM_STEP,
      controlClass:
        'flex size-11 items-center justify-center rounded-full border bg-popover text-popover-foreground shadow-[0_2px_8px_hsl(220_30%_4%/0.08)] outline-ring hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:size-10'
    }
  },
  watch: {
    stations() {
      this.prepareStations()
      this.draw()
    },
    land() {
      this.prepareLand()
      this.draw()
    },
    pick(station) {
      if (station) this.stopSpin()
      // after the popup renders, so it can be placed
      this.$nextTick(() => this.draw())
    },
    isMd() {
      this.draw()
    }
  },
  created() {
    // frame state, deliberately not reactive
    const start = this.selected ?? this.home ?? DEFAULT_VIEW
    this.view = { lon: start.lon, lat: clampFlyLat(start.lat), zoom: 1 }
    this.cam = null
    this.drag = null
    this.fly = null
    this.frame = 0
    this.stationSet = null
    this.landSet = null
    this.reducedMotion = false
  },
  mounted() {
    this.reducedMotion = prefersReducedMotion()
    this.spinning = !this.reducedMotion
    this.prepareStations()
    this.prepareLand()
    this.resizeObserver = new ResizeObserver(() => this.draw())
    this.resizeObserver.observe(this.$refs.box)
    // a system theme change: the colours are read from the tokens on each draw
    this.themeObserver = new MutationObserver(() => this.draw())
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    this.draw()
    this.kick()
  },
  beforeUnmount() {
    cancelAnimationFrame(this.frame)
    this.frame = -1
    this.resizeObserver?.disconnect()
    this.themeObserver?.disconnect()
  },
  methods: {
    prepareStations() {
      this.stationSet = this.stations.length ? pointSet(this.stations) : null
    },
    prepareLand() {
      this.landSet = this.land ? pointSet(landPoints(this.land)) : null
    },
    draw() {
      const canvas = this.$refs.canvas
      const box = this.$refs.box
      const context = canvas?.getContext?.('2d')
      if (!context || !box.clientWidth || !box.clientHeight) return
      const width = box.clientWidth
      const height = box.clientHeight
      const ratio = Math.min(2, window.devicePixelRatio || 1)
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio)
        canvas.height = Math.round(height * ratio)
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, width, height)

      const styles = getComputedStyle(canvas)
      const color = (token, alpha) =>
        `hsl(${styles.getPropertyValue(token).trim()}${alpha === undefined ? '' : ` / ${alpha}`})`
      const radius = Math.min(width, height) * (this.isMd ? 0.42 : 0.4) * this.view.zoom
      const cx = width / 2
      const cy = height / 2
      this.cam = camera(this.view, cx, cy, radius)

      const glow = context.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.16)
      glow.addColorStop(0, color('--tide', 0.26))
      glow.addColorStop(1, color('--tide', 0))
      context.fillStyle = glow
      context.beginPath()
      context.arc(cx, cy, radius * 1.16, 0, TAU)
      context.fill()

      const shade = context.createRadialGradient(cx - radius * 0.35, cy - radius * 0.4, radius * 0.1, cx, cy, radius)
      shade.addColorStop(0, color('--surface-raised'))
      shade.addColorStop(1, color('--card'))
      context.fillStyle = shade
      context.beginPath()
      context.arc(cx, cy, radius, 0, TAU)
      context.fill()
      context.lineWidth = 1
      context.strokeStyle = color('--tide', 0.4)
      context.stroke()

      const plot = (set, size, fill, minDepth) => {
        if (!set) return
        context.fillStyle = fill
        context.beginPath()
        for (let i = 0; i < set.count; i++) {
          const p = projectAngles(this.cam, set.lambda[i], set.sinLat[i], set.cosLat[i])
          if (p.depth <= minDepth || p.x < -4 || p.y < -4 || p.x > width + 4 || p.y > height + 4) continue
          context.moveTo(p.x + size, p.y)
          context.arc(p.x, p.y, size, 0, TAU)
        }
        context.fill()
      }
      plot(this.landSet, Math.max(0.9, radius * 0.0055), color('--muted-foreground', 0.4), 0.02)
      plot(this.stationSet, Math.max(1.3, radius * 0.0045), color('--tide', 0.92), 0)

      if (this.home) {
        const p = project(this.cam, this.home)
        if (p.depth > 0) {
          context.beginPath()
          context.arc(p.x, p.y, 5, 0, TAU)
          context.fillStyle = color('--foreground')
          context.fill()
          context.lineWidth = 2
          context.strokeStyle = color('--card')
          context.stroke()
        }
      }
      const ring = (station, stroke, size) => {
        const p = project(this.cam, station)
        if (p.depth <= 0) return
        context.beginPath()
        context.arc(p.x, p.y, size, 0, TAU)
        context.lineWidth = 2
        context.strokeStyle = stroke
        context.stroke()
        context.beginPath()
        context.arc(p.x, p.y, 3.5, 0, TAU)
        context.fillStyle = stroke
        context.fill()
      }
      if (this.selected) ring(this.selected, color('--foreground'), 8)
      if (this.pick) ring(this.pick, color('--tide'), 10)
      if (this.hover) ring(this.hover, color('--tide'), 7)
      this.placeOverlays()
    },
    placeOverlays() {
      const place = (element, station, offset) => {
        if (!element || !this.cam) return
        const p = station ? project(this.cam, station) : null
        if (!p || p.depth <= 0) {
          element.style.opacity = '0'
          element.style.pointerEvents = 'none'
          return
        }
        element.style.opacity = '1'
        element.style.pointerEvents = ''
        element.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y + offset)}px) translate(-50%, -100%)`
      }
      place(this.$refs.tip, this.hover, -14)
      const popup = this.$refs.popup
      if (popup && this.isMd) place(popup, this.pick, -18)
      else if (popup) {
        popup.style.transform = ''
        popup.style.opacity = ''
        popup.style.pointerEvents = ''
      }
    },
    kick() {
      if (!this.frame) this.frame = requestAnimationFrame(this.tick)
    },
    tick() {
      if (this.frame === -1) return
      this.frame = 0
      let more = false
      if (this.fly) {
        const f = this.fly
        const progress = Math.min(1, (performance.now() - f.startedAt) / FLY_MS)
        const eased = 1 - (1 - progress) ** 3
        this.view.lon = f.lon + f.turn * eased
        this.view.lat = f.lat + (f.toLat - f.lat) * eased
        this.view.zoom = f.zoom + (f.toZoom - f.zoom) * eased
        if (progress >= 1) this.fly = null
        more = true
      } else if (this.spinning && !this.drag && !this.pick && !this.hover) {
        this.view.lon -= SPIN_PER_FRAME
        more = true
      }
      if (more) {
        this.draw()
        this.kick()
      }
    },
    flyTo(lon, lat, zoom) {
      const toLat = clampFlyLat(lat)
      const toZoom = clampZoom(zoom ?? this.view.zoom)
      const turn = shortestTurn(this.view.lon, lon)
      if (this.reducedMotion) {
        this.view = { lon: this.view.lon + turn, lat: toLat, zoom: toZoom }
        this.draw()
        return
      }
      this.fly = { startedAt: performance.now(), lon: this.view.lon, turn, lat: this.view.lat, toLat, zoom: this.view.zoom, toZoom }
      this.kick()
    },
    zoomBy(factor) {
      if (factor > 1) this.stopSpin()
      this.flyTo(this.view.lon, this.view.lat, this.view.zoom * factor)
    },
    recenter() {
      const station = this.selected ?? this.home
      if (station) this.flyTo(station.lon, station.lat, 1.8)
    },
    stopSpin() {
      this.spinning = false
    },
    toggleSpin() {
      this.spinning = !this.spinning
      if (this.spinning) this.kick()
    },
    stationAt(event) {
      if (!this.cam || !this.stationSet) return null
      const box = this.$refs.box.getBoundingClientRect()
      const index = hitTest(this.cam, this.stationSet, event.clientX - box.left, event.clientY - box.top, event.pointerType)
      return index >= 0 ? this.stations[index] : null
    },
    onDown(event) {
      if (!this.cam) return
      event.currentTarget.setPointerCapture?.(event.pointerId)
      this.drag = { x: event.clientX, y: event.clientY, lon: this.view.lon, lat: this.view.lat, moved: false }
      this.fly = null
      this.stopSpin()
    },
    onMove(event) {
      const drag = this.drag
      if (drag) {
        const dx = event.clientX - drag.x
        const dy = event.clientY - drag.y
        if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) drag.moved = true
        const perPixel = 180 / Math.PI / Math.max(1, this.cam.radius)
        this.view.lon = drag.lon - dx * perPixel
        this.view.lat = clampDragLat(drag.lat + dy * perPixel)
        this.draw()
        return
      }
      if ((event.pointerType || 'mouse') === 'mouse') {
        const station = this.stationAt(event)
        if (station !== this.hover) {
          this.hover = station
          this.draw()
          if (!station) this.kick()
        }
      }
    },
    onUp(event) {
      const drag = this.drag
      this.drag = null
      if (drag && !drag.moved) {
        this.hover = null
        this.$emit('update:pick', this.stationAt(event))
      }
    },
    onLeave() {
      if (this.hover && !this.drag) {
        this.hover = null
        this.draw()
        this.kick()
      }
    }
  }
}
</script>
