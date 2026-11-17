<template>
  <DashboardCard :title="$t('wear.page.wearing')" :busy="!ready" class="!gap-2">
    <!-- design/TidyWear "What you're wearing": each piece with a thumbnail of its slot and why -->
    <template v-if="ready">
      <ul class="m-0 flex list-none flex-col p-0" :class="fadeClass">
        <li
          v-for="(p, i) in rec.pieces"
          :key="p.slot"
          class="flex items-center gap-3.5 py-2.5"
          :class="i ? 'border-t' : ''"
          data-wear-piece
        >
          <div
            class="size-14 flex-none overflow-hidden rounded-[var(--radius)] bg-surface-raised p-1"
          >
            <WearFigure :outfit="rec.outfit" :figure="figure" :only="p.slot" crop="slot" />
          </div>
          <div class="flex min-w-0 flex-col gap-0.5">
            <span class="text-[15px] font-semibold leading-5">{{ text(p.name) }}</span>
            <span class="text-[13px] leading-[18px] tabular-nums text-muted-foreground">
              {{ text(p.why) }}
            </span>
          </div>
        </li>
      </ul>
      <p class="m-0 mt-1 text-[13px] leading-[18px] text-muted-foreground" :class="fadeClass">
        {{ $t(`wear.page.tone.${rec.outfit.tone || 'mid'}`) }}
      </p>
    </template>
    <template v-else>
      <div v-for="k in 4" :key="k" class="flex items-center gap-3.5 py-2.5">
        <Skeleton class="size-14 flex-none rounded-[var(--radius)]" />
        <div class="flex flex-1 flex-col gap-2">
          <Skeleton class="h-3.5 w-[46%]" />
          <Skeleton class="h-3 w-[70%]" />
        </div>
      </div>
    </template>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import { Skeleton } from '@/components/ui/skeleton'
import WearFigure from './WearFigure.vue'

export default {
  name: 'WearPieces',
  components: { DashboardCard, Skeleton, WearFigure },
  props: {
    rec: { type: Object, default: null },
    figure: { type: String, default: 'man' },
    fadeClass: { type: String, default: '' },
    text: { type: Function, required: true }
  },
  computed: {
    ready() {
      return !!this.rec
    }
  }
}
</script>
