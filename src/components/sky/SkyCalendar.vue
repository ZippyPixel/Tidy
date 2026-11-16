<template>
  <div data-calendar class="flex flex-col">
    <!-- design/TidySky calendar: the moon's phase under every day, a ring on today, the chosen day filled -->
    <div class="flex items-center justify-between gap-2">
      <button
        type="button"
        data-cal-prev
        :aria-label="$t('sky.calendar.previousMonth')"
        :class="navClass"
        @click="shift(-1)"
      >
        <AppIcon name="chevron-left" :size="18" :stroke-width="2" />
      </button>
      <span data-cal-title aria-live="polite" class="text-[15px] font-semibold">{{ title }}</span>
      <button
        type="button"
        data-cal-next
        :aria-label="$t('sky.calendar.nextMonth')"
        :class="navClass"
        @click="shift(1)"
      >
        <AppIcon name="chevron-right" :size="18" :stroke-width="2" />
      </button>
    </div>
    <div class="mt-2 grid grid-cols-7 gap-0.5">
      <span
        v-for="(d, i) in weekdays"
        :key="i"
        aria-hidden="true"
        class="flex h-6 items-center justify-center text-xs font-medium text-muted-foreground"
        >{{ d }}</span
      >
      <button
        v-for="cell in cells"
        :key="cell.u"
        type="button"
        data-day
        :aria-label="cell.aria"
        :aria-pressed="String(cell.selected)"
        :aria-current="cell.today ? 'date' : undefined"
        class="flex h-[46px] flex-col items-center justify-center gap-[3px] rounded-[10px] outline-ring hover:shadow-[inset_0_0_0_999px_hsl(var(--foreground)/0.07)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        :class="[
          cell.selected
            ? 'bg-primary text-primary-foreground'
            : cell.inMonth
            ? ''
            : 'text-muted-foreground opacity-[0.55]',
          cell.today && !cell.selected ? 'shadow-[inset_0_0_0_1.5px_hsl(var(--primary))]' : '',
          cell.today || cell.selected ? 'font-bold' : 'font-normal'
        ]"
        @click="$emit('pick', cell)"
      >
        <span class="text-sm leading-4 tabular-nums">{{ skyNumber(cell.d) }}</span>
        <svg viewBox="-6 -6 12 12" width="12" height="12" aria-hidden="true" class="block">
          <circle
            r="5"
            :class="
              cell.selected ? 'fill-[hsl(var(--primary-foreground)/0.35)]' : 'fill-moon-shadow'
            "
          />
          <path
            :d="cell.glyph"
            :class="cell.selected ? 'fill-primary-foreground' : 'fill-moon-lit'"
          />
        </svg>
      </button>
    </div>
    <div class="mt-2 flex items-center justify-between gap-2 border-t pt-2">
      <span class="text-xs text-muted-foreground">{{ $t('sky.calendar.note') }}</span>
      <button
        type="button"
        data-cal-today
        class="h-9 rounded-full px-3 text-sm font-semibold text-primary outline-ring hover:bg-foreground/5 focus-visible:outline focus-visible:outline-2"
        @click="$emit('today')"
      >
        {{ $t('sky.bar.today') }}
      </button>
    </div>
  </div>
</template>

<script>
import AppIcon from '@/components/common/AppIcon.vue'
import { currentIntlTag } from '@/i18n'
import skyMixin from '@/mixins/skyMixin'
import { moonLitPath } from '@/utils/astro'
import { parts } from '@/utils/sky'

export default {
  name: 'SkyCalendar',
  components: { AppIcon },
  mixins: [skyMixin],
  props: {
    /** createSky() for the place */
    sky: { type: Object, required: true },
    /** the chosen instant and now */
    t: { type: Number, required: true },
    now: { type: Number, required: true },
    tz: { type: String, required: true }
  },
  emits: ['pick', 'today'],
  data() {
    const p = parts(this.t, this.tz)
    return {
      month: { y: p.y, mo: p.mo },
      navClass:
        'flex size-10 items-center justify-center rounded-full outline-ring hover:bg-foreground/[0.06] focus-visible:outline focus-visible:outline-2'
    }
  },
  computed: {
    title() {
      return new Intl.DateTimeFormat(currentIntlTag(), {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      }).format(Date.UTC(this.month.y, this.month.mo, 1))
    },
    weekdays() {
      const f = new Intl.DateTimeFormat(currentIntlTag(), { weekday: 'narrow', timeZone: 'UTC' })
      // 2026-11-01 is a Sunday
      return Array.from({ length: 7 }, (_, i) => f.format(Date.UTC(2026, 10, 1 + i)))
    },
    cells() {
      const sel = parts(this.t, this.tz)
      const today = parts(this.now, this.tz)
      const same = (c, p) => c.y === p.y && c.mo === p.mo && c.d === p.d
      const long = new Intl.DateTimeFormat(currentIntlTag(), {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      })
      return this.sky.month(this.month.y, this.month.mo).map((c) => ({
        ...c,
        inMonth: c.mo === this.month.mo,
        selected: same(c, sel),
        today: same(c, today),
        glyph: moonLitPath(5, Math.max(0.03, c.k), c.wax),
        aria: this.$t('sky.calendar.day', {
          date: long.format(c.u),
          lit: this.skyNumber(Math.round(c.k * 100))
        })
      }))
    }
  },
  methods: {
    shift(n) {
      const d = new Date(Date.UTC(this.month.y, this.month.mo + n, 1))
      this.month = { y: d.getUTCFullYear(), mo: d.getUTCMonth() }
    }
  }
}
</script>
