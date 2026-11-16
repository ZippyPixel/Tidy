<template>
  <section
    data-time-bar
    :aria-label="$t('sky.bar.label')"
    class="relative z-[5] flex min-w-0 flex-col rounded-card border bg-card p-4 text-card-foreground md:p-6"
  >
    <!-- design/TidySky time bar. Phones stack: place, date row, time row; md+ is one row that wraps -->
    <div
      class="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-4 md:gap-y-3"
    >
      <div class="flex min-w-0 items-center gap-2 md:max-w-[360px] md:flex-[1_1_240px]">
        <button
          ref="placeButton"
          type="button"
          data-place
          aria-haspopup="dialog"
          :aria-label="$t('sky.bar.placeAria', { name: place.name, country: place.country })"
          :class="fieldClass"
          @click="$emit('open-place', $event)"
        >
          <AppIcon name="map-pin" :size="18" class="flex-none text-muted-foreground" />
          <span class="flex min-w-0 flex-1 flex-col items-start">
            <span class="max-w-full truncate text-base font-semibold leading-5">{{
              place.name
            }}</span>
            <span
              data-place-tag
              class="max-w-full truncate text-xs leading-4 text-muted-foreground"
              >{{ placeTag }}</span
            >
          </span>
          <AppIcon name="globe" :size="18" class="flex-none text-muted-foreground" />
        </button>
        <button
          v-if="away && homeName"
          type="button"
          data-home
          :aria-label="$t('sky.bar.home', { name: homeName })"
          :title="$t('sky.bar.home', { name: homeName })"
          :class="roundClass"
          @click="$emit('reset-place')"
        >
          <AppIcon name="locate-fixed" :size="19" :stroke-width="1.75" />
        </button>
      </div>

      <div class="flex min-w-0 items-center gap-2 md:max-w-[400px] md:flex-[1_1_320px]">
        <button
          type="button"
          data-prev-day
          :aria-label="$t('sky.bar.previousDay')"
          :class="roundClass"
          @click="stepDay(-1)"
        >
          <AppIcon name="chevron-left" :size="18" :stroke-width="2" />
        </button>
        <button
          ref="dateButton"
          type="button"
          data-date
          aria-haspopup="dialog"
          :aria-expanded="String(calendarOpen)"
          :class="fieldClass"
          class="min-w-0 flex-1"
          @click="calendarOpen = !calendarOpen"
        >
          <AppIcon name="calendar" :size="18" class="flex-none text-muted-foreground" />
          <span class="flex min-w-0 flex-col items-start">
            <span data-date-text class="whitespace-nowrap text-base font-semibold leading-5">{{
              dateText
            }}</span>
            <span
              data-date-tag
              class="text-xs leading-4"
              :class="dayOffset === 0 ? 'font-semibold text-primary' : 'text-muted-foreground'"
            >
              {{ dateTag }}
            </span>
          </span>
        </button>
        <button
          type="button"
          data-next-day
          :aria-label="$t('sky.bar.nextDay')"
          :class="roundClass"
          @click="stepDay(1)"
        >
          <AppIcon name="chevron-right" :size="18" :stroke-width="2" />
        </button>
      </div>

      <div class="flex flex-none flex-wrap items-center gap-2">
        <div
          role="group"
          :aria-label="$t('sky.bar.time')"
          class="flex h-12 items-center gap-1 rounded-lg border bg-card px-1.5"
        >
          <input
            ref="hour"
            data-hour
            inputmode="numeric"
            maxlength="2"
            :aria-label="$t('sky.bar.hour')"
            :value="hourText"
            :class="digitClass"
            @input="onHour"
            @blur="blurHour"
            @keydown="stepKey($event, 60)"
            @focus="$event.target.select()"
          />
          <span
            aria-hidden="true"
            class="pb-[3px] text-2xl font-medium leading-none text-muted-foreground"
            >:</span
          >
          <input
            ref="minute"
            data-minute
            inputmode="numeric"
            maxlength="2"
            :aria-label="$t('sky.bar.minute')"
            :value="minuteText"
            :class="digitClass"
            @input="onMinute"
            @blur="blurMinute"
            @keydown="stepKey($event, 1)"
            @focus="$event.target.select()"
          />
        </div>
        <div
          role="group"
          :aria-label="$t('sky.bar.amPm')"
          class="flex h-12 rounded-lg bg-muted p-1"
        >
          <button
            type="button"
            data-am
            :aria-pressed="String(!pm)"
            :class="segmentClass(!pm)"
            @click="setHalf(false)"
          >
            {{ amLabel }}
          </button>
          <button
            type="button"
            data-pm
            :aria-pressed="String(pm)"
            :class="segmentClass(pm)"
            @click="setHalf(true)"
          >
            {{ pmLabel }}
          </button>
        </div>
        <span
          v-if="live"
          data-live
          class="inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground"
        >
          <span aria-hidden="true" class="size-2 rounded-full bg-current" />{{ $t('sky.bar.live') }}
        </span>
        <button
          v-else
          type="button"
          data-back-to-now
          class="inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground outline-ring hover:shadow-[inset_0_0_0_999px_hsl(var(--primary-foreground)/0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          @click="$emit('live')"
        >
          <AppIcon name="rotate-ccw" :size="16" :stroke-width="2" />
          <span>{{ $t('sky.bar.backToNow') }}</span>
        </button>
      </div>
    </div>

    <TimeSlider
      :minute="minute"
      :sun="day.sun"
      :sun-up="sunUp"
      :tz="tz"
      :time-text="timeText"
      @preview="$emit('preview', atMinute(t, tz, $event))"
      @commit="setMinutes"
    />

    <div
      class="mt-4 flex items-center gap-2 overflow-x-auto border-t pt-4 scrollbar-hide md:flex-wrap"
    >
      <span class="flex-none text-[13px] text-muted-foreground">{{ $t('sky.bar.jumpTo') }}</span>
      <button
        v-for="jump in jumps"
        :key="jump.key"
        type="button"
        data-jump
        class="inline-flex h-9 flex-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[13px] outline-ring hover:shadow-[inset_0_0_0_999px_hsl(var(--foreground)/0.05)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        @click="$emit('commit', jump.t)"
      >
        <span class="font-medium">{{ $t(`sky.jump.${jump.key}`) }}</span>
        <span class="tabular-nums text-muted-foreground">{{ jump.text }}</span>
      </button>
    </div>

    <!-- the calendar: a 336px popover under the date button from md, a bottom sheet below -->
    <template v-if="mounted">
      <Popover v-if="isMd" :open="calendarOpen" @update:open="calendarOpen = $event">
        <PopoverContent
          :reference="$refs.dateButton"
          align="start"
          :side-offset="8"
          class="w-[336px] rounded-tile p-3"
          :aria-label="$t('sky.calendar.label')"
          @interact-outside="keepOpenOnTrigger"
          @close-auto-focus.prevent="$refs.dateButton?.focus()"
        >
          <SkyCalendar :sky="sky" :t="t" :now="now" :tz="tz" @pick="pickDay" @today="pickToday" />
        </PopoverContent>
      </Popover>
      <Drawer v-else :open="calendarOpen" @update:open="calendarOpen = $event">
        <DrawerContent
          :aria-label="$t('sky.calendar.label')"
          @close-auto-focus.prevent="$refs.dateButton?.focus()"
        >
          <div
            class="px-[max(16px,env(safe-area-inset-left))] pb-[calc(16px+env(safe-area-inset-bottom))] pt-3"
          >
            <SkyCalendar :sky="sky" :t="t" :now="now" :tz="tz" @pick="pickDay" @today="pickToday" />
          </div>
        </DrawerContent>
      </Drawer>
    </template>
  </section>
</template>

<script>
import { useMediaQuery } from '@vueuse/core'
import AppIcon from '@/components/common/AppIcon.vue'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { Popover, PopoverContent } from '@/components/ui/popover'
import { currentIntlTag } from '@/i18n'
import skyMixin from '@/mixins/skyMixin'
import { atMinute, daysBetween, parts, shiftDays, wallToT } from '@/utils/sky'
import SkyCalendar from './SkyCalendar.vue'
import TimeSlider from './TimeSlider.vue'

const pad = (n) => String(n).padStart(2, '0')

export default {
  name: 'TimeBar',
  components: { AppIcon, Drawer, DrawerContent, Popover, PopoverContent, SkyCalendar, TimeSlider },
  mixins: [skyMixin],
  props: {
    place: { type: Object, required: true },
    /** a place other than the forecast location */
    away: { type: Boolean, default: false },
    homeName: { type: String, default: '' },
    /** the chosen instant (or now, when live) */
    t: { type: Number, required: true },
    now: { type: Number, required: true },
    tz: { type: String, required: true },
    live: { type: Boolean, default: true },
    sky: { type: Object, required: true },
    /** sky.day() and sky.ahead() for the chosen day */
    day: { type: Object, required: true },
    ahead: { type: Object, required: true },
    sunUp: { type: Boolean, default: false }
  },
  emits: ['commit', 'preview', 'live', 'open-place', 'reset-place'],
  setup() {
    return { isMd: useMediaQuery('(min-width: 768px)') }
  },
  data() {
    return {
      mounted: false,
      calendarOpen: false,
      // what is being typed, until it is applied or reverted
      editHour: null,
      editMinute: null,
      fieldClass:
        'flex h-12 w-full items-center gap-3 rounded-lg border bg-card px-3.5 text-left outline-ring hover:shadow-[inset_0_0_0_999px_hsl(var(--foreground)/0.05)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
      roundClass:
        'flex size-11 flex-none items-center justify-center rounded-full border outline-ring hover:shadow-[inset_0_0_0_999px_hsl(var(--foreground)/0.06)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
      digitClass:
        'h-10 w-11 rounded-lg bg-transparent p-0 text-center text-[26px] font-medium leading-10 tabular-nums outline-ring focus-visible:outline focus-visible:outline-2'
    }
  },
  computed: {
    clock() {
      return parts(this.t, this.tz)
    },
    minute() {
      return this.clock.h * 60 + this.clock.mi
    },
    pm() {
      return this.clock.h >= 12
    },
    hourText() {
      return this.editHour ?? pad(this.clock.h % 12 || 12)
    },
    minuteText() {
      return this.editMinute ?? pad(this.clock.mi)
    },
    timeText() {
      return this.skyClock(this.t, this.tz)
    },
    dayOffset() {
      return daysBetween(this.now, this.t, this.tz)
    },
    dateText() {
      return this.skyDate(this.t, this.tz, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    },
    dateTag() {
      const n = this.dayOffset
      if (n === 0) return this.$t('sky.bar.today')
      if (n === 1) return this.$t('sky.bar.tomorrow')
      if (n === -1) return this.$t('sky.bar.yesterday')
      const count = this.skyNumber(Math.abs(n))
      return n > 0
        ? this.$t('sky.bar.daysAhead', { n: count }, n)
        : this.$t('sky.bar.daysAgo', { n: count }, -n)
    },
    placeTag() {
      const key = this.away ? 'sky.bar.chosen' : 'sky.bar.yours'
      return this.place.country
        ? this.$t(`${key}WithCountry`, { country: this.place.country })
        : this.$t(key)
    },
    amLabel() {
      return this.dayPeriod(6)
    },
    pmLabel() {
      return this.dayPeriod(18)
    },
    jumps() {
      const { sun, moon } = this.day
      const short = (t) => this.skyDate(t, this.tz, { month: 'short', day: 'numeric' })
      const full = this.ahead.quarters.find((q) => q.quarter === 2)
      const fresh = this.ahead.quarters.find((q) => q.quarter === 0)
      return [
        sun.rise != null && { key: 'sunrise', t: sun.rise },
        sun.noon && { key: 'solarNoon', t: sun.noon.t },
        sun.set != null && { key: 'sunset', t: sun.set },
        moon.rise != null && { key: 'moonrise', t: moon.rise },
        full && { key: 'fullMoon', t: full.t, text: short(full.t) },
        fresh && { key: 'newMoon', t: fresh.t, text: short(fresh.t) }
      ]
        .filter(Boolean)
        .map((j) => ({ ...j, text: j.text ?? this.skyClock(j.t, this.tz) }))
    }
  },
  mounted() {
    this.mounted = true
  },
  methods: {
    atMinute,
    dayPeriod(hour) {
      const f = new Intl.DateTimeFormat(currentIntlTag(), {
        hour: 'numeric',
        hour12: true,
        timeZone: 'UTC'
      })
      return (
        f.formatToParts(Date.UTC(2026, 0, 1, hour)).find((p) => p.type === 'dayPeriod')?.value ??
        (hour < 12 ? 'AM' : 'PM')
      )
    },
    setMinutes(m) {
      this.editHour = null
      this.editMinute = null
      this.$emit('commit', atMinute(this.t, this.tz, m))
      // a revert to the same value doesn't re-render on its own
      this.$forceUpdate()
    },
    stepDay(n) {
      this.$emit('commit', shiftDays(this.t, this.tz, n))
    },
    setHalf(pm) {
      if (pm !== this.pm) this.setMinutes(this.minute + (pm ? 720 : -720))
    },
    // typed time: digits only; the hour moves on after two digits or a first digit above 2;
    // 13–23 is read as 24-hour; anything else reverts
    onHour(event) {
      const v = event.target.value.replace(/\D/g, '').slice(0, 2)
      if (v.length === 2 || (v.length === 1 && Number(v) > 2)) {
        this.commitHour(v)
        this.$refs.minute?.focus()
      } else {
        this.editHour = v
        event.target.value = v
      }
    },
    onMinute(event) {
      const v = event.target.value.replace(/\D/g, '').slice(0, 2)
      if (v.length === 2) this.commitMinute(v)
      else {
        this.editMinute = v
        event.target.value = v
      }
    },
    blurHour() {
      if (this.editHour != null) this.commitHour(this.editHour)
    },
    blurMinute() {
      if (this.editMinute != null) this.commitMinute(this.editMinute)
    },
    commitHour(v) {
      const n = Number(v)
      let h = null
      if (v !== '' && !Number.isNaN(n)) {
        if (n >= 13 && n <= 23) h = n
        else if (n === 0) h = 0
        else if (n <= 12) h = (n % 12) + (this.pm ? 12 : 0)
      }
      if (h == null) {
        this.editHour = null
        this.$forceUpdate()
      } else this.setMinutes(h * 60 + this.clock.mi)
    },
    commitMinute(v) {
      const n = Number(v)
      if (v === '' || Number.isNaN(n) || n > 59) {
        this.editMinute = null
        this.$forceUpdate()
      } else this.setMinutes(this.clock.h * 60 + n)
    },
    stepKey(event, mins) {
      if (event.key === 'Enter') {
        event.target.blur()
        return
      }
      const d = event.key === 'ArrowUp' ? 1 : event.key === 'ArrowDown' ? -1 : 0
      if (!d) return
      event.preventDefault()
      this.setMinutes((this.minute + d * mins + 1440) % 1440)
    },
    segmentClass(on) {
      return [
        'w-12 h-10 rounded-[calc(var(--radius)-4px)] text-sm font-semibold outline-ring focus-visible:outline focus-visible:outline-2',
        on
          ? 'bg-card text-foreground shadow-[0_1px_2px_hsl(220_30%_4%/0.12)]'
          : 'text-muted-foreground'
      ]
    },
    // picking a day keeps the time of day
    pickDay(cell) {
      this.calendarOpen = false
      this.$emit(
        'commit',
        wallToT(Date.UTC(cell.y, cell.mo, cell.d) + this.minute * 60000, this.tz)
      )
    },
    pickToday() {
      const p = parts(this.now, this.tz)
      this.pickDay({ y: p.y, mo: p.mo, d: p.d })
    },
    keepOpenOnTrigger(event) {
      if (this.$refs.dateButton?.contains(event.target)) event.preventDefault()
    }
  }
}
</script>
