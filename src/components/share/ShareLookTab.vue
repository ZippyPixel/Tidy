<template>
  <div class="flex flex-col gap-5 md:gap-6">
    <section class="flex flex-col gap-2.5" :aria-label="$t('share.look.title')">
      <div role="group" :aria-label="$t('share.look.title')" class="flex gap-2.5">
        <button
          v-for="l in looks"
          :key="l.id"
          type="button"
          :aria-pressed="String(look === l.id)"
          class="flex min-w-0 flex-1 flex-col items-start gap-1 rounded-tile p-1.5 pb-2.5 text-left outline-ring transition-[box-shadow,background-color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px]"
          :class="
            look === l.id
              ? 'bg-accent/45 shadow-[0_0_0_2px_hsl(var(--primary))]'
              : 'bg-card shadow-[inset_0_0_0_1px_hsl(var(--border))] hover:bg-foreground/[0.04]'
          "
          @click="$emit('update:look', l.id)"
        >
          <span aria-hidden="true" class="relative mb-1 block w-full overflow-hidden rounded-[10px]" :class="phone ? 'h-[52px]' : 'h-[76px]'" :style="{ background: l.bg }">
            <span class="absolute left-2 top-[5px] font-light leading-none tracking-[-0.04em] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]" :class="phone ? 'text-lg' : 'text-2xl'">
              {{ thumbTemp }}
            </span>
            <span class="absolute inset-x-2 bottom-[7px] flex flex-col gap-[3px]">
              <span class="block h-[3px] w-[58%] rounded-sm bg-white/85" />
              <span class="block h-[3px] w-[38%] rounded-sm bg-white/60" />
            </span>
            <span v-if="look === l.id" class="absolute right-[5px] top-[5px] flex size-[18px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
              <ShareIcon name="check" :size="11" :stroke-width="3" />
            </span>
          </span>
          <span class="text-sm font-semibold leading-[18px]">{{ $t(`share.look.${l.id}`) }}</span>
          <span class="text-xs leading-4 text-muted-foreground">{{ $t(`share.look.${l.id}${phone ? 'HintShort' : 'Hint'}`) }}</span>
        </button>
      </div>
    </section>

    <!-- photo look: a photo from this device, never uploaded -->
    <section v-if="look === 'photo'" class="flex flex-col gap-2.5" aria-labelledby="share-photo-title">
      <h3 id="share-photo-title" class="text-sm font-medium leading-5 text-muted-foreground">{{ $t('share.photo.title') }}</h3>
      <label
        v-if="!photo"
        for="share-photo-input"
        class="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-tile border-[1.5px] border-dashed border-input bg-card p-4 transition-colors duration-100 hover:border-primary hover:bg-accent/50 focus-within:border-primary"
      >
        <span class="text-primary"><ShareIcon name="golden" :size="24" :stroke-width="1.8" /></span>
        <span class="text-[15px] font-semibold leading-5">{{ $t('share.photo.choose') }}</span>
        <span class="text-center text-[13px] leading-[18px] text-muted-foreground">{{ $t('share.photo.stays') }}</span>
      </label>
      <template v-else>
        <div class="flex min-w-0 items-center gap-3 rounded-tile border bg-card p-2.5">
          <span aria-hidden="true" class="size-11 flex-none rounded-lg bg-cover bg-center" :style="{ backgroundImage: `url(&quot;${photo.url}&quot;)` }" />
          <div class="flex min-w-0 flex-1 flex-col">
            <span class="truncate text-sm font-medium leading-5">{{ photo.name }}</span>
            <span class="text-xs leading-4 text-muted-foreground">{{ $t('share.photo.meta', { size: photoSize }) }}</span>
          </div>
          <label for="share-photo-input" class="share-small-btn cursor-pointer">{{ $t('share.photo.change') }}</label>
          <button type="button" class="share-small-btn" @click="$emit('remove')">{{ $t('share.photo.remove') }}</button>
        </div>
        <button
          v-if="takenLabel"
          type="button"
          role="switch"
          :aria-checked="String(useTaken)"
          class="flex w-full items-center justify-between gap-3 rounded-tile border bg-card px-3 py-2.5 text-left outline-ring focus-visible:outline focus-visible:outline-2"
          @click="$emit('update:useTaken', !useTaken)"
        >
          <span class="flex min-w-0 flex-1 flex-col items-start">
            <span class="text-sm font-medium leading-5">{{ $t('share.photo.taken') }}</span>
            <span class="text-xs leading-4 text-muted-foreground">{{ $t('share.photo.takenHint', { when: takenLabel }) }}</span>
          </span>
          <span aria-hidden="true" class="share-switch" :data-on="useTaken" />
        </button>
        <p v-if="useTaken && !hasWeather" class="text-xs leading-4 text-muted-foreground">{{ $t('share.photo.noWeather') }}</p>
      </template>
      <input id="share-photo-input" type="file" accept="image/*" class="sr-only" @change="onPick" />
    </section>

    <!-- size for sky and photo; text colour for the sticker -->
    <section class="flex flex-col gap-2.5" aria-labelledby="share-size-title">
      <h3 id="share-size-title" class="text-sm font-medium leading-5 text-muted-foreground">
        {{ $t(look === 'sticker' ? 'share.size.inkTitle' : 'share.size.title') }}
      </h3>
      <div role="radiogroup" aria-labelledby="share-size-title" class="flex gap-0.5 rounded-full bg-popover p-0.5 shadow-[inset_0_0_0_1px_hsl(var(--input))]" @keydown="onRadioKey">
        <button
          v-for="s in sizes"
          :key="s.id"
          ref="radios"
          type="button"
          role="radio"
          :aria-checked="String(s.on)"
          :tabindex="s.on ? 0 : -1"
          class="flex h-11 flex-1 items-center justify-center gap-2 rounded-full px-3 outline-ring transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          :class="s.on ? 'bg-primary font-semibold text-primary-foreground' : 'font-medium text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground'"
          @click="s.pick()"
        >
          <span aria-hidden="true" class="flex-none" :style="s.shape" />
          <span class="flex flex-col items-start leading-[1.15]">
            <span class="text-sm">{{ s.name }}</span>
            <span class="text-[11px] opacity-90">{{ s.hint }}</span>
          </span>
        </button>
      </div>
    </section>
  </div>
</template>

<script>
import ShareIcon from '@/components/share/ShareIcon.vue'
import weatherMixin from '@/mixins/weatherMixin'

const LOOKS = [
  { id: 'sky', bg: 'linear-gradient(180deg, #174F9E, #2E76C9 60%, #5A97DA)' },
  { id: 'photo', bg: 'linear-gradient(180deg, #2B4677, #C48683 50%, #5D7E9B 57%, #20405A 78%, #D6B184 80%)' },
  { id: 'sticker', bg: 'repeating-conic-gradient(#3A404B 0% 25%, #2B3039 0% 50%) 50% / 8px 8px' }
]

export default {
  name: 'ShareLookTab',
  components: { ShareIcon },
  props: {
    look: { type: String, required: true },
    format: { type: String, required: true },
    ink: { type: String, required: true },
    phone: { type: Boolean, default: false },
    /** { url, name, size } */
    photo: { type: Object, default: null },
    takenLabel: { type: String, default: '' },
    useTaken: { type: Boolean, default: false },
    hasWeather: { type: Boolean, default: true },
    thumbTemp: { type: String, default: '' }
  },
  emits: ['update:look', 'update:format', 'update:ink', 'update:useTaken', 'pick', 'remove'],
  data() {
    return { looks: LOOKS }
  },
  computed: {
    photoSize() {
      return weatherMixin.methods.formatNumber(Math.round(((this.photo?.size || 0) / 1048576) * 10) / 10)
    },
    sizes() {
      const t = this.$t
      if (this.look === 'sticker') {
        return ['white', 'dark'].map((id) => ({
          id,
          name: t(`share.size.${id}`),
          hint: t(`share.size.${id}Hint`),
          on: this.ink === id,
          pick: () => this.$emit('update:ink', id),
          shape: { width: '16px', height: '16px', borderRadius: '999px', background: id === 'dark' ? '#111827' : '#ffffff', boxShadow: '0 0 0 1px rgba(127,127,127,0.5)' }
        }))
      }
      return [
        ['story', '9:16', 9, 16],
        ['post', '4:5', 12, 15],
        ['square', '1:1', 14, 14]
      ].map(([id, hint, w, h]) => ({
        id,
        name: t(`share.size.${id}`),
        hint,
        on: this.format === id,
        pick: () => this.$emit('update:format', id),
        shape: { width: `${w}px`, height: `${h}px`, borderRadius: '2.5px', border: '1.6px solid currentColor', boxSizing: 'border-box' }
      }))
    }
  },
  methods: {
    onPick(event) {
      const file = event.target.files?.[0]
      if (file) this.$emit('pick', file)
      event.target.value = ''
    },
    onRadioKey(event) {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
      event.preventDefault()
      const n = this.sizes.length
      const i = Math.max(0, this.sizes.findIndex((s) => s.on))
      const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
      const next = (i + step + n) % n
      this.sizes[next].pick()
      this.$nextTick(() => this.$refs.radios?.[next]?.focus())
    }
  }
}
</script>
