<template>
  <svg
    ref="svg"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="`0 0 360 ${hb}`"
    aria-hidden="true"
    class="absolute inset-0 block h-full w-full"
  >
    <!-- design/TidyShareCard sky: 4-stop gradient, sun or moon, clouds in fixed slots clear
         of the text column, weather, three TIDY waves and a 7% grain against banding -->
    <defs>
      <linearGradient :id="`${id}s`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="pal.stops[0]" />
        <stop offset="0.3" :stop-color="pal.stops[1]" />
        <stop offset="0.62" :stop-color="pal.stops[2]" />
        <stop offset="1" :stop-color="pal.stops[3]" />
      </linearGradient>
      <radialGradient :id="`${id}h`">
        <stop offset="0" :stop-color="pal.glow" stop-opacity="0.3" />
        <stop offset="1" :stop-color="pal.glow" stop-opacity="0" />
      </radialGradient>
      <radialGradient :id="`${id}g`">
        <stop offset="0" :stop-color="pal.glow" :stop-opacity="pal.moon ? 0.24 : 0.8" />
        <stop offset="1" :stop-color="pal.glow" stop-opacity="0" />
      </radialGradient>
      <radialGradient :id="`${id}k`">
        <stop offset="0" stop-color="#FFFEF6" />
        <stop offset="0.62" :stop-color="pal.core" />
        <stop offset="1" :stop-color="pal.glow" stop-opacity="0.55" />
      </radialGradient>
      <radialGradient :id="`${id}l`">
        <stop offset="0" stop-color="#E8EEFF" stop-opacity="0.5" />
        <stop offset="1" stop-color="#E8EEFF" stop-opacity="0" />
      </radialGradient>
      <filter :id="`${id}c`" x="-20%" y="-60%" width="140%" height="220%">
        <feGaussianBlur stdDeviation="1.6" />
      </filter>
      <filter :id="`${id}z`" x="-10%" y="-300%" width="120%" height="700%">
        <feGaussianBlur stdDeviation="11" />
      </filter>
      <filter :id="`${id}n`" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" :baseFrequency="grainFrequency" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </defs>
    <rect x="0" y="0" width="360" :height="hb" :fill="`url(#${id}s)`" />
    <circle v-for="(s, i) in scene.stars" :key="`s${i}`" :cx="s.x" :cy="s.y" :r="s.r" fill="#ffffff" :opacity="s.o" />
    <g v-for="(b, i) in scene.brightStars" :key="`b${i}`">
      <circle :cx="b.x" :cy="b.y" r="6" :fill="`url(#${id}g)`" />
      <path :d="b.d" stroke="#ffffff" stroke-width="0.6" stroke-linecap="round" opacity="0.85" />
      <circle :cx="b.x" :cy="b.y" r="1.2" fill="#ffffff" />
    </g>
    <circle v-if="pal.flash" cx="246" :cy="scene.flashY" r="130" :fill="`url(#${id}l)`" />
    <template v-if="pal.sun">
      <circle :cx="scene.sun.x" :cy="scene.sun.y" r="170" :fill="`url(#${id}h)`" />
      <circle :cx="scene.sun.x" :cy="scene.sun.y" r="64" :fill="`url(#${id}g)`" />
      <circle :cx="scene.sun.x" :cy="scene.sun.y" r="21" :fill="`url(#${id}k)`" />
    </template>
    <template v-if="pal.moon">
      <circle :cx="scene.sun.x" :cy="scene.sun.y" r="80" :fill="`url(#${id}g)`" />
      <g :transform="`translate(${scene.sun.x} ${scene.sun.y})`" :opacity="pal.moonDim ? 0.45 : 1">
        <circle r="19" fill="#2E3757" />
        <path :d="moonPath" fill="#F4F0E3" />
      </g>
    </template>
    <rect
      v-for="(h, i) in scene.haze"
      :key="`z${i}`"
      x="-40"
      :y="h.y"
      width="440"
      :height="h.h"
      rx="16"
      fill="#ffffff"
      :opacity="h.o"
      :filter="`url(#${id}z)`"
    />
    <path
      v-for="(c, i) in scene.clouds"
      :key="`c${i}`"
      :d="c.d"
      :fill="c.fill"
      :opacity="c.o"
      :filter="`url(#${id}c)`"
    />
    <line
      v-for="(d, i) in scene.drops"
      :key="`d${i}`"
      :x1="d.x1"
      :y1="d.y1"
      :x2="d.x2"
      :y2="d.y2"
      stroke="#ffffff"
      :stroke-opacity="d.o"
      stroke-width="0.9"
      stroke-linecap="round"
    />
    <circle
      v-for="(f, i) in scene.flakes"
      :key="`f${i}`"
      :cx="f.x"
      :cy="f.y"
      :r="f.r"
      fill="#ffffff"
      :opacity="f.o"
      :filter="f.soft ? `url(#${id}c)` : undefined"
    />
    <path :d="scene.waves[0]" fill="#ffffff" opacity="0.045" />
    <path :d="scene.waves[1]" fill="#ffffff" opacity="0.06" />
    <path :d="scene.waves[2]" fill="#ffffff" opacity="0.08" />
    <rect x="0" y="0" width="360" :height="hb" :filter="`url(#${id}n)`" opacity="0.07" />
  </svg>
</template>

<script>
import { skyScene } from '@/utils/share/skyArt'
import { moonGlyphPath } from '@/utils/share/moonGlyph'

let uid = 0

export default {
  name: 'ShareSky',
  props: {
    /** utils/share/skyPalette skyPalette() */
    pal: { type: Object, required: true },
    /** the card's height in its 360-unit space */
    hb: { type: Number, required: true },
    /** { k (lit fraction), waxing } */
    moon: { type: Object, default: () => ({ k: 0.5, waxing: true }) },
    /** pixels the card is drawn at, so the grain stays pixel-fine */
    pixelWidth: { type: Number, default: 360 }
  },
  data() {
    uid += 1
    return { id: `tidy-sky${uid}-` }
  },
  computed: {
    scene() {
      return skyScene(this.pal, this.hb)
    },
    grainFrequency() {
      return ((0.9 * this.pixelWidth) / 360).toFixed(3)
    },
    moonPath() {
      return moonGlyphPath(19, this.moon.k, this.moon.waxing)
    }
  }
}
</script>
