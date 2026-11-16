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
        :aria-current="row.next ? 'time' : undefined"
        class="grid min-h-[52px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-1.5"
        :class="
          row.next ? 'bg-accent text-accent-foreground' : row.muted ? 'text-muted-foreground' : ''
        "
      >
        <span class="flex min-w-0 flex-col">
          <span class="text-[15px] font-semibold leading-5">{{ $t(`sky.prayer.${row.key}`) }}</span>
          <span
            class="text-xs leading-4"
            :class="row.next ? 'font-semibold' : 'text-muted-foreground'"
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
          class="flex h-9 rounded-full bg-muted p-[3px]"
        >
          <button
            v-for="opt in asrOptions"
            :key="opt.key"
            type="button"
            :data-asr="opt.key"
            :aria-pressed="String(opt.on)"
            class="h-[30px] rounded-full px-3.5 text-[13px] font-semibold outline-ring focus-visible:outline focus-visible:outline-2"
            :class="
              opt.on
                ? 'bg-card text-foreground shadow-[0_1px_2px_hsl(220_30%_4%/0.12)]'
                : 'text-muted-foreground'
            "
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
import { METHODS, nextDayStart } from '@/utils/sky'

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
    // the next prayer after the chosen time (sunrise only ends Fajr, so it is never "next")
    nextKey() {
      return (
        ORDER.find(
          (key) => key !== 'sunrise' && this.times[key] != null && this.times[key] > this.t
        ) ?? null
      )
    },
    rows() {
      return ORDER.map((key) => {
        const t = this.times[key]
        const next = key === this.nextKey
        return {
          key,
          t,
          next,
          muted: key === 'sunrise' || (t != null && t <= this.t),
          sub: next
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
