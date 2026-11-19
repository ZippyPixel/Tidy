<template>
  <div class="share-card-box" :style="boxStyle">
    <!-- design/TidyShareCard: drawn in a 360-unit space. The outer box is a size container and
         every length is calc(var(--u) * n) with --u = 100cqw / 360, so the card renders at any
         width the parent gives it (preview) or at 1080 (export) without measuring anything. -->
    <div
      role="img"
      :aria-label="ariaLabel"
      class="share-card relative"
      :class="sticker ? '' : 'h-full overflow-hidden'"
      :style="rootStyle"
    >
      <template v-if="look === 'sky'">
        <img v-if="skyImage" :src="skyImage" alt="" class="absolute inset-0 block h-full w-full" />
        <ShareSky v-else ref="sky" :pal="pal" :hb="hb" :moon="data.moon" :pixel-width="pixelWidth" />
      </template>

      <template v-else-if="look === 'photo'">
        <img v-if="photo" :src="photo" alt="" class="absolute inset-0 block h-full w-full object-cover" />
        <div v-else class="absolute inset-0 flex flex-col items-center justify-center" :style="emptyStyle">
          <svg viewBox="0 0 24 24" aria-hidden="true" :style="{ width: u(34), height: u(34) }" v-bind="strokeIcon">
            <path :d="ICON.golden" />
          </svg>
          <span :style="{ fontSize: u(14), fontWeight: 500 }">{{ $t('share.card.addPhoto') }}</span>
        </div>
      </template>

      <!-- a soft shade so white text reads on any sky or photo; no boxes anywhere -->
      <template v-if="!sticker">
        <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0 h-[38%]" :style="{ background: shade.top }" />
        <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 bottom-0 h-[60%]" :style="{ background: shade.bottom }" />
      </template>

      <div class="flex flex-col" :class="sticker ? 'relative' : 'absolute inset-0'" :style="contentStyle">
        <div v-if="lines.top" class="flex min-w-0 flex-col" :style="{ gap: u(4) }">
          <span v-if="lines.place && data.placeName" class="flex min-w-0 items-center" :style="placeStyle">
            <svg viewBox="0 0 24 24" aria-hidden="true" class="flex-none" :style="pinStyle" v-bind="strokeIcon">
              <path :d="ICON.place" />
            </svg>
            <span class="min-w-0 truncate">{{ data.placeName }}</span>
          </span>
          <span v-if="lines.date" :style="dateStyle">{{ data.dateLine }}</span>
        </div>

        <div v-if="hero" class="flex min-w-0 flex-col" :style="heroStyle">
          <span v-if="showTemp" :style="tempStyle">{{ data.temp }}</span>
          <span v-if="showSummary" :style="condStyle">{{ data.summary }}</span>
          <span v-if="subLine" :style="subStyle">{{ subLine }}</span>
        </div>

        <div v-if="items.length" class="grid grid-cols-2 items-start" :style="gridStyle">
          <div
            v-for="item in items"
            :key="item.id"
            :data-detail="item.id"
            class="flex min-w-0 flex-col"
            :class="{ 'col-span-2': item.id === 'wear', 'self-center': item.id === 'moon' }"
            :style="{ gap: u(8) }"
          >
            <!-- moon: the phase alone, no words -->
            <svg
              v-if="item.id === 'moon'"
              viewBox="-20 -20 40 40"
              aria-hidden="true"
              class="flex-none"
              :style="{ width: u(sz.moon), height: u(sz.moon), filter: darkInk ? 'none' : `drop-shadow(0 0 ${u(6)} rgba(255,255,255,0.25))` }"
            >
              <circle r="17" :fill="tint(darkInk ? 0.08 : 0.12)" />
              <path :d="item.moonPath" :fill="darkInk ? '#3B4352' : '#F6F2E6'" />
              <circle r="17" fill="none" :stroke="tint(darkInk ? 0.45 : 0.6)" stroke-width="1" />
            </svg>

            <!-- sun: the dashboard's day curve in miniature, sunrise and sunset under its ends -->
            <template v-else-if="item.id === 'sun'">
              <div aria-hidden="true" class="relative w-full" :style="{ maxWidth: u(156), height: u(sz.arcH) }">
                <svg viewBox="0 0 100 40" preserveAspectRatio="none" class="absolute inset-0 h-full w-full overflow-visible">
                  <defs>
                    <linearGradient :id="`${uid}fade`" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="0">
                      <stop offset="0" :stop-color="inkColor" stop-opacity="0" />
                      <stop offset="0.12" :stop-color="inkColor" :stop-opacity="darkInk ? 0.4 : 0.5" />
                      <stop offset="0.88" :stop-color="inkColor" :stop-opacity="darkInk ? 0.4 : 0.5" />
                      <stop offset="1" :stop-color="inkColor" stop-opacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    :d="item.arc.full"
                    fill="none"
                    :stroke="`url(#${uid}fade)`"
                    vector-effect="non-scaling-stroke"
                    stroke-linecap="round"
                    :style="{ strokeWidth: u(1.4), strokeDasharray: `${u(2.5)} ${u(3)}` }"
                  />
                  <path
                    :d="item.arc.lit"
                    fill="none"
                    :stroke="sunColor"
                    vector-effect="non-scaling-stroke"
                    stroke-linecap="round"
                    :style="{ strokeWidth: u(2.6), filter: iconShadow }"
                  />
                </svg>
                <span
                  v-if="item.arc.up"
                  class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                  :style="{ left: `${item.arc.dot.x}%`, top: `${item.arc.dot.y}%`, width: u(30), height: u(30), background: `radial-gradient(${sunColor}aa, ${sunColor}00 68%)` }"
                />
                <span
                  class="absolute box-border -translate-x-1/2 -translate-y-1/2 rounded-full"
                  :style="{
                    left: `${item.arc.dot.x}%`,
                    top: `${item.arc.dot.y}%`,
                    width: u(11),
                    height: u(11),
                    border: `${u(2)} solid ${darkInk ? '#ffffff' : 'rgba(255,255,255,0.95)'}`,
                    background: item.arc.up ? sunColor : tint(0.5),
                    boxShadow: `0 ${u(1)} ${u(3)} rgba(0,0,0,0.3)`
                  }"
                />
              </div>
              <div aria-hidden="true" class="relative w-full" :style="{ maxWidth: u(156), height: u(sz.small * 1.25), marginTop: u(-3) }">
                <span :style="arcLabel(item.arc.riseX)">{{ data.sunrise }}</span>
                <span :style="arcLabel(item.arc.setX)">{{ data.sunset }}</span>
              </div>
            </template>

            <template v-else>
              <div class="flex min-w-0 items-center" :style="{ gap: u(7), minHeight: u(sz.val * 1.2) }">
                <!-- wind: the basic card's arrow, pointing where the wind blows to -->
                <svg
                  v-if="item.id === 'wind'"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  class="flex-none"
                  :style="{ width: u(sz.glyph - 3), height: u(sz.glyph - 3), transform: `rotate(${item.degree + 180}deg)`, filter: iconShadow, margin: `0 ${u(1.5)}` }"
                >
                  <path d="M12 3 L19 21 L12 16.5 L5 21 Z" :fill="inkColor" />
                </svg>
                <span v-else-if="item.badge" aria-hidden="true" class="inline-flex flex-none items-center justify-center" :style="badgeStyle">
                  {{ item.badge }}
                </span>
                <div v-else-if="item.id === 'wear'" class="flex-none" :style="figStyle">
                  <WearFigure :outfit="item.outfit" :figure="item.figure" :shadow="false" />
                </div>
                <svg v-else viewBox="0 0 24 24" aria-hidden="true" class="flex-none" :style="glyphStyle" v-bind="strokeIcon">
                  <path :d="ICON[item.id]" />
                </svg>
                <span :style="item.id === 'wear' ? wearValueStyle : valueStyle">
                  {{ item.value }}<span v-if="item.unit" :style="unitStyle">{{ item.unit }}</span>
                </span>
                <svg
                  v-if="item.id === 'tide'"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  class="flex-none"
                  :style="{ ...glyphStyle, width: u(sz.glyph - 2), height: u(sz.glyph - 2), marginLeft: u(-1) }"
                  v-bind="strokeIcon"
                  stroke-width="2.4"
                >
                  <path :d="item.rising ? ARROW_UP : ARROW_DOWN" />
                </svg>
              </div>

              <!-- the scale from the detail modal: segments with small gaps and a ringed marker -->
              <div v-if="item.scale" aria-hidden="true" class="relative flex w-full items-center" :style="{ maxWidth: u(150), height: u(sz.scaleH + 6) }">
                <div class="flex w-full overflow-hidden" :style="trackStyle">
                  <span v-for="(seg, i) in item.scale.segments" :key="i" class="h-full" :style="{ flex: `${seg.flex} 1 0`, background: seg.color }" />
                </div>
                <span
                  class="absolute top-1/2 box-border -translate-x-1/2 -translate-y-1/2 rounded-full"
                  :style="{
                    left: `${item.scale.marker.left}%`,
                    width: u(sz.scaleH + 7),
                    height: u(sz.scaleH + 7),
                    border: `${u(2.6)} solid #ffffff`,
                    background: item.scale.marker.color,
                    boxShadow: `0 0 0 ${u(0.75)} rgba(0,0,0,0.3), 0 ${u(1)} ${u(3)} rgba(0,0,0,0.3)`
                  }"
                />
              </div>
            </template>
          </div>
        </div>

        <div class="flex items-baseline justify-between" :style="footStyle">
          <span :style="markStyle">TIDY</span>
          <span v-if="link && site" :style="urlStyle">{{ site }}</span>
        </div>
      </div>

      <!-- Instagram's story overlays: drawn in the composer only, never exported -->
      <template v-if="guides && format === 'story' && !sticker">
        <div aria-hidden="true" class="share-guide top-0 items-end border-b" :style="{ height: `${(180 / 1920) * 100}%` }">
          <span class="share-guide-label">{{ $t('share.card.profileRow') }}</span>
        </div>
        <div aria-hidden="true" class="share-guide bottom-0 items-start border-t" :style="{ height: `${(200 / 1920) * 100}%` }">
          <span class="share-guide-label">{{ $t('share.card.replyBar') }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import ShareSky from '@/components/share/ShareSky.vue'
import WearFigure from '@/components/wear/WearFigure.vue'
import { skyPalette, hexAlpha } from '@/utils/share/skyPalette'
import { headerLayout, RATIOS } from '@/utils/share/shareContent'
import { aqiScale, uvScale, visibilityScale } from '@/utils/share/scales'
import { sunArc } from '@/utils/share/sunArc'
import { moonGlyphPath } from '@/utils/share/moonGlyph'

const ICON = {
  visibility: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z',
  rain: 'M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9z M12 12v6.5a2 2 0 0 0 4 0',
  humidity:
    'M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97',
  cloud: 'M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z',
  golden: 'M4 7.5h3l2-3h6l2 3h3V20H4z M12 10a4 4 0 1 0 0 8a4 4 0 1 0 0-8z',
  tide: 'M2 9c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2 M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2',
  place: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z M12 7.2a2.4 2.4 0 1 0 0 4.8a2.4 2.4 0 1 0 0-4.8z'
}
const ARROW_UP = 'M12 19V5 M5.5 11.5 12 5l6.5 6.5'
const ARROW_DOWN = 'M12 5v14 M18.5 12.5 12 19l-6.5-6.5'

// sizes in the 360-unit space. Story padding keeps text out of Instagram's overlays:
// 66 / 360 × 1080 ≈ 198 px under the top 180 px; 72 → 216 px over the bottom 200 px
const SIZES = {
  story: { padX: 28, padT: 66, padB: 72, temp: 104, cond: 19, condHero: 36, sub: 12, place: 14, date: 11.5, val: 20, unit: 11.5, glyph: 18, rowGap: 22, colGap: 24, flow: 16, scaleH: 6, moon: 30, arcH: 32, small: 10.5 },
  post: { padX: 28, padT: 28, padB: 24, temp: 81, cond: 17, condHero: 30.5, sub: 11.5, place: 13, date: 11, val: 18, unit: 11, glyph: 17, rowGap: 16, colGap: 22, flow: 12, scaleH: 5.5, moon: 26, arcH: 28, small: 10 },
  square: { padX: 24, padT: 24, padB: 22, temp: 65, cond: 15, condHero: 25, sub: 11, place: 12.5, date: 10.5, val: 16, unit: 10.5, glyph: 16, rowGap: 13, colGap: 20, flow: 10, scaleH: 5, moon: 24, arcH: 25, small: 9.5 },
  sticker: { padX: 22, padT: 20, padB: 20, temp: 70, cond: 16, condHero: 27, sub: 11.5, place: 13, date: 11, val: 18, unit: 11, glyph: 17, rowGap: 16, colGap: 22, flow: 12, scaleH: 5.5, moon: 26, arcH: 28, small: 10 }
}

const FONT = "'Roboto Flex', 'Noto Sans Bengali', system-ui, -apple-system, 'Segoe UI', sans-serif"
let uid = 0

export default {
  name: 'ShareCard',
  components: { ShareSky, WearFigure },
  props: {
    look: { type: String, default: 'sky' },
    format: { type: String, default: 'story' },
    /** the sticker's text colour: 'white' | 'dark' */
    ink: { type: String, default: 'white' },
    /** the top lines (utils/share/shareContent HEADER_LINES) */
    header: { type: Array, required: true },
    /** the details, already fitted to the card */
    details: { type: Array, required: true },
    /** what the card says, formatted (composables/useShareData) */
    data: { type: Object, required: true },
    link: { type: Boolean, default: true },
    /** the site as printed, e.g. "tidy.example" */
    site: { type: String, default: '' },
    /** object URL of the person's photo */
    photo: { type: String, default: '' },
    /** a painted sky (PNG data URL) to draw instead of the SVG, for the export */
    skyImage: { type: String, default: '' },
    guides: { type: Boolean, default: false },
    /** the sticker's checkerboard (preview only; the export is transparent) */
    checker: { type: Boolean, default: true },
    /** pixels the card is drawn at, for the grain */
    pixelWidth: { type: Number, default: 360 }
  },
  data() {
    uid += 1
    return { uid: `tidy-card${uid}-`, ICON, ARROW_UP, ARROW_DOWN }
  },
  computed: {
    sticker() {
      return this.look === 'sticker'
    },
    sz() {
      return SIZES[this.sticker ? 'sticker' : this.format] || SIZES.story
    },
    hb() {
      return Math.round(360 * (RATIOS[this.format] || RATIOS.story))
    },
    darkInk() {
      return this.sticker && this.ink === 'dark'
    },
    inkColor() {
      return this.darkInk ? '#111827' : '#ffffff'
    },
    inkSoft() {
      return this.darkInk ? 'rgba(17,24,39,0.7)' : 'rgba(255,255,255,0.82)'
    },
    iconShadow() {
      if (this.darkInk) return 'none'
      const s = this.sticker
      return `drop-shadow(0 ${this.u(1)} ${this.u(s ? 3 : 1.5)} rgba(0,0,0,${s ? 0.45 : 0.28}))`
    },
    sunColor() {
      return this.darkInk ? '#E08A1E' : '#FFD27A'
    },
    pal() {
      const d = this.data
      return skyPalette({ code: d.code, now: d.nowMin, rise: d.rise, set: d.set })
    },
    shade() {
      if (this.look === 'photo') {
        return {
          top: 'linear-gradient(180deg, rgba(0,0,0,0.42), rgba(0,0,0,0))',
          bottom: 'linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0) 92%)'
        }
      }
      const s = this.pal.shade
      return {
        top: `linear-gradient(180deg, ${hexAlpha(s, 0.22)}, ${hexAlpha(s, 0)})`,
        bottom: `linear-gradient(0deg, ${hexAlpha(s, 0.62)}, ${hexAlpha(s, 0)} 92%)`
      }
    },
    lines() {
      return headerLayout(this.header)
    },
    // weather lines hide when there is no weather for the moment (an old photo)
    showTemp() {
      return this.lines.temp && !!this.data.temp
    },
    showSummary() {
      return this.lines.summary && !!this.data.summary
    },
    subLine() {
      const parts = []
      if (this.lines.hilo && this.data.hilo) parts.push(this.data.hilo)
      if (this.lines.feels && this.data.feels) parts.push(this.data.feels)
      return parts.join('   ·   ')
    },
    hero() {
      return this.showTemp || this.showSummary || !!this.subLine
    },
    items() {
      const d = this.data
      const out = []
      for (const id of this.details) {
        const item = this.itemFor(id, d)
        if (item) out.push(item)
      }
      return out
    },
    ariaLabel() {
      const top = [
        this.lines.place ? this.data.placeName : '',
        this.lines.date ? this.data.dateLine : '',
        this.showTemp ? this.data.temp : '',
        this.showSummary ? this.data.summary : '',
        this.subLine
      ].filter(Boolean)
      const parts = [this.$t('share.card.aria'), top.join(', '), ...this.items.map((i) => i.spoken)]
      return parts.filter(Boolean).join('. ')
    },

    /* ── styles ── */
    boxStyle() {
      return {
        containerType: 'inline-size',
        width: '100%',
        aspectRatio: this.sticker ? undefined : `360 / ${this.hb}`,
        lineHeight: 'normal'
      }
    },
    rootStyle() {
      const base = {
        '--u': 'calc(100cqw / 360)',
        width: '100%',
        fontFamily: FONT,
        WebkitFontSmoothing: 'antialiased',
        color: this.inkColor,
        textShadow: this.darkInk
          ? 'none'
          : `0 ${this.u(1)} ${this.u(this.sticker ? 6 : 3)} rgba(0,0,0,${this.sticker ? 0.42 : 0.26})`
      }
      if (this.sticker) {
        let background = 'transparent'
        if (this.checker)
          background = this.darkInk
            ? 'repeating-conic-gradient(#E3E6EB 0% 25%, #F6F7F9 0% 50%) 50% / 16px 16px'
            : 'repeating-conic-gradient(#3A404B 0% 25%, #2B3039 0% 50%) 50% / 16px 16px'
        return { ...base, background }
      }
      return { ...base, isolation: 'isolate', background: this.look === 'sky' ? this.pal.a : '#151A24' }
    },
    emptyStyle() {
      return { gap: this.u(8), background: 'linear-gradient(160deg, #2B3446, #151A24)', color: 'rgba(255,255,255,0.78)' }
    },
    strokeIcon() {
      return { fill: 'none', stroke: 'currentColor', 'stroke-width': 1.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }
    },
    contentStyle() {
      const s = this.sz
      return { padding: `${this.u(s.padT)} ${this.u(s.padX)} ${this.u(s.padB)}`, gap: this.u(s.flow) }
    },
    placeStyle() {
      return { gap: this.u(5), fontSize: this.u(this.sz.place), fontWeight: 600, lineHeight: 1.25, letterSpacing: '0.005em' }
    },
    pinStyle() {
      return { width: this.u(this.sz.place), height: this.u(this.sz.place), filter: this.iconShadow, strokeWidth: 2 }
    },
    dateStyle() {
      return { fontSize: this.u(this.sz.date), lineHeight: 1.3, fontWeight: 450, color: this.inkSoft, fontVariantNumeric: 'tabular-nums' }
    },
    heroStyle() {
      return { gap: this.u(this.lines.summaryHero ? 6 : 8), marginTop: this.u(this.lines.top ? 2 : 0) }
    },
    tempStyle() {
      const t = this.sz.temp
      return {
        fontSize: this.u(t),
        lineHeight: 0.84,
        fontWeight: 220,
        letterSpacing: '-0.055em',
        marginLeft: this.u(-t * 0.055),
        fontVariantNumeric: 'tabular-nums',
        fontVariationSettings: "'opsz' 144"
      }
    },
    condStyle() {
      if (this.lines.summaryHero && !this.showTemp)
        return { fontSize: this.u(this.sz.condHero), lineHeight: 1.08, fontWeight: 330, letterSpacing: '-0.025em', textWrap: 'balance', fontVariationSettings: "'opsz' 72" }
      return { fontSize: this.u(this.sz.cond), lineHeight: 1.2, fontWeight: 520, letterSpacing: '-0.005em' }
    },
    subStyle() {
      return { fontSize: this.u(this.sz.sub), lineHeight: 1.35, fontWeight: 450, color: this.inkSoft, fontVariantNumeric: 'tabular-nums', whiteSpace: 'pre' }
    },
    gridStyle() {
      return { marginTop: this.sticker ? this.u(4) : 'auto', columnGap: this.u(this.sz.colGap), rowGap: this.u(this.sz.rowGap) }
    },
    glyphStyle() {
      return { width: this.u(this.sz.glyph), height: this.u(this.sz.glyph), color: this.inkColor, filter: this.iconShadow }
    },
    valueStyle() {
      return {
        fontSize: this.u(this.sz.val),
        lineHeight: 1.15,
        fontWeight: 500,
        letterSpacing: '-0.01em',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        minWidth: 0
      }
    },
    wearValueStyle() {
      return {
        ...this.valueStyle,
        fontSize: this.u(this.sz.val * 0.8),
        whiteSpace: 'normal',
        lineHeight: 1.2,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
      }
    },
    unitStyle() {
      return { fontSize: this.u(this.sz.unit), fontWeight: 400, letterSpacing: 0, color: this.inkSoft, marginLeft: this.u(3) }
    },
    badgeStyle() {
      const g = this.sz.glyph - 1
      return {
        height: this.u(g),
        minWidth: this.u(g),
        padding: `0 ${this.u(3.5)}`,
        boxSizing: 'border-box',
        borderRadius: this.u(5),
        border: `${this.u(1.6)} solid ${this.inkColor}`,
        fontSize: this.u(8),
        fontWeight: 750,
        letterSpacing: '0.02em',
        lineHeight: 1,
        color: this.inkColor,
        textShadow: 'none',
        filter: this.iconShadow
      }
    },
    figStyle() {
      return {
        height: this.u(this.sz.val * 2.6),
        aspectRatio: '240 / 484',
        filter: this.darkInk ? 'none' : `drop-shadow(0 ${this.u(1)} ${this.u(3)} rgba(0,0,0,0.3))`
      }
    },
    trackStyle() {
      return {
        gap: this.u(1.6),
        height: this.u(this.sz.scaleH),
        borderRadius: this.u(3),
        boxShadow: this.darkInk ? 'none' : `0 ${this.u(1)} ${this.u(3)} rgba(0,0,0,0.22)`
      }
    },
    footStyle() {
      const full = !this.sticker
      return {
        gap: this.u(8),
        marginTop: full && !this.items.length ? 'auto' : this.u(full ? 4 : 2)
      }
    },
    markStyle() {
      return { fontSize: this.u(11.5), fontWeight: 650, letterSpacing: '0.46em', lineHeight: 1, flex: 'none' }
    },
    urlStyle() {
      return { fontSize: this.u(10.5), fontWeight: 500, lineHeight: 1, letterSpacing: '0.01em', color: this.inkSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }
    }
  },
  methods: {
    /** n units of the 360-wide card */
    u(n) {
      return `calc(var(--u) * ${+n.toFixed(3)})`
    },
    tint(a) {
      return this.darkInk ? `rgba(17,24,39,${a})` : `rgba(255,255,255,${a})`
    },
    arcLabel(x) {
      const w = 56
      return {
        position: 'absolute',
        top: 0,
        width: this.u(w),
        left: `clamp(0px, calc(${x}% - ${this.u(w / 2)}), calc(100% - ${this.u(w)}))`,
        textAlign: 'center',
        fontSize: this.u(this.sz.small),
        lineHeight: 1.2,
        fontWeight: 500,
        color: this.inkSoft,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap'
      }
    },
    /** one detail, or null when there is nothing to show for it */
    itemFor(id, d) {
      const t = this.$t
      switch (id) {
        case 'wind':
          if (!d.wind) return null
          return { id, degree: d.wind.degree, value: d.wind.value, unit: d.wind.unit, spoken: d.wind.spoken }
        case 'uv':
          if (d.uv == null) return null
          return { id, badge: t('share.card.uv'), value: d.uvText, scale: uvScale(d.uv), spoken: t('share.spoken.uv', { value: d.uvText }) }
        case 'aqi':
          if (d.aqi == null) return null
          return { id, badge: t('share.card.aqi'), value: d.aqiText, scale: aqiScale(d.aqi), spoken: t('share.spoken.aqi', { value: d.aqiText }) }
        case 'visibility':
          if (!d.visibility) return null
          return {
            id,
            value: d.visibility.value,
            unit: d.visibility.unit,
            scale: visibilityScale(d.visibility.km, { dark: this.darkInk }),
            spoken: t('share.spoken.visibility', { value: d.visibility.value, unit: d.visibility.unit })
          }
        case 'rain':
        case 'humidity':
        case 'cloud':
          if (!d[id]) return null
          return { id, value: d[id], spoken: t(`share.spoken.${id}`, { value: d[id] }) }
        case 'golden':
          if (!d.golden) return null
          return { id, value: d.golden, spoken: t('share.spoken.golden', { time: d.golden }) }
        case 'tide':
          if (!d.tide) return null
          return {
            id,
            value: d.tide.value,
            unit: d.tide.unit,
            rising: d.tide.rising,
            spoken: t(d.tide.rising ? 'share.spoken.tideRising' : 'share.spoken.tideFalling', { value: d.tide.value, unit: d.tide.unit })
          }
        case 'wear':
          if (!d.wear) return null
          return { id, value: d.wear.headline, outfit: d.wear.outfit, figure: d.wear.figure, spoken: t('share.spoken.wear', { text: d.wear.headline }) }
        case 'sun': {
          const arc = sunArc(d.rise, d.set, d.nowMin)
          if (!arc) return null
          return { id, arc, spoken: t('share.spoken.sun', { rise: d.sunrise, set: d.sunset }) }
        }
        case 'moon':
          if (!d.moon) return null
          return { id, moonPath: moonGlyphPath(17, d.moon.k, d.moon.waxing), spoken: d.moon.spoken }
        default:
          return null
      }
    },
    /** the sky's <svg>, for the export to paint to a canvas */
    skyElement() {
      return this.$refs.sky?.$el || null
    }
  }
}
</script>

<style scoped>
.share-guide {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  pointer-events: none;
  border-color: rgba(255, 90, 90, 0.9);
  border-style: dashed;
  background: repeating-linear-gradient(135deg, rgba(255, 64, 64, 0.22) 0 6px, rgba(255, 64, 64, 0.08) 6px 12px);
}

.share-guide-label {
  margin: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  text-shadow: none;
}
</style>
