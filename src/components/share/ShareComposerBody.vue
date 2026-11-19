<template>
  <div class="share-composer" :class="phone ? 'is-phone' : 'is-wide'">
    <header class="share-head">
      <button v-if="phone" type="button" class="share-icon-btn" :aria-label="$t('header.close')" @click="$emit('close')">
        <ShareIcon name="back" :size="22" :stroke-width="2" />
      </button>
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <component :is="titleAs" class="font-semibold tracking-[-0.01em]" :class="phone ? 'text-[17px] leading-6' : 'text-xl leading-[26px]'">
          {{ $t(`share.title.${origin}`) }}
        </component>
        <component :is="descriptionAs" :class="phone ? 'sr-only' : 'text-[13px] leading-4 text-muted-foreground'">
          {{ phone ? $t('share.description') : $t('share.subtitle') }}
        </component>
      </div>
      <button v-if="!phone" type="button" class="share-icon-btn" :aria-label="$t('header.close')" @click="$emit('close')">
        <ShareIcon name="close" :size="20" :stroke-width="2" />
      </button>
    </header>

    <!-- the card, exactly as it will be exported -->
    <div class="share-stage">
      <div class="share-preview" :class="sticker ? 'is-sticker' : ''" :style="{ '--ratio': ratio }">
        <ShareCard v-bind="cardProps" :guides="guides && canGuide" :pixel-width="phone ? 300 : 420" />
      </div>
      <div class="flex h-[30px] flex-none items-center justify-center gap-2.5">
        <span class="whitespace-nowrap text-xs tabular-nums leading-4 text-muted-foreground">
          {{ $t(`share.exportLabel.${sticker ? 'sticker' : format}`) }}
        </span>
        <button
          v-if="canGuide"
          type="button"
          :aria-pressed="String(guides)"
          class="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-xs font-medium outline-ring focus-visible:outline focus-visible:outline-2"
          :class="guides ? 'border-primary/45 bg-accent text-accent-foreground' : 'bg-card text-muted-foreground'"
          @click="guides = !guides"
        >
          <ShareIcon name="guides" :size="14" :stroke-width="2" />{{ $t('share.safeZones') }}
        </button>
      </div>
    </div>

    <!-- three tabs keep the options short: how it looks, what it shows, what it shares -->
    <div class="share-tabs">
      <SegmentedControl v-model="tab" kind="tabs" full-width :options="tabOptions" :aria-label="$t('share.tabs.label')" />
    </div>

    <div role="tabpanel" :aria-label="$t(`share.tabs.${tab}`)" class="share-panel tidy-scrollbar" tabindex="-1">
      <div :key="tab" class="share-panel-inner">
        <ShareLookTab
          v-if="tab === 'look'"
          :look="look"
          :format="format"
          :ink="ink"
          :phone="phone"
          :photo="photo"
          :taken-label="takenLabel"
          :use-taken="useTaken"
          :has-weather="hasWeather"
          :thumb-temp="data.temp || '—'"
          @update:look="setLook"
          @update:format="setFormat"
          @update:ink="ink = $event"
          @update:use-taken="useTaken = $event"
          @pick="pickPhoto"
          @remove="removePhoto"
        />
        <ShareContentTab
          v-else-if="tab === 'content'"
          :moment="moment"
          :header="header"
          :details="details"
          :cap="cap"
          :look="look"
          :format="format"
          :phone="phone"
          @moment="pickMoment"
          @toggle-header="header = toggleHeaderLine(header, $event)"
          @reset-header="header = [...HEADER_DEFAULT]"
          @toggle-detail="toggleDetail"
        />
        <SharePrivacyTab
          v-else
          :precision="precision"
          :place-on="placeOn"
          :link="link"
          @update:precision="precision = $event"
          @update:link="link = $event"
        />
      </div>
    </div>

    <footer class="share-foot">
      <p v-if="message" role="status" class="share-message">{{ message }}</p>
      <p v-else class="sr-only" role="status">{{ busy ? $t('share.actions.making') : '' }}</p>
      <button type="button" class="share-btn share-btn-secondary" :disabled="blocked" @click="run(buttons.secondary)">
        <ShareIcon :name="iconFor(buttons.secondary)" :size="18" />{{ labelFor(buttons.secondary) }}
      </button>
      <button type="button" class="share-btn share-btn-primary" :disabled="blocked" @click="run(buttons.primary)">
        <ShareIcon :name="iconFor(buttons.primary)" :size="18" :stroke-width="2" />{{ labelFor(buttons.primary) }}
      </button>
    </footer>

    <!-- after sharing: what happened, and the next step for Instagram -->
    <template v-if="done">
      <div class="share-scrim" @click="done = ''" />
      <div role="dialog" aria-modal="true" aria-labelledby="share-done-title" class="share-done">
        <span v-if="phone" aria-hidden="true" class="h-1 w-9 self-center rounded-sm bg-input" />
        <div class="flex items-center gap-4">
          <div class="share-done-thumb" :style="{ width: `${thumbWidth}px` }">
            <ShareCard v-bind="cardProps" :pixel-width="thumbWidth" />
          </div>
          <div class="flex min-w-0 flex-col gap-1">
            <span class="inline-flex items-center gap-1 text-[13px] font-semibold leading-4 text-primary">
              <ShareIcon name="check" :size="16" :stroke-width="2.4" />{{ $t(`share.done.${done}`) }}
            </span>
            <h3 id="share-done-title" class="text-xl font-semibold leading-[26px] [text-wrap:balance]">{{ doneText.title }}</h3>
            <span class="text-sm leading-5 text-muted-foreground [text-wrap:pretty]">{{ doneText.body }}</span>
          </div>
        </div>
        <div v-if="done === 'shared'" class="flex flex-col gap-1 rounded-tile bg-muted p-3">
          <span class="text-xs font-medium leading-4 text-muted-foreground">{{ $t('share.done.sentWith') }}</span>
          <span class="break-words text-sm leading-5">{{ text }}</span>
        </div>
        <div class="flex flex-wrap justify-end gap-2">
          <button ref="another" type="button" class="share-btn share-btn-secondary h-11" @click="done = ''">{{ $t('share.done.another') }}</button>
          <button type="button" class="share-btn share-btn-primary h-11" @click="$emit('close')">{{ $t('share.done.close') }}</button>
        </div>
      </div>
    </template>

    <!-- the export: the same card at 1080 px, off-screen, captured to a PNG -->
    <div aria-hidden="true" inert class="pointer-events-none fixed left-[-20000px] top-0" style="width: 1080px">
      <ShareCard ref="exportCard" v-bind="cardProps" :checker="false" :sky-image="skyImage" :pixel-width="1080" />
    </div>
  </div>
</template>

<script>
import { markRaw, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import SegmentedControl from '@/components/common/SegmentedControl.vue'
import ShareCard from '@/components/share/ShareCard.vue'
import ShareIcon from '@/components/share/ShareIcon.vue'
import ShareLookTab from '@/components/share/ShareLookTab.vue'
import ShareContentTab from '@/components/share/ShareContentTab.vue'
import SharePrivacyTab from '@/components/share/SharePrivacyTab.vue'
import useShareData from '@/composables/useShareData'
import useTidesStore from '@/stores/tides'
import useWeatherStore from '@/stores/weather'
import { currentIntlTag } from '@/i18n'
import {
  capacity,
  EXPORT_WIDTH,
  exportHeight,
  fitDetails,
  HEADER_DEFAULT,
  momentDetails,
  ORIGINS,
  RATIOS,
  toggleDetail,
  toggleHeaderLine
} from '@/utils/share/shareContent'
import { shareFileName, shareQuery, shareUrl, siteLabel } from '@/utils/share/shareLink'
import { canShareFiles, copyFile, downloadFile, shareButtons, shareFile, shareText } from '@/utils/share/shareActions'
import { captureCard, paintSvg } from '@/utils/share/capture'
import { readPhotoTakenAt } from '@/utils/share/photoTime'

const RENDER_DELAY_MS = 250

export default {
  name: 'ShareComposerBody',
  components: { SegmentedControl, ShareCard, ShareIcon, ShareLookTab, ShareContentTab, SharePrivacyTab },
  props: {
    phone: { type: Boolean, default: false },
    /** dashboard | tides | sky | wear: picks the title and the starting moment */
    origin: { type: String, default: 'dashboard' },
    /** where the link points (runtime config), e.g. https://tidy.example */
    siteOrigin: { type: String, default: '' },
    /** the surface's title and description components (DialogTitle / DrawerTitle, …) */
    titleAs: { type: [Object, String], default: 'h2' },
    descriptionAs: { type: [Object, String], default: 'p' }
  },
  emits: ['close'],
  setup() {
    const { t } = useI18n()
    const nowMs = ref(Date.now())
    const photo = ref(null) // { url, name, size, taken }
    const useTaken = ref(false)
    const takenAt = shallowRef(null)
    const sky = shallowRef(null)
    const share = useShareData({ t, nowMs, takenAt, sky })
    return { nowMs, photo, useTaken, takenAt, sky, ...share }
  },
  data() {
    const moment = ORIGINS[this.origin] || 'today'
    return {
      HEADER_DEFAULT,
      tab: 'look',
      look: 'sky',
      format: 'story',
      ink: 'white',
      moment,
      details: momentDetails(moment, capacity('sky', 'story')),
      header: [...HEADER_DEFAULT],
      precision: 'city',
      link: true,
      guides: false,
      canShare: false,
      // the export
      blob: null,
      blobKey: '',
      busy: false,
      skyImage: '',
      renderTimer: null,
      renderPromise: null,
      // outcome
      done: '',
      message: ''
    }
  },
  computed: {
    sticker() {
      return this.look === 'sticker'
    },
    cap() {
      return capacity(this.look, this.format)
    },
    ratio() {
      return RATIOS[this.format]
    },
    canGuide() {
      return this.format === 'story' && !this.sticker
    },
    placeOn() {
      return this.header.includes('place')
    },
    tabOptions() {
      return ['look', 'content', 'privacy'].map((value) => ({ value, label: this.$t(`share.tabs.${value}`) }))
    },
    linkOrigin() {
      return this.siteOrigin || (typeof window !== 'undefined' ? window.location.origin : '')
    },
    url() {
      if (!this.link) return ''
      const query = shareQuery({
        place: this.place,
        precision: this.placeOn ? this.precision : null,
        date: this.date,
        moment: this.moment
      })
      return shareUrl(this.linkOrigin, query)
    },
    placeLabel() {
      if (!this.placeOn) return ''
      return this.precision === 'region' ? this.data.regionName || this.place?.country || '' : this.data.placeName
    },
    cardData() {
      return { ...this.data, placeName: this.placeLabel }
    },
    cardProps() {
      return {
        look: this.look,
        format: this.format,
        ink: this.ink,
        header: this.header,
        details: fitDetails(this.details, this.cap),
        data: this.cardData,
        link: this.link,
        site: siteLabel(this.linkOrigin),
        photo: this.look === 'photo' && this.photo ? this.photo.url : ''
      }
    },
    renderKey() {
      return JSON.stringify(this.cardProps)
    },
    blocked() {
      return this.look === 'photo' && !this.photo
    },
    buttons() {
      return shareButtons({ phone: this.phone, look: this.look, canShare: this.canShare })
    },
    text() {
      return shareText({ t: this.$t, moment: this.moment, placeName: this.placeLabel, url: this.url })
    },
    fileName() {
      return shareFileName(this.placeLabel, this.date)
    },
    takenLabel() {
      const taken = this.photo?.taken
      if (taken == null) return ''
      const tz = this.place?.tz || 'UTC'
      const day = new Intl.DateTimeFormat(currentIntlTag(), { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' }).format(taken)
      const time = new Intl.DateTimeFormat(currentIntlTag(), { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(taken)
      return `${day} · ${time}`
    },
    thumbWidth() {
      return this.sticker ? 120 : this.format === 'story' ? 72 : 104
    },
    doneText() {
      const t = this.$t
      if (this.done === 'shared')
        return { title: t('share.done.sharedTitle'), body: t(this.link ? 'share.done.sharedBody' : 'share.done.sharedBodyNoLink') }
      if (this.done === 'saved')
        return { title: t('share.done.savedTitle'), body: t(this.format === 'story' && !this.sticker ? 'share.done.savedBodyStory' : 'share.done.savedBody') }
      return this.sticker
        ? { title: t('share.done.stickerCopiedTitle'), body: t('share.done.stickerCopiedBody') }
        : { title: t('share.done.copiedTitle'), body: t('share.done.copiedBody') }
    }
  },
  watch: {
    renderKey() {
      this.scheduleRender()
    },
    'photo.taken'() {
      this.syncTaken()
    },
    useTaken() {
      this.syncTaken()
    },
    done(value) {
      if (value) this.$nextTick(() => this.$refs.another?.focus())
    }
  },
  mounted() {
    this.canShare = this.phone && canShareFiles()
    this.clock = setInterval(() => (this.nowMs = Date.now()), 30000)
    const weather = useWeatherStore()
    if (weather.coords) useTidesStore().loadNearest(weather.coords)
    this.loadSky()
    // the card is ready when the composer opens: render the PNG straight away
    this.render()
  },
  beforeUnmount() {
    clearInterval(this.clock)
    clearTimeout(this.renderTimer)
    if (this.photo) URL.revokeObjectURL(this.photo.url)
  },
  methods: {
    toggleHeaderLine,
    async loadSky() {
      if (this.sky) return
      try {
        const [A, s] = await Promise.all([import('astronomy-engine'), import('@/utils/sky')])
        this.sky = markRaw({ A, createSky: s.createSky, dayStart: s.dayStart, dayStartAt: s.dayStartAt, phaseKey: s.phaseKey })
      } catch {
        // golden hour stays empty and the sun and moon come from the forecast only
      }
    },
    setLook(look) {
      this.look = look
      this.details = fitDetails(this.details, capacity(look, this.format))
      if (look === 'sticker') this.guides = false
    },
    setFormat(format) {
      this.format = format
      this.details = fitDetails(this.details, capacity(this.look, format))
      if (format !== 'story') this.guides = false
    },
    pickMoment(moment) {
      this.moment = moment
      this.details = momentDetails(moment, this.cap)
    },
    toggleDetail(id) {
      const next = toggleDetail(this.details, id, this.cap)
      this.details = next.details
      this.moment = next.moment
    },
    async pickPhoto(file) {
      if (this.photo) URL.revokeObjectURL(this.photo.url)
      this.photo = { url: URL.createObjectURL(file), name: file.name, size: file.size, taken: null }
      this.useTaken = false
      const current = this.photo
      const taken = await readPhotoTakenAt(file, this.place?.tz || 'UTC')
      if (this.photo === current) this.photo = { ...current, taken }
    },
    removePhoto() {
      if (this.photo) URL.revokeObjectURL(this.photo.url)
      this.photo = null
      this.useTaken = false
    },
    syncTaken() {
      this.takenAt = this.useTaken && this.photo?.taken != null ? this.photo.taken : null
    },

    /* ── export ── */
    scheduleRender() {
      clearTimeout(this.renderTimer)
      this.renderTimer = setTimeout(() => this.render(), RENDER_DELAY_MS)
    },
    render() {
      const run = async () => {
        const key = this.renderKey
        this.busy = true
        try {
          await this.$nextTick()
          const card = this.$refs.exportCard
          if (!card) return null
          const height = this.sticker ? undefined : exportHeight(this.format)
          if (this.look === 'sky') {
            // paint the sky first: the DOM capture can drop SVG blur and grain
            this.skyImage = ''
            await this.$nextTick()
            const svg = card.skyElement()
            if (svg) this.skyImage = await paintSvg(svg, EXPORT_WIDTH, height)
            await this.$nextTick()
          }
          const blob = await captureCard(card.$el, { width: EXPORT_WIDTH, height })
          if (key !== this.renderKey) return null
          this.blob = blob
          this.blobKey = key
          this.message = ''
          return blob
        } catch (error) {
          console.error('Share card export failed:', error)
          if (key === this.renderKey) this.message = this.$t('share.actions.failed')
          return null
        } finally {
          this.busy = false
        }
      }
      this.renderPromise = (this.renderPromise || Promise.resolve()).then(run, run)
      return this.renderPromise
    },
    /** the PNG for what is on screen now */
    async currentBlob() {
      // a render that went stale mid-way (a setting changed) is redone, a few times at most
      for (let i = 0; i < 3; i++) {
        if (this.blob && this.blobKey === this.renderKey) return this.blob
        clearTimeout(this.renderTimer)
        await this.render()
      }
      return this.blob && this.blobKey === this.renderKey ? this.blob : null
    },

    /* ── actions ── */
    iconFor(action) {
      return { share: 'share', shareSticker: 'share', save: 'save', download: 'save', copy: 'copy' }[action]
    },
    labelFor(action) {
      if (action === 'copy') return this.$t(this.phone ? 'share.actions.copy' : 'share.actions.copyImage')
      return this.$t(`share.actions.${action}`)
    },
    async run(action) {
      if (this.blocked) return
      this.message = ''
      const blob = await this.currentBlob()
      if (!blob) {
        this.message = this.$t('share.actions.failed')
        return
      }
      const file = { blob, fileName: this.fileName, text: this.text }
      try {
        if (action === 'share' || action === 'shareSticker') {
          let outcome
          try {
            outcome = await shareFile(file)
          } catch {
            // the browser refused (no user activation left, or files not allowed): save instead
            outcome = downloadFile(file)
          }
          if (outcome !== 'cancelled') this.done = outcome
        } else if (action === 'copy') {
          this.done = await copyFile(file)
        } else {
          this.done = downloadFile(file)
        }
      } catch {
        this.message = this.$t(action === 'copy' ? 'share.actions.copyFailed' : 'share.actions.failed')
      }
    }
  }
}
</script>

<style>
.share-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  outline-color: hsl(var(--ring));
  outline-offset: 2px;
  transition: background-color 120ms linear, border-color 120ms linear;
}
.share-chip:hover:enabled {
  background: hsl(var(--foreground) / 0.04);
}
.share-chip[aria-pressed='true'] {
  border-color: hsl(var(--primary) / 0.45);
  background: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}
.share-chip:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.share-small-btn {
  display: inline-flex;
  flex: none;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--card));
  font-size: 13px;
  font-weight: 500;
  outline-color: hsl(var(--ring));
}
.share-small-btn:hover {
  background: hsl(var(--foreground) / 0.04);
}

/* the switch track and knob; the row itself is the role="switch" button */
.share-switch {
  position: relative;
  flex: none;
  width: 40px;
  height: 24px;
  border-radius: 999px;
  background: hsl(var(--input));
  transition: background-color 160ms ease;
}
.share-switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transition: transform 160ms ease;
}
.share-switch[data-on='true'] {
  background: hsl(var(--primary));
}
.share-switch[data-on='true']::after {
  transform: translateX(16px);
}

@media (prefers-reduced-motion: reduce) {
  .share-switch,
  .share-switch::after,
  .share-chip {
    transition: none;
  }
}
</style>

<style scoped>
.share-composer {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

/* phone: card on top (47% of the height), tabs, options, actions pinned to the bottom */
.share-composer.is-phone {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: 56px clamp(320px, 47dvh, 440px) 56px minmax(0, 1fr) auto;
  grid-template-areas: 'head' 'stage' 'tabs' 'panel' 'foot';
}

/* md+: the card fills the left */
.share-composer.is-wide {
  grid-template-columns: minmax(0, 56fr) minmax(0, 44fr);
  grid-template-rows: 76px 60px minmax(0, 1fr) auto;
  grid-template-areas: 'stage head' 'stage tabs' 'stage panel' 'stage foot';
}

.share-head {
  grid-area: head;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 0 12px 0 24px;
}
.is-phone .share-head {
  gap: 4px;
  padding: 0 16px 0 4px;
  border-bottom: 1px solid hsl(var(--border));
}

.share-icon-btn {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  outline-color: hsl(var(--ring));
}
.share-icon-btn:hover {
  background: hsl(var(--foreground) / 0.06);
}

/* the stage is a size container, so the card fits it in CSS alone (no measuring) */
.share-stage {
  grid-area: stage;
  container-type: size;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 0;
  overflow: hidden;
  padding: 40px 40px 28px;
  background: radial-gradient(110% 80% at 50% 38%, hsl(var(--surface-raised, var(--card))), hsl(var(--muted)));
  border-right: 1px solid hsl(var(--border));
}
.is-phone .share-stage {
  padding: 16px 20px 10px;
  border-right: 0;
}

.share-preview {
  flex: none;
  /* as wide as fits: the stage minus padding, or as tall as fits over the ratio */
  width: min(100cqw - 80px, (100cqh - 40px - 28px - 30px - 10px) / var(--ratio));
  overflow: hidden;
  border-radius: max(10px, 2.5cqh);
  box-shadow: 0 1px 2px hsl(220 30% 10% / 0.12), 0 16px 40px hsl(220 30% 10% / 0.24);
  line-height: 0;
}
.is-phone .share-preview {
  width: min(100cqw - 40px, (100cqh - 16px - 10px - 30px - 10px) / var(--ratio));
}
.share-preview.is-sticker {
  width: min(100cqw - 80px, 360px);
  max-height: calc(100cqh - 80px);
  overflow-y: auto;
  border-radius: 12px;
}
.is-phone .share-preview.is-sticker {
  width: min(100cqw - 40px, 250px);
}

.share-tabs {
  grid-area: tabs;
  display: flex;
  align-items: center;
  padding: 4px 24px 12px;
  border-bottom: 1px solid hsl(var(--border));
}
.is-phone .share-tabs {
  padding: 8px 16px;
}

.share-panel {
  grid-area: panel;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  outline: none;
}
.share-panel-inner {
  padding: 20px 24px 24px;
  animation: share-panel-in 180ms ease-out;
}
.is-phone .share-panel-inner {
  padding: 14px 16px 20px;
}
@keyframes share-panel-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}

.share-foot {
  grid-area: foot;
  position: relative;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 24px 18px;
  border-top: 1px solid hsl(var(--border));
  background: hsl(var(--background));
}
.is-phone .share-foot {
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
}
.share-message {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 100%;
  margin-bottom: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  background: hsl(var(--popover));
  color: hsl(var(--popover-foreground));
  box-shadow: 0 4px 16px hsl(220 30% 10% / 0.18);
  font-size: 13px;
  line-height: 18px;
}

.share-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  padding: 0 20px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  outline-color: hsl(var(--ring));
  outline-offset: 2px;
}
.share-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.share-btn-secondary {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
}
.share-btn-secondary:hover:enabled {
  background: hsl(var(--secondary) / 0.7);
}
.share-btn-primary {
  min-width: 168px;
  padding: 0 24px;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  box-shadow: 0 1px 2px hsl(220 30% 10% / 0.15);
}
.share-btn-primary:hover:enabled {
  filter: brightness(1.06);
}
.is-phone .share-btn-primary {
  flex: 1 1 auto;
  min-width: 0;
}

.share-scrim {
  position: absolute;
  inset: 0;
  z-index: 5;
  background: hsl(220 30% 6% / 0.45);
  animation: share-fade 160ms ease-out;
}
.share-done {
  position: absolute;
  z-index: 6;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: hsl(var(--popover));
  color: hsl(var(--popover-foreground));
}
.is-wide .share-done {
  left: 50%;
  top: 50%;
  width: 440px;
  max-width: calc(100% - 48px);
  padding: 24px;
  border-radius: 20px;
  transform: translate(-50%, -50%);
  box-shadow: 0 24px 64px hsl(220 30% 10% / 0.35);
  animation: share-fade 180ms ease-out;
}
.is-phone .share-done {
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px 20px calc(20px + env(safe-area-inset-bottom));
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -8px 32px hsl(220 30% 10% / 0.25);
  animation: share-up 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.share-done-thumb {
  flex: none;
  overflow: hidden;
  border-radius: 8px;
  line-height: 0;
  box-shadow: 0 6px 18px hsl(220 30% 10% / 0.28);
  transform-origin: 50% 60%;
  animation: share-card-tilt 420ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes share-fade {
  from {
    opacity: 0;
  }
}
@keyframes share-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
}
@keyframes share-card-tilt {
  0% {
    transform: scale(1) rotate(0);
  }
  45% {
    transform: scale(0.94) rotate(-2deg);
  }
  100% {
    transform: scale(1) rotate(-3deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .share-panel-inner,
  .share-scrim,
  .share-done,
  .share-done-thumb {
    animation: none;
  }
}
</style>
