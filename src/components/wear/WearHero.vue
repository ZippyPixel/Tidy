<template>
  <section
    :aria-label="ready ? $t('wear.page.outfitLabel', { headline }) : $t('wear.page.outfit')"
    class="relative isolate flex min-h-[560px] flex-col self-stretch overflow-hidden rounded-card md:min-h-[640px] lg:min-h-[680px]"
  >
    <!-- design/TidyWear hero: the street in the window's light, the headline and the outfit as
         one sentence over the sky, the character standing on the road. Scene colours are fixed,
         so the text uses the scene's own ink, not theme tokens. -->
    <WearScene v-if="ready" :tod="tod" :cloudy="cloudy" :class="fadeClass" />
    <div v-else class="tidy-skeleton-soft absolute inset-0" aria-hidden="true" />

    <div
      aria-live="polite"
      class="relative z-[1] flex flex-col items-center gap-1.5 px-5 pt-[22px] text-center sm:px-10 sm:pt-8"
      :style="{ color: ink.ink }"
    >
      <template v-if="ready">
        <span class="text-sm font-medium leading-5 tabular-nums" :style="{ color: ink.ink2 }">
          {{ kicker }}
        </span>
        <h2
          class="m-0 text-[30px] font-[650] leading-9 tracking-[-0.015em] [text-wrap:balance] sm:text-[38px] sm:leading-[44px]"
          data-wear-hero-headline
        >
          {{ headline }}
        </h2>
        <p
          class="m-0 max-w-[520px] text-[15px] leading-[22px] [text-wrap:pretty] sm:text-[17px] sm:leading-[25px]"
          data-wear-sentence
        >
          <span
            v-for="(w, i) in words"
            :key="i"
            :class="w.bold ? 'font-[650]' : ''"
            :style="{ color: w.bold ? ink.ink : ink.ink2 }"
            >{{ w.t }}</span
          >
        </p>
        <span
          class="mt-0.5 text-[13px] font-medium leading-[18px] tabular-nums"
          :style="{ color: ink.ink2 }"
        >
          {{ feels }}
        </span>
      </template>
      <template v-else>
        <Skeleton class="h-3 w-[140px]" />
        <Skeleton class="h-7 w-[240px] rounded-md" />
        <Skeleton class="h-3.5 w-[min(300px,100%)]" />
      </template>
    </div>

    <div class="relative min-h-[300px] flex-auto sm:min-h-[380px]">
      <!-- feet on the pavement: the scene's road is its bottom tenth -->
      <div
        v-if="ready"
        class="absolute bottom-1.5 left-1/2 aspect-[240/484] h-[330px] max-h-full -translate-x-1/2 sm:bottom-2.5 md:h-[400px] lg:h-[440px]"
        :class="fadeClass"
      >
        <WearFigure :outfit="rec.outfit" :figure="figure" :label="figureLabel" />
      </div>
      <div
        v-else
        class="absolute bottom-3 left-1/2 flex aspect-[240/484] h-[86%] -translate-x-1/2 flex-col items-center gap-2.5"
        aria-hidden="true"
      >
        <Skeleton class="aspect-square w-[30%] rounded-full" />
        <Skeleton class="w-[56%] flex-1 rounded-[40px_40px_16px_16px]" />
      </div>
    </div>
  </section>
</template>

<script>
import { Skeleton } from '@/components/ui/skeleton'
import { currentIntlTag } from '@/i18n'
import { CLOUDY_KINDS } from '@/constants/wear'
import { scene, sentence } from '@/utils/wear'
import WearScene from './WearScene.vue'
import WearFigure from './WearFigure.vue'

const MARK = '\u0001'

export default {
  name: 'WearHero',
  components: { Skeleton, WearScene, WearFigure },
  props: {
    win: { type: Object, default: null },
    rec: { type: Object, default: null },
    tod: { type: String, default: 'day' },
    figure: { type: String, default: 'man' },
    kicker: { type: String, default: '' },
    headline: { type: String, default: '' },
    feels: { type: String, default: '' },
    fadeClass: { type: String, default: '' },
    // translates a message from the engine
    text: { type: Function, required: true }
  },
  computed: {
    ready() {
      return !!(this.win && this.rec)
    },
    cloudy() {
      return CLOUDY_KINDS.includes(this.win?.summary.kind)
    },
    ink() {
      const sc = scene(this.tod)
      return { ink: sc.ink, ink2: sc.ink2 }
    },
    // the outfit as one sentence with the pieces in bold: the locale's template, split at
    // its slots, each slot filled with the piece's name (with its article)
    words() {
      if (!this.rec) return []
      const s = sentence(this.rec)
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
    figureLabel() {
      if (!this.rec) return ''
      const list = new Intl.ListFormat(currentIntlTag(), { type: 'conjunction' }).format(
        this.rec.pieces.map((p) => this.text(p.name).toLowerCase())
      )
      return this.$t('wear.page.figureLabel', { list })
    }
  }
}
</script>
