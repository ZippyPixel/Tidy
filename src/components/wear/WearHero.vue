<template>
  <section
    :aria-label="
      ready ? $t('wear.page.outfitLabel', { headline: current.headline }) : $t('wear.page.outfit')
    "
    class="tidy-motion relative isolate flex min-h-[604px] touch-pan-y flex-col self-stretch overflow-hidden rounded-card [--wear-road:44px] [--wear-slide:112px] md:min-h-[688px] md:[--wear-road:48px] md:[--wear-slide:150px] lg:min-h-[728px]"
    data-wear-hero
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointercancel="onCancel"
  >
    <!-- design/TidyWear hero: the street in the window's light, the headline and the outfit as
         one sentence over the sky, the character standing on the road. Up to three looks are
         stacked in place and move with the dots or a swipe (touch and pen). Scene colours are
         fixed, so the text uses the scene's own ink, not theme tokens. -->
    <div v-if="ready" class="absolute inset-x-0 top-0 bottom-[var(--wear-road)]">
      <WearScene :tod="tod" :cloudy="cloudy" :class="fadeClass" />
    </div>
    <div v-else class="tidy-skeleton-soft absolute inset-0" aria-hidden="true" />

    <div
      class="relative z-[1] flex flex-col items-center gap-1.5 px-5 pt-[22px] text-center sm:px-10 sm:pt-8"
      :style="{ color: ink.ink }"
    >
      <template v-if="ready">
        <span class="text-sm font-medium leading-5 tabular-nums" :style="{ color: ink.ink2 }">
          {{ kicker }}
        </span>
        <!-- every look's text shares one grid cell; the old one is gone by halfway, so lines
             never overlap -->
        <div class="grid w-full justify-items-center">
          <div
            v-for="(l, j) in items"
            :key="j"
            :aria-hidden="l.cur ? undefined : 'true'"
            class="flex flex-col items-center gap-1.5 [grid-area:1/1]"
            :style="l.textStyle"
          >
            <h2
              class="m-0 text-[30px] font-[650] leading-9 tracking-[-0.015em] [text-wrap:balance] sm:text-[38px] sm:leading-[44px]"
              :data-wear-hero-headline="l.cur ? '' : undefined"
            >
              {{ l.headline }}
            </h2>
            <p
              class="m-0 max-w-[520px] text-[15px] leading-[22px] [text-wrap:pretty] sm:text-[17px] sm:leading-[25px]"
              :data-wear-sentence="l.cur ? '' : undefined"
            >
              <span
                v-for="(w, i) in l.words"
                :key="i"
                :class="w.bold ? 'font-[650]' : ''"
                :style="{ color: w.bold ? ink.ink : ink.ink2 }"
                >{{ w.t }}</span
              >
            </p>
          </div>
        </div>
        <span
          class="mt-0.5 text-[13px] font-medium leading-[18px] tabular-nums"
          :style="{ color: ink.ink2 }"
        >
          {{ feels }}
        </span>
        <span aria-live="polite" class="sr-only" data-wear-live>{{ liveText }}</span>
      </template>
      <template v-else>
        <Skeleton class="h-3 w-[140px]" />
        <Skeleton class="h-7 w-[240px] rounded-md" />
        <Skeleton class="h-3.5 w-[min(300px,100%)]" />
      </template>
    </div>

    <div class="relative min-h-[344px] flex-auto sm:min-h-[424px] md:min-h-[428px]">
      <!-- feet on the pavement, just above the road band -->
      <!-- the skeleton fade sits on a wrapper: its animation would pin each look's opacity -->
      <div v-if="ready" class="absolute inset-0" :class="fadeClass">
        <div
          v-for="(l, j) in items"
          :key="j"
          :aria-hidden="l.cur ? undefined : 'true'"
          class="pointer-events-none absolute bottom-[calc(var(--wear-road)+6px)] left-1/2 aspect-[240/484] h-[330px] max-h-[calc(100%-var(--wear-road)-10px)] will-change-[transform,opacity] sm:bottom-[calc(var(--wear-road)+10px)] md:h-[400px] lg:h-[440px]"
          :style="l.figStyle"
          data-wear-look
        >
          <WearFigure :outfit="l.rec.outfit" :figure="figure" :label="l.label" />
        </div>
      </div>
      <div
        v-else
        class="absolute bottom-[calc(var(--wear-road)+12px)] left-1/2 flex aspect-[240/484] h-[86%] -translate-x-1/2 flex-col items-center gap-2.5"
        aria-hidden="true"
      >
        <Skeleton class="aspect-square w-[30%] rounded-full" />
        <Skeleton class="w-[56%] flex-1 rounded-[40px_40px_16px_16px]" />
      </div>
    </div>

    <!-- the road, carried on under the street, with a dot per look -->
    <div
      v-if="ready"
      class="absolute inset-x-0 bottom-0 z-[2] flex h-[var(--wear-road)] items-center justify-center"
      :style="{ background: road }"
    >
      <div
        v-if="items.length > 1"
        ref="dots"
        role="group"
        :aria-label="$t('wear.page.looksLabel')"
        class="flex items-center"
        @keydown="onDotKey"
      >
        <button
          v-for="(l, j) in items"
          :key="j"
          type="button"
          :aria-label="lookName(j)"
          :aria-current="l.cur ? 'true' : undefined"
          class="flex h-11 w-8 items-center justify-center rounded-full outline-white focus-visible:outline focus-visible:outline-2 focus-visible:[outline-offset:-6px]"
          :class="l.cur ? 'cursor-default' : 'cursor-pointer'"
          data-wear-dot
          @click="choose(j)"
        >
          <span
            class="block h-2 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-[width,background-color] duration-[360ms,240ms] ease-tidy"
            :class="l.cur ? 'w-[22px] bg-white' : 'w-2 bg-white/45'"
          />
        </button>
      </div>
    </div>
  </section>
</template>

<script>
import { Skeleton } from '@/components/ui/skeleton'
import { currentIntlTag } from '@/i18n'
import { CLOUDY_KINDS } from '@/constants/wear'
import weatherMixin from '@/mixins/weatherMixin'
import { scene, sentence } from '@/utils/wear'
import { lookKey, swipeCommit, swipeIntent, swipeOffset } from '@/utils/wearLooks'
import WearScene from './WearScene.vue'
import WearFigure from './WearFigure.vue'

const MARK = '\u0001'
const { formatNumber } = weatherMixin.methods
// how far a finger moves for one whole look, for the crossfade while swiping (phone / md and up)
const SWIPE_SPAN = [160, 220]

export default {
  name: 'WearHero',
  components: { Skeleton, WearScene, WearFigure },
  props: {
    win: { type: Object, default: null },
    // [{ rec, shuffle }] from utils/wearLooks buildLooks, and the one on screen
    looks: { type: Array, default: () => [] },
    look: { type: Number, default: 0 },
    tod: { type: String, default: 'day' },
    figure: { type: String, default: 'man' },
    kicker: { type: String, default: '' },
    feels: { type: String, default: '' },
    fadeClass: { type: String, default: '' },
    // translates a message from the engine
    text: { type: Function, required: true }
  },
  emits: ['update:look'],
  data() {
    // dx: the finger's offset while a swipe is live (0 otherwise)
    return { dx: 0, drag: null }
  },
  computed: {
    ready() {
      return !!(this.win && this.looks.length)
    },
    cur() {
      return Math.min(this.look, Math.max(0, this.looks.length - 1))
    },
    current() {
      return this.items[this.cur] || { headline: '' }
    },
    cloudy() {
      return CLOUDY_KINDS.includes(this.win?.summary.kind)
    },
    sc() {
      return scene(this.tod)
    },
    ink() {
      return { ink: this.sc.ink, ink2: this.sc.ink2 }
    },
    road() {
      return this.sc.road
    },
    // each look stacked in place: rel is how far it sits from the middle (0 = on screen), and
    // follows the finger while swiping
    items() {
      const dragging = this.dx !== 0
      const p = this.dx / (this.drag?.span || SWIPE_SPAN[0])
      return this.looks.map((l, j) => {
        const cur = j === this.cur
        const rel = j - this.cur + p
        const vis = Math.abs(rel) < 1
        const ease = 'var(--ease-tidy)'
        const fig = dragging
          ? 'none'
          : cur
          ? `transform 460ms ${ease}, opacity 300ms ease 60ms, visibility 0s linear 0s`
          : `transform 460ms ${ease}, opacity 220ms ease, visibility 0s linear ${vis ? 0 : 300}ms`
        const txt = dragging
          ? 'none'
          : cur
          ? 'opacity 220ms ease 140ms, visibility 0s linear 0s'
          : `opacity 140ms ease, visibility 0s linear ${vis ? 0 : 160}ms`
        return {
          cur,
          rec: l.rec,
          headline: this.text(l.rec.headline),
          words: this.words(l.rec),
          label: this.figureLabel(l.rec),
          figStyle: {
            transform: `translateX(calc(-50% + ${rel.toFixed(3)} * var(--wear-slide)))`,
            opacity: Math.max(0, 1 - Math.abs(rel)),
            visibility: vis ? 'visible' : 'hidden',
            transition: fig
          },
          textStyle: {
            opacity: Math.max(0, 1 - 2 * Math.abs(rel)),
            visibility: vis ? 'visible' : 'hidden',
            transition: txt
          }
        }
      })
    },
    liveText() {
      if (!this.ready) return ''
      const n = this.items.length
      return n > 1
        ? this.$t('wear.page.lookLive', {
            n: formatNumber(this.cur + 1),
            total: formatNumber(n),
            headline: this.current.headline
          })
        : this.current.headline
    }
  },
  watch: {
    // a new window or new settings start a new set of looks: drop any swipe in progress
    looks() {
      this.drag = null
      this.dx = 0
    }
  },
  methods: {
    lookName(j) {
      return this.$t('wear.page.lookOf', {
        n: formatNumber(j + 1),
        total: formatNumber(this.items.length)
      })
    },
    choose(j) {
      this.dx = 0
      if (j !== this.cur) this.$emit('update:look', j)
    },
    onDotKey(e) {
      const j = lookKey(e.key, this.cur, this.items.length)
      if (j === null) return
      e.preventDefault()
      this.choose(j)
      this.$nextTick(() => this.$refs.dots?.querySelectorAll('button')[j]?.focus())
    },
    // swipe between looks on touch and pen; the mouse uses the dots
    onDown(e) {
      if (e.pointerType === 'mouse' || this.items.length < 2 || e.target.closest?.('button')) return
      const wide =
        typeof window !== 'undefined' && window.matchMedia?.('(min-width: 768px)').matches
      this.drag = {
        x: e.clientX,
        y: e.clientY,
        id: e.pointerId,
        on: false,
        span: SWIPE_SPAN[wide ? 1 : 0]
      }
    },
    onMove(e) {
      const d = this.drag
      if (!d || e.pointerId !== d.id) return
      const dx = e.clientX - d.x
      if (!d.on) {
        const intent = swipeIntent(dx, e.clientY - d.y)
        if (intent === 'wait') return
        if (intent === 'scroll') {
          this.drag = null
          return
        }
        d.on = true
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          // the pointer is already gone
        }
      }
      this.dx = swipeOffset(dx, this.cur, this.items.length)
    },
    onUp(e) {
      const d = this.drag
      this.drag = null
      if (!d || !d.on) return
      const j = swipeCommit(e.clientX - d.x, this.cur, this.items.length)
      this.choose(j)
    },
    onCancel() {
      this.drag = null
      this.dx = 0
    },
    // the outfit as one sentence with the pieces in bold: the locale's template, split at
    // its slots, each slot filled with the piece's name (with its article)
    words(rec) {
      const s = sentence(rec)
      const piece = (id) => [{ t: this.$t(`wear.a.${id}`), bold: true }]
      const fill = (key, slots) => {
        const marked = Object.fromEntries(Object.keys(slots).map((k) => [k, MARK + k + MARK]))
        return this.$t(key, marked)
          .split(MARK)
          .flatMap((part, i) => (i % 2 ? slots[part] : part ? [{ t: part, bold: false }] : []))
      }
      const slots = Object.fromEntries(
        Object.entries(s.slots)
          .filter(([, id]) => id)
          .map(([k, id]) => [k, piece(id)])
      )
      const out = fill(`wear.sentence.${s.form}`, slots)
      if (out[0]) out[0] = { ...out[0], t: out[0].t.charAt(0).toUpperCase() + out[0].t.slice(1) }
      if (s.hood) out.push({ t: ' ' + this.$t('wear.sentence.hood'), bold: false })
      if (s.extra.length) {
        const names = s.extra.map((id) => this.$t(`wear.a.${id}`))
        const list = new Intl.ListFormat(currentIntlTag(), { type: 'conjunction' })
          .formatToParts(names)
          .map((p) => ({ t: p.value, bold: p.type === 'element' }))
        out.push({ t: ' ', bold: false }, ...fill('wear.sentence.add', { list }))
      }
      return out
    },
    figureLabel(rec) {
      const list = new Intl.ListFormat(currentIntlTag(), { type: 'conjunction' }).format(
        rec.pieces.map((p) => this.text(p.name).toLowerCase())
      )
      return this.$t('wear.page.figureLabel', { list })
    }
  }
}
</script>
