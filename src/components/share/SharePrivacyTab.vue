<template>
  <div class="flex flex-col">
    <div class="flex min-h-[52px] items-center justify-between gap-4">
      <div class="flex min-w-0 flex-col">
        <h3 id="share-place-title" class="text-[15px] font-medium leading-5">{{ $t('share.privacy.place') }}</h3>
        <span class="text-[13px] leading-[18px] text-muted-foreground">{{ placeHint }}</span>
      </div>
      <div role="radiogroup" aria-labelledby="share-place-title" class="flex flex-none gap-0.5 rounded-full bg-popover p-0.5 shadow-[inset_0_0_0_1px_hsl(var(--input))]">
        <button
          v-for="p in ['city', 'region']"
          :key="p"
          type="button"
          role="radio"
          :aria-checked="String(placeOn && precision === p)"
          :disabled="!placeOn"
          class="h-8 rounded-full px-3.5 text-[13px] outline-ring transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
          :class="placeOn && precision === p ? 'bg-primary font-semibold text-primary-foreground' : 'font-medium text-muted-foreground enabled:hover:bg-foreground/[0.06]'"
          @click="$emit('update:precision', p)"
        >
          {{ $t(`share.privacy.${p}`) }}
        </button>
      </div>
    </div>

    <button
      type="button"
      role="switch"
      :aria-checked="String(link)"
      class="mt-4 flex min-h-[60px] w-full items-center justify-between gap-4 border-y py-3 text-left outline-ring focus-visible:outline focus-visible:outline-2"
      @click="$emit('update:link', !link)"
    >
      <span class="flex min-w-0 flex-col items-start">
        <span class="text-[15px] font-medium leading-5">{{ $t('share.privacy.link') }}</span>
        <span class="text-[13px] leading-[18px] text-muted-foreground">{{ $t('share.privacy.linkHint') }}</span>
      </span>
      <span aria-hidden="true" class="share-switch" :data-on="link" />
    </button>

    <div class="mt-5 flex items-start gap-3 rounded-tile bg-accent/50 p-3.5">
      <span class="text-primary"><ShareIcon name="shield" :size="18" :stroke-width="1.8" /></span>
      <span class="flex flex-col gap-0.5">
        <span class="text-sm font-medium leading-5">{{ $t('share.privacy.noteTitle') }}</span>
        <span class="text-[13px] leading-[18px] text-muted-foreground [text-wrap:pretty]">{{ $t('share.privacy.noteBody') }}</span>
      </span>
    </div>
  </div>
</template>

<script>
import ShareIcon from '@/components/share/ShareIcon.vue'

export default {
  name: 'SharePrivacyTab',
  components: { ShareIcon },
  props: {
    precision: { type: String, required: true },
    /** Location is on the card */
    placeOn: { type: Boolean, default: true },
    link: { type: Boolean, default: true }
  },
  emits: ['update:precision', 'update:link'],
  computed: {
    placeHint() {
      if (!this.placeOn) return this.$t('share.privacy.placeOff')
      return this.$t(this.precision === 'city' ? 'share.privacy.cityHint' : 'share.privacy.regionHint')
    }
  }
}
</script>
