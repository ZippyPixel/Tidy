<template>
  <div class="flex flex-col gap-5 md:gap-6">
    <section class="flex flex-col gap-2.5" aria-labelledby="share-moment-title">
      <h3 id="share-moment-title" class="text-sm font-medium leading-5 text-muted-foreground">{{ $t('share.moments.title') }}</h3>
      <div
        class="share-moments"
        :class="phone ? 'scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 pt-0.5 [scroll-padding-left:16px]' : 'grid grid-cols-2 gap-2.5'"
      >
        <button
          v-for="m in moments"
          :key="m"
          type="button"
          :aria-pressed="String(moment === m)"
          class="flex snap-start flex-col items-start gap-1.5 rounded-tile p-3 text-left outline-ring transition-[box-shadow,background-color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px]"
          :class="[
            phone ? 'w-[150px] flex-none' : 'min-w-0',
            moment === m ? 'bg-accent/45 shadow-[0_0_0_2px_hsl(var(--primary))]' : 'bg-card shadow-[inset_0_0_0_1px_hsl(var(--border))] hover:bg-foreground/[0.04]'
          ]"
          @click="$emit('moment', m)"
        >
          <span
            aria-hidden="true"
            class="flex size-8 items-center justify-center rounded-full transition-colors duration-150"
            :class="moment === m ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path :d="momentIcons[m]" />
            </svg>
          </span>
          <span class="text-sm font-semibold leading-[18px]">{{ $t(`share.moments.${m}.name`) }}</span>
          <span class="text-xs leading-4 text-muted-foreground">{{ $t(`share.moments.${m}.blurb`) }}</span>
        </button>
      </div>
    </section>

    <section class="flex flex-col gap-2.5" aria-labelledby="share-top-title">
      <div class="flex items-baseline justify-between gap-3">
        <h3 id="share-top-title" class="text-sm font-medium leading-5 text-muted-foreground">{{ $t('share.top.title') }}</h3>
        <button
          v-if="!defaultHeader"
          type="button"
          class="h-6 px-1 text-[13px] font-semibold text-primary outline-ring focus-visible:outline focus-visible:outline-2"
          @click="$emit('reset-header')"
        >
          {{ $t('share.top.reset') }}
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="id in headerLines"
          :key="id"
          type="button"
          :aria-pressed="String(header.includes(id))"
          class="share-chip"
          @click="$emit('toggle-header', id)"
        >
          <ShareIcon :name="id" :size="16" :stroke-width="1.8" />
          <span>{{ $t(`share.top.${id}`) }}</span>
          <ShareIcon v-if="header.includes(id)" name="check" :size="14" :stroke-width="2.4" />
        </button>
      </div>
    </section>

    <section class="flex flex-col gap-2.5" aria-labelledby="share-details-title">
      <div class="flex items-baseline justify-between gap-3">
        <h3 id="share-details-title" class="text-sm font-medium leading-5 text-muted-foreground">{{ $t('share.details.title') }}</h3>
        <span aria-live="polite" class="text-[13px] font-medium tabular-nums leading-4" :class="full ? 'text-foreground' : 'text-muted-foreground'">
          {{ $t('share.details.count', { used: num(used), cap: num(cap) }) }}
        </span>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="chip in chips"
          :key="chip.id"
          type="button"
          :aria-pressed="String(chip.on)"
          :disabled="chip.disabled"
          class="share-chip"
          @click="$emit('toggle-detail', chip.id)"
        >
          <ShareIcon :name="chip.id" :size="16" :stroke-width="1.8" />
          <span>{{ $t(`share.details.${chip.id}`) }}</span>
          <ShareIcon v-if="chip.on" name="check" :size="14" :stroke-width="2.4" />
        </button>
      </div>
      <p v-if="full" class="text-xs leading-4 text-muted-foreground">{{ fullHint }}</p>
    </section>
  </div>
</template>

<script>
import ShareIcon from '@/components/share/ShareIcon.vue'
import { MOMENT_ICONS } from '@/components/share/icons'
import weatherMixin from '@/mixins/weatherMixin'
import { DETAILS, HEADER_LINES, MOMENT_IDS, detailChip, isDefaultHeader, slotsUsed } from '@/utils/share/shareContent'

export default {
  name: 'ShareContentTab',
  components: { ShareIcon },
  props: {
    moment: { type: String, default: null },
    header: { type: Array, required: true },
    details: { type: Array, required: true },
    cap: { type: Number, required: true },
    look: { type: String, required: true },
    format: { type: String, required: true },
    phone: { type: Boolean, default: false }
  },
  emits: ['moment', 'toggle-header', 'reset-header', 'toggle-detail'],
  data() {
    return { moments: MOMENT_IDS, momentIcons: MOMENT_ICONS, headerLines: HEADER_LINES }
  },
  computed: {
    defaultHeader() {
      return isDefaultHeader(this.header)
    },
    used() {
      return slotsUsed(this.details)
    },
    full() {
      return this.used >= this.cap
    },
    chips() {
      return DETAILS.map((id) => detailChip(this.details, id, this.cap))
    },
    fullHint() {
      const sticker = this.look === 'sticker'
      const format = this.$t(`share.details.formats.${sticker ? 'sticker' : this.format}`)
      const key = !sticker && this.format !== 'story' ? 'share.details.fullSwitch' : 'share.details.full'
      return this.$t(key, { cap: this.num(this.cap), format })
    }
  },
  methods: {
    num(n) {
      return weatherMixin.methods.formatNumber(n)
    }
  }
}
</script>
