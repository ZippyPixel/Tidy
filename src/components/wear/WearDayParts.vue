<template>
  <section
    :aria-labelledby="titleId"
    :aria-busy="loading ? 'true' : undefined"
    class="flex min-w-0 flex-col gap-4 rounded-card border bg-card p-4 text-card-foreground sm:p-6"
  >
    <!-- design/TidyWear "Through the day" (third pass): each part of the day on its own street.
         The character stands on the road (absolutely placed, feet in the road band) and the
         caption sits on glass over the sky: across the top, or right of the character on phones. -->
    <div class="flex flex-wrap items-baseline justify-between gap-3">
      <h2 :id="titleId" class="m-0 text-sm font-medium leading-6 text-muted-foreground">
        {{ $t('wear.page.throughDay') }}
      </h2>
      <span v-if="!loading" class="text-[13px] text-muted-foreground">{{ note }}</span>
    </div>
    <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
      <template v-if="!loading">
        <button
          v-for="d in tiles"
          :key="d.id"
          type="button"
          :aria-pressed="String(d.on)"
          :aria-label="d.aria"
          class="relative isolate block h-[148px] min-w-0 overflow-hidden rounded-tile p-0 text-left outline-ring hover:shadow-[0_0_0_1px_hsl(var(--foreground)/0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:h-[300px]"
          :class="[
            d.on ? 'shadow-[0_0_0_2px_hsl(var(--ring))]' : 'shadow-[0_0_0_1px_hsl(var(--border))]',
            fadeClass
          ]"
          data-wear-part
          @click="$emit('pick', d.id)"
        >
          <WearScene :tod="d.tod" />
          <div
            class="absolute bottom-[5px] left-[54px] aspect-[240/484] h-[126px] -translate-x-1/2 sm:bottom-[7px] sm:left-1/2 sm:h-[184px]"
            data-wear-part-figure
          >
            <WearFigure :outfit="d.outfit" :figure="figure" />
          </div>
          <div
            class="wear-glass absolute left-[108px] right-2.5 top-1/2 flex min-w-0 -translate-y-1/2 flex-col gap-px rounded-[var(--radius)] px-3 py-2 sm:left-2.5 sm:top-2.5 sm:translate-y-0"
            data-wear-part-caption
          >
            <span class="text-xs font-medium leading-4 text-muted-foreground [text-wrap:pretty]">{{
              d.when
            }}</span>
            <span class="text-[15px] font-semibold leading-5 tabular-nums">{{ d.temp }}</span>
            <span class="text-[13px] leading-[18px] text-muted-foreground">{{ d.line }}</span>
          </div>
        </button>
      </template>
      <template v-else>
        <div
          v-for="k in 3"
          :key="k"
          class="tidy-skeleton-soft h-[148px] rounded-tile sm:h-[300px]"
          aria-hidden="true"
        />
      </template>
    </div>
  </section>
</template>

<script>
import { useId } from 'vue'
import { todOf } from '@/utils/wear'
import WearScene from './WearScene.vue'
import WearFigure from './WearFigure.vue'

export default {
  name: 'WearDayParts',
  components: { WearScene, WearFigure },
  props: {
    // the windows of wearMixin and the one on screen
    windows: { type: Array, default: () => [] },
    win: { type: Object, default: null },
    figure: { type: String, default: 'man' },
    loading: { type: Boolean, default: false },
    fadeClass: { type: String, default: '' },
    // win -> recommendation, summary -> "1 PM–10 PM", temp(c) -> "13°", message -> text
    recommend: { type: Function, required: true },
    span: { type: Function, required: true },
    temp: { type: Function, required: true },
    text: { type: Function, required: true }
  },
  emits: ['pick'],
  setup() {
    return { titleId: useId() }
  },
  computed: {
    dayGroup() {
      return this.win?.day === 'tomorrow' ? 'tomorrow' : 'today'
    },
    note() {
      return this.$t(
        this.dayGroup === 'today' ? 'wear.page.dayNoteToday' : 'wear.page.dayNoteTomorrow'
      )
    },
    // the parts of the chosen day still ahead, topped up from tomorrow so there are always three
    parts() {
      let parts = this.windows.filter((w) => w.group === this.dayGroup)
      if (parts.length < 3) {
        const more = this.windows.filter((w) => w.group === 'tomorrow' && !parts.includes(w))
        parts = parts.concat(more).slice(0, 3)
      }
      return parts
    },
    tiles() {
      return this.parts.map((w) => {
        const r = this.recommend(w)
        const s = w.summary
        const name =
          w.day !== this.dayGroup
            ? this.$t(`wear.part.tomorrow.${w.part}`)
            : this.$t(`wear.window.${w.part}`)
        const when = this.$t('wear.kicker', { when: name, span: this.span(s) })
        const lo = this.temp(s.feelsMin)
        const hi = this.temp(s.feelsMax)
        const flat = Math.round(s.feelsMin) === Math.round(s.feelsMax)
        const temp = flat ? lo : this.$t('wear.tempSpan', { lo, hi })
        const feels = flat
          ? this.$t('wear.feels.one', { t: lo })
          : this.$t('wear.feels.span', { lo, hi })
        const line = this.text(r.headline)
        return {
          id: w.id,
          on: this.win?.id === w.id,
          tod: todOf(s),
          outfit: r.outfit,
          when,
          temp,
          line,
          aria: this.$t('wear.page.tileLabel', { when, feels, headline: line })
        }
      })
    }
  }
}
</script>
