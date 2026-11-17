<template>
  <section
    :aria-labelledby="titleId"
    class="tidy-motion flex min-w-0 flex-col overflow-hidden rounded-card border bg-card text-card-foreground"
  >
    <!-- design/TidyWear "Your wardrobe": an accordion, closed by default and not remembered.
         Every piece the figure can wear, as chips you switch off; outfits only use what is on.
         The height animates with grid-template-rows 0fr → 1fr (no measuring), the content fades
         and is out of the tab order once closed. -->
    <h2 :id="titleId" class="m-0">
      <button
        type="button"
        :aria-expanded="String(open)"
        :aria-controls="panelId"
        class="flex min-h-11 w-full items-center justify-between gap-3 bg-transparent p-4 text-left outline-ring transition-colors duration-[160ms] ease-linear hover:bg-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:[outline-offset:-2px] sm:p-6"
        data-wear-ward-head
        @click="open = !open"
      >
        <span class="text-sm font-medium leading-6 text-muted-foreground">
          {{ $t('wear.page.wardrobe') }}
        </span>
        <span class="flex items-center gap-3">
          <span
            class="whitespace-nowrap text-[13px] font-medium tabular-nums text-muted-foreground"
            data-wear-ward-sum
            >{{ summary }}</span
          >
          <span
            class="flex size-8 flex-none items-center justify-center rounded-full bg-muted text-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              class="size-[18px] fill-none stroke-current stroke-2 transition-transform duration-[380ms] ease-tidy [stroke-linecap:round] [stroke-linejoin:round]"
              :class="open ? 'rotate-180' : ''"
              data-wear-ward-chev
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </span>
      </button>
    </h2>
    <div
      :id="panelId"
      class="grid transition-[grid-template-rows] duration-[380ms] ease-tidy"
      :class="open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
      data-wear-ward-panel
    >
      <div
        class="min-h-0 overflow-hidden"
        :class="
          open
            ? 'visible opacity-100 [transition:opacity_260ms_ease_60ms,visibility_0s_linear_0s]'
            : 'invisible opacity-0 [transition:opacity_200ms_ease,visibility_0s_linear_380ms]'
        "
        :inert="open ? undefined : ''"
      >
        <div class="flex flex-col gap-3.5 px-4 pb-4 sm:px-6 sm:pb-6">
          <div class="flex min-h-8 flex-wrap items-center justify-between gap-3">
            <span class="text-[13px] leading-[18px] text-muted-foreground">{{ note }}</span>
            <button
              v-if="offCount"
              type="button"
              class="h-8 rounded-full border bg-transparent px-3 text-[13px] font-medium outline-ring focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              data-wear-ward-all
              @click="wear.allOn()"
            >
              {{ $t('wear.page.turnAllOn') }}
            </button>
          </div>
          <div>
            <div
              v-for="g in groups"
              :key="g.id"
              class="grid grid-cols-1 items-start gap-2 border-t py-3 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-4"
              data-wear-ward-group
            >
              <div class="flex flex-col gap-0.5 sm:pt-1.5">
                <span class="text-[15px] font-semibold leading-5">{{
                  $t(`wear.group.${g.id}`)
                }}</span>
                <span class="text-xs tabular-nums text-muted-foreground">{{ g.count }}</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="i in g.items"
                  :key="i.id"
                  type="button"
                  :aria-pressed="String(i.on)"
                  class="inline-flex h-[34px] items-center gap-1.5 whitespace-nowrap rounded-full py-0 pl-2 pr-3 text-sm font-medium outline-ring focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  :class="
                    i.on
                      ? 'border border-primary/45 bg-accent text-accent-foreground'
                      : 'border border-dashed text-muted-foreground line-through'
                  "
                  :data-wear-chip="i.id"
                  @click="wear.toggle(i.id)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    class="size-4 flex-none fill-none stroke-current stroke-[2.4] [stroke-linecap:round] [stroke-linejoin:round]"
                    :class="i.on ? 'opacity-100' : 'opacity-0'"
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                  {{ i.name }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { useId } from 'vue'
import weatherMixin from '@/mixins/weatherMixin'
import useWearStore from '@/stores/wear'
import { wardrobe } from '@/utils/wear'

const { formatNumber } = weatherMixin.methods

export default {
  name: 'WearWardrobe',
  setup() {
    return { titleId: useId(), panelId: useId(), wear: useWearStore() }
  },
  data() {
    // closed on every visit
    return { open: false }
  },
  computed: {
    groups() {
      const off = new Set(this.wear.exclude)
      return wardrobe(this.wear.figure).map((g) => {
        const items = g.items.map((id) => ({
          id,
          on: !off.has(id),
          name: this.$t(`wear.piece.${id}`)
        }))
        return {
          id: g.id,
          items,
          count: this.$t('wear.page.groupCount', {
            on: formatNumber(items.filter((i) => i.on).length),
            total: formatNumber(items.length)
          })
        }
      })
    },
    // only the pieces this figure can wear count, so the numbers match the chips on screen
    total() {
      return this.groups.reduce((n, g) => n + g.items.length, 0)
    },
    offCount() {
      return this.groups.reduce((n, g) => n + g.items.filter((i) => !i.on).length, 0)
    },
    summary() {
      const on = this.total - this.offCount
      return this.offCount
        ? this.$t('wear.page.wardSome', { on: formatNumber(on), total: formatNumber(this.total) })
        : this.$t('wear.page.wardAll', { n: formatNumber(this.total) })
    },
    note() {
      return this.offCount
        ? this.$t('wear.page.wardNoteOff', { n: formatNumber(this.offCount) })
        : this.$t('wear.page.wardNote')
    }
  }
}
</script>
