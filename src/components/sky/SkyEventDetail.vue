<template>
  <div data-event-detail class="flex flex-col gap-5">
    <!-- the shape of HourDetailContent: a primary "when" line, the event, its sentence, tiles -->
    <div class="flex flex-col gap-1.5">
      <DialogTitle
        as="div"
        data-event-when
        class="text-[13px] font-semibold leading-4 tabular-nums text-primary"
      >
        {{ when }}
      </DialogTitle>
      <div data-event-label class="text-2xl font-semibold leading-8 tracking-[-0.01em]">
        {{ label }}
      </div>
      <DialogDescription
        as="div"
        class="text-[15px] leading-[22px] text-muted-foreground [text-wrap:pretty]"
        >{{ sub }}</DialogDescription
      >
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div
        v-for="tile in tiles"
        :key="tile.key"
        data-tile
        class="flex min-w-0 flex-col gap-1 rounded-lg bg-surface-raised px-3.5 py-3"
      >
        <span class="whitespace-nowrap text-xs font-medium leading-4 text-muted-foreground">{{
          tile.label
        }}</span>
        <span class="text-lg font-medium leading-6 tabular-nums [text-wrap:balance]">{{
          tile.value
        }}</span>
        <span class="text-xs leading-4 text-muted-foreground [text-wrap:pretty]">{{
          tile.sub || ' '
        }}</span>
      </div>
    </div>

    <p
      v-if="note"
      data-event-note
      class="text-[13px] leading-[19px] text-muted-foreground [text-wrap:pretty]"
    >
      {{ note }}
    </p>

    <div class="border-t border-input pt-3">
      <button
        type="button"
        data-event-jump
        class="-my-1.5 inline-flex min-h-9 items-center gap-0.5 rounded text-sm font-semibold text-primary outline-ring focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        @click="$emit('jump', event.t)"
      >
        <span>{{
          $t('sky.event.jump', {
            date: skyDate(event.t, tz, { weekday: 'short', month: 'short', day: 'numeric' })
          })
        }}</span>
        <AppIcon name="chevron-right" :size="18" :stroke-width="2" />
      </button>
    </div>
  </div>
</template>

<script>
import { DialogDescription, DialogTitle } from 'reka-ui'
import AppIcon from '@/components/common/AppIcon.vue'
import skyMixin from '@/mixins/skyMixin'
import skyEventMixin from '@/mixins/skyEventMixin'
import { dayStart, phaseKey } from '@/utils/sky'

const MEAN_KM = 384400

export default {
  name: 'SkyEventDetail',
  components: { AppIcon, DialogDescription, DialogTitle },
  mixins: [skyMixin, skyEventMixin],
  props: {
    /** one item of sky.events() */
    event: { type: Object, required: true },
    label: { type: String, required: true },
    sub: { type: String, default: '' },
    placeName: { type: String, required: true },
    tz: { type: String, required: true },
    now: { type: Number, required: true },
    sky: { type: Object, required: true }
  },
  emits: ['jump'],
  computed: {
    when() {
      return `${this.eventDate(this.event.t)} · ${this.skyClock(
        this.event.t,
        this.tz
      )} · ${this.eventIn(this.event.t)}`
    },
    tiles() {
      const e = this.event
      const clock = (t) => this.skyClock(t, this.tz)
      const tile = (key, value, sub = '') => ({
        key,
        label: this.$t(`sky.event.${key}`),
        value,
        sub
      })
      switch (e.kind) {
        case 'shower':
          return [
            tile(
              'peakNight',
              this.skyDate(e.t, this.tz, { weekday: 'short', month: 'short', day: 'numeric' }),
              this.$t('sky.event.giveOrTake')
            ),
            tile(
              'rate',
              this.$t('sky.event.perHour', { n: this.skyNumber(e.zhr) }),
              this.$t('sky.event.darkSky')
            ),
            tile('moon', this.$t('sky.moon.lit', { n: this.skyNumber(Math.round(e.moon * 100)) })),
            tile('bestTime', this.$t('sky.event.afterMidnight'))
          ]
        case 'lunar': {
          const tiles = [
            tile('type', this.eclipseKind(e.eclipse) || '—'),
            tile('peak', clock(e.t)),
            tile(
              'moonAtPeak',
              e.up
                ? this.$t('sky.event.up', { n: this.skyNumber(Math.round(e.alt)) })
                : this.$t('sky.event.belowHorizon')
            ),
            tile(
              'lasts',
              this.skyDuration(e.penumbral * 60000),
              this.$t('sky.event.penumbralPhase')
            )
          ]
          if (e.total > 0) tiles.push(tile('totality', this.skyDuration(e.total * 60000)))
          else if (e.partial > 0)
            tiles.push(tile('partialPhase', this.skyDuration(e.partial * 60000)))
          return tiles
        }
        case 'solar':
          return [
            tile('type', this.eclipseKind(e.eclipse) || '—'),
            tile('peak', clock(e.t)),
            tile(
              'covered',
              e.cover != null ? `${this.skyNumber(Math.round(e.cover * 100))}%` : '—'
            ),
            tile(
              'sunAtPeak',
              e.alt > 0
                ? this.$t('sky.event.up', { n: this.skyNumber(Math.round(e.alt)) })
                : this.$t('sky.event.belowHorizon')
            ),
            tile('begins', clock(e.begin)),
            tile('ends', clock(e.end))
          ]
        case 'season': {
          const { sun } = this.sky.day(dayStart(e.t, this.tz))
          const len =
            sun.rise != null && sun.set != null ? this.skyDuration(sun.set - sun.rise) : '—'
          return [
            tile('moment', clock(e.t)),
            tile('dayLength', len),
            tile('sunrise', clock(sun.rise)),
            tile('sunset', clock(sun.set))
          ]
        }
        case 'perigee':
        case 'apogee': {
          const size = Math.round((MEAN_KM / e.km - 1) * 100)
          const at = this.sky.instant(e.t)
          return [
            tile('distance', this.skyDistance(e.km)),
            tile(
              'size',
              size === 0
                ? this.$t('sky.moon.average')
                : this.$t(size > 0 ? 'sky.moon.bigger' : 'sky.moon.smaller', {
                    n: this.skyNumber(Math.abs(size))
                  })
            ),
            tile(
              'phase',
              this.$t(`sky.phases.${phaseKey(at.phase)}`),
              this.$t('sky.moon.lit', { n: this.skyNumber(Math.round(at.lit * 100)) })
            ),
            tile('time', clock(e.t))
          ]
        }
        default:
          return []
      }
    },
    note() {
      const notes = {
        shower: 'sky.event.notes.shower',
        lunar: 'sky.event.notes.lunar',
        solar: 'sky.event.notes.solar',
        perigee: 'sky.event.notes.perigee',
        apogee: 'sky.event.notes.apogee'
      }
      return notes[this.event.kind] ? this.$t(notes[this.event.kind]) : ''
    }
  }
}
</script>
