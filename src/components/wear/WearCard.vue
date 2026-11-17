<template>
  <NuxtLink
    to="/wear"
    data-wear-link
    :aria-label="ariaLabel"
    :aria-busy="loading ? 'true' : undefined"
    class="wear-card relative isolate block min-h-[280px] w-full min-w-0 overflow-hidden rounded-card text-card-foreground no-underline outline-ring transition-[box-shadow,transform] duration-150 ease-out hover:shadow-[0_0_0_2px_hsl(var(--ring)/0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.995]"
  >
    <!-- design/TidyWearCard (third pass): only the outfit for the rest of today, on a glass panel
         over the street scene in the light of the current hour. No temperature, condition or
         place (Current conditions has them). Sizes follow the tile's own width (container
         queries below), since it is a full row on phones and tablets and a 1 × 1 tile on lg+. -->
    <template v-if="!loading">
      <WearScene :tod="tod" :cloudy="cloudy" :class="fadeClass" />
      <div class="wear-card-fig" :class="fadeClass" data-wear-figure>
        <WearFigure :outfit="rec.outfit" :figure="wearPrefs.figure" />
      </div>
    </template>
    <template v-else>
      <div class="tidy-skeleton-soft absolute inset-0" aria-hidden="true" />
      <div class="wear-card-fig wear-card-fig-sk" aria-hidden="true">
        <Skeleton class="aspect-square w-[34%] rounded-full" />
        <Skeleton class="w-[62%] flex-1 rounded-[28px_28px_10px_10px]" />
      </div>
    </template>

    <div class="wear-glass wear-card-panel flex min-w-0 flex-col gap-1.5 rounded-tile">
      <span class="flex items-center gap-1.5 text-[13px] font-semibold leading-4">
        <WearIcon :d="icons.hanger" />{{ $t('wear.title') }}
      </span>
      <template v-if="!loading">
        <div class="flex flex-col gap-1.5" :class="fadeClass">
          <span class="text-xs font-medium leading-4 tabular-nums text-muted-foreground">
            {{ kicker }}
          </span>
          <span class="wear-card-head font-[650] tracking-[-0.005em]" data-wear-headline>
            {{ headline }}
          </span>
          <div class="flex flex-col gap-1">
            <div
              v-for="(r, i) in reasons"
              :key="i"
              class="flex min-w-0 items-start gap-1.5 text-[13px] leading-[18px] text-muted-foreground"
              data-wear-reason
            >
              <WearIcon :d="r.icon" :size="15" class="mt-[1.5px]" />
              <span class="min-w-0 tabular-nums">{{ r.text }}</span>
            </div>
          </div>
          <div v-if="carry.length" class="flex flex-wrap items-center gap-1">
            <span class="mr-0.5 text-xs font-medium leading-4 text-muted-foreground">
              {{ $t('wear.take') }}
            </span>
            <span
              v-for="c in carry"
              :key="c.id"
              class="inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full bg-secondary pl-1.5 pr-2 text-xs font-medium text-secondary-foreground"
              data-wear-take
            >
              <WearIcon :d="c.icon" :size="13" />{{ c.text }}
            </span>
          </div>
        </div>
      </template>
      <template v-else>
        <Skeleton class="h-3 w-[70%]" />
        <Skeleton class="h-5 w-[90%] rounded-md" />
        <Skeleton class="h-3 w-[80%]" />
        <Skeleton class="h-3 w-[64%]" />
      </template>
    </div>

    <span
      class="wear-glass wear-card-chevron absolute flex h-[30px] w-[30px] items-center justify-center rounded-full"
      aria-hidden="true"
    >
      <WearIcon d="m9 18 6-6-6-6" :stroke="2.2" />
    </span>
  </NuxtLink>
</template>

<script>
import { useWeatherSkeleton } from '@/composables/useSkeletonGate'
import wearMixin from '@/mixins/wearMixin'
import { CLOUDY_KINDS, WEAR_ICONS, wearIcon } from '@/constants/wear'
import { todOf } from '@/utils/wear'
import { Skeleton } from '@/components/ui/skeleton'
import WearScene from './WearScene.vue'
import WearFigure from './WearFigure.vue'
import WearIcon from './WearIcon.vue'

// Dashboard card: What to wear for the rest of today. The whole tile is one link to /wear.
export default {
  name: 'WearCard',
  components: { Skeleton, WearScene, WearFigure, WearIcon },
  mixins: [wearMixin],
  setup() {
    return useWeatherSkeleton()
  },
  data() {
    return { icons: WEAR_ICONS }
  },
  computed: {
    win() {
      const ws = this.wearWindows
      return ws.find((w) => w.id === 'today') || ws[0] || null
    },
    loading() {
      return this.showSkeleton || !this.win
    },
    rec() {
      return this.win ? this.wearRecommend(this.win) : null
    },
    // the street in the light of the current hour
    tod() {
      return todOf(this.win?.summary, this.wearNowHour)
    },
    cloudy() {
      return CLOUDY_KINDS.includes(this.win?.summary.kind)
    },
    kicker() {
      if (!this.win) return ''
      const when = this.$t(this.win.tonight ? 'wear.window.tonight' : 'wear.restOfToday')
      return this.$t('wear.kicker', { when, span: this.wearSpan(this.win.summary) })
    },
    headline() {
      return this.rec ? this.wearT(this.rec.headline) : ''
    },
    reasons() {
      return (this.rec?.reasons || [])
        .slice(0, 2)
        .map((r) => ({ icon: wearIcon(r.k), text: this.wearT(r.t) }))
    },
    carry() {
      return (this.rec?.carry || []).slice(0, 2).map((c) => ({
        id: c.id,
        icon: WEAR_ICONS[c.id] || WEAR_ICONS.layer,
        text: this.$t(`wear.carryShort.${c.id}`)
      }))
    },
    ariaLabel() {
      if (this.loading) return this.$t('wear.openLabel')
      return this.$t('wear.cardLabel', { when: this.kicker, headline: this.headline })
    }
  }
}
</script>

<style scoped>
/* Sizes by the tile's width: under 400px it is a phone row, 560px and up a wide tablet row. */
.wear-card {
  container-type: inline-size;
}

/* full height, feet in the road band (the scene's bottom tenth), right of centre */
.wear-card-fig {
  position: absolute;
  bottom: 6px;
  left: 75%;
  height: min(84%, 330px);
  aspect-ratio: 240 / 484;
  transform: translateX(-50%);
  pointer-events: none;
}

.wear-card-fig.wear-card-fig-sk {
  bottom: 10px;
  left: 75%;
  height: 72%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.wear-card-panel {
  position: absolute;
  top: 12px;
  left: 12px;
  width: calc(56% - 14px);
  max-width: 300px;
  padding: 12px;
}

.wear-card-head {
  font-size: 17px;
  line-height: 22px;
  text-wrap: balance;
}

.wear-card-chevron {
  top: 12px;
  right: 12px;
}

@container (min-width: 400px) {
  .wear-card-fig {
    bottom: 8px;
  }
  .wear-card-panel {
    top: 14px;
    left: 14px;
    padding: 14px;
  }
  .wear-card-head {
    font-size: 18px;
    line-height: 23px;
  }
  .wear-card-chevron {
    top: 14px;
    right: 14px;
  }
}

@container (min-width: 560px) {
  .wear-card-fig {
    left: 70%;
  }
  .wear-card-panel {
    width: 300px;
  }
}
</style>
