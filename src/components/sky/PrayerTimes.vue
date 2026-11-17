<template>
  <DashboardCard :title="$t('sky.prayer.title')">
    <template #actions>
      <span data-prayer-day class="text-[13px] leading-4 tabular-nums text-muted-foreground">{{
        dayLine
      }}</span>
    </template>
    <div class="-mx-3 flex flex-col gap-0.5">
      <div
        v-for="row in rows"
        :key="row.key"
        data-prayer
        :aria-current="row.current ? 'time' : undefined"
        class="grid min-h-[52px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-1.5"
        :class="
          row.current
            ? 'bg-accent text-accent-foreground'
            : row.muted
            ? 'text-muted-foreground'
            : ''
        "
      >
        <span class="flex min-w-0 flex-col">
          <span class="text-[15px] font-semibold leading-5">{{ $t(`sky.prayer.${row.key}`) }}</span>
          <span
            class="text-xs leading-4"
            :class="
              row.current ? 'font-semibold' : row.next ? 'text-foreground' : 'text-muted-foreground'
            "
            >{{ row.sub }}</span
          >
        </span>
        <span class="whitespace-nowrap text-[17px] font-semibold leading-[22px] tabular-nums">{{
          skyClock(row.t, tz)
        }}</span>
      </div>
    </div>
    <div class="flex flex-col gap-2.5 border-t pt-4">
      <div class="flex items-center justify-between gap-3">
        <span class="text-[13px] text-muted-foreground">{{ $t('sky.prayer.method') }}</span>
        <button
          type="button"
          data-method
          :aria-label="methodAria"
          class="inline-flex h-9 min-w-0 items-center gap-1.5 rounded-full border px-3 text-[13px] outline-ring hover:shadow-[inset_0_0_0_999px_hsl(var(--foreground)/0.05)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          @click="prayerStore.cycleMethod()"
        >
          <span class="truncate font-semibold">{{ methodName }}</span>
          <span class="whitespace-nowrap tabular-nums text-muted-foreground">{{ angles }}</span>
          <AppIcon name="chevrons-up-down" :size="14" :stroke-width="2" class="flex-none" />
        </button>
      </div>
      <div class="flex items-center justify-between gap-3">
        <span class="text-[13px] text-muted-foreground">{{ $t('sky.prayer.asr') }}</span>
        <div
          role="group"
          :aria-label="$t('sky.prayer.asrLabel')"
          class="relative grid h-9 grid-cols-2 rounded-full bg-muted p-[3px]"
          :style="{ '--pad': '3px', '--index': prayerStore.hanafi ? 1 : 0 }"
        >
          <span
            aria-hidden="true"
            class="tidy-toggle-thumb pointer-events-none absolute rounded-full"
          />
          <button
            v-for="opt in asrOptions"
            :key="opt.key"
            type="button"
            :data-asr="opt.key"
            :aria-pressed="String(opt.on)"
            class="tidy-toggle-option relative h-[30px] rounded-full px-3.5 text-[13px] font-semibold outline-ring focus-visible:outline focus-visible:outline-2"
            :class="opt.on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="prayerStore.setHanafi(opt.hanafi)"
          >
            {{ $t(`sky.prayer.${opt.key}`) }}
          </button>
        </div>
      </div>
    </div>
    <p class="text-xs leading-[17px] text-muted-foreground [text-wrap:pretty]">
      {{ $t('sky.prayer.note') }}
    </p>
  </DashboardCard>
</template>

<script>
import { mapStores } from 'pinia'
import AppIcon from '@/components/common/AppIcon.vue'
import DashboardCard from '@/components/common/DashboardCard.vue'
import skyMixin from '@/mixins/skyMixin'
import usePrayerStore from '@/stores/prayer'
import { METHODS, dayStartAt, nextDayStart } from '@/utils/sky'

const ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

export default {
  name: 'PrayerTimes',
  components: { AppIcon, DashboardCard },
  mixins: [skyMixin],
  props: {
    t: { type: Number, required: true },
    tz: { type: String, required: true },
    sky: { type: Object, required: true },
    /** start of the chosen local day */
    ds: { type: Number, required: true }
  },
  computed: {
    ...mapStores(usePrayerStore),
    method() {
      return METHODS[this.prayerStore.method] ?? METHODS[0]
    },
    times() {
      return this.sky.prayer(this.ds, this.prayerStore.method, this.prayerStore.hanafi)
    },
    tomorrow() {
      return this.sky.prayer(
        nextDayStart(this.ds, this.tz),
        this.prayerStore.method,
        this.prayerStore.hanafi
      )
    },
    yesterday() {
      return this.sky.prayer(
        dayStartAt(this.ds, this.tz, -1),
        this.prayerStore.method,
        this.prayerStore.hanafi
      )
    },
    /**
     * The prayer whose time (waqt) the chosen instant falls in: Fajr runs from dawn to sunrise,
     * Dhuhr to Asr, Asr to sunset, Maghrib to Isha, and Isha to the next dawn, so before Fajr
     * it is still last night's Isha. Sunrise to Dhuhr is no prayer's time. Missing times (high
     * latitudes) drop out and the period before them runs on to the next known one.
     * Returns { key, end, lastNight } or null.
     */
    current() {
      const marks = [
        { key: 'isha', t: this.yesterday.isha, lastNight: true },
        ...ORDER.map((key) => ({ key, t: this.times[key] })),
        { key: 'fajr', t: this.tomorrow.fajr }
      ].filter((m) => m.t != null)
      let i = -1
      while (i + 1 < marks.length && marks[i + 1].t <= this.t) i++
      const mark = marks[i]
      if (!mark || mark.key === 'sunrise' || i === marks.length - 1) return null
      return { key: mark.key, end: marks[i + 1].t, lastNight: !!mark.lastNight }
    },
    // the next prayer to begin today (sunrise only ends Fajr, so it is never "next")
    nextKey() {
      return (
        ORDER.find(
          (key) => key !== 'sunrise' && this.times[key] != null && this.times[key] > this.t
        ) ?? null
      )
    },
    rows() {
      const cur = this.current
      return ORDER.map((key) => {
        const t = this.times[key]
        const current = cur?.key === key
        // between sunrise and Dhuhr no prayer is due: count down to Dhuhr instead
        const next = !cur && key === this.nextKey
        const left = current && this.skyDuration(cur.end - this.t)
        return {
          key,
          t,
          current,
          next,
          muted: !current && (key === 'sunrise' || (t != null && t <= this.t)),
          sub: current
            ? this.$t(cur.lastNight ? 'sky.prayer.lastNightLeft' : 'sky.prayer.nowLeft', {
                in: left
              })
            : next
            ? this.$t('sky.prayer.nextIn', { in: this.skyDuration(t - this.t) })
            : this.$t(`sky.prayer.sub.${key}`)
        }
      })
    },
    dayLine() {
      if (!this.nextKey && this.tomorrow.fajr != null)
        return this.$t('sky.prayer.fajrTomorrow', {
          time: this.skyClock(this.tomorrow.fajr, this.tz)
        })
      return this.skyDate(this.t, this.tz, { weekday: 'short', month: 'short', day: 'numeric' })
    },
    methodName() {
      return this.$t(`sky.prayer.methods.${this.method.key}`)
    },
    angles() {
      return `${this.skyDegrees(
        this.method.fajr,
        this.method.fajr % 1 ? 1 : 0
      )} / ${this.skyDegrees(this.method.isha, this.method.isha % 1 ? 1 : 0)}`
    },
    methodAria() {
      return this.$t('sky.prayer.methodAria', {
        name: this.methodName,
        fajr: this.skyNumber(this.method.fajr, this.method.fajr % 1 ? 1 : 0),
        isha: this.skyNumber(this.method.isha, this.method.isha % 1 ? 1 : 0)
      })
    },
    asrOptions() {
      return [
        { key: 'standard', hanafi: false, on: !this.prayerStore.hanafi },
        { key: 'hanafi', hanafi: true, on: this.prayerStore.hanafi }
      ]
    }
  }
}
</script>
