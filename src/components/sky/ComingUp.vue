<template>
  <DashboardCard :title="$t('sky.ahead.title')">
    <!-- events in time order from the chosen day, EVENT_YEARS ahead at most, a page at a time:
         the next page loads when the list is scrolled to its end (or from "Show more") -->
    <ScrollArea
      data-ahead-list
      :aria-label="$t('sky.ahead.listLabel')"
      role="region"
      class="-mx-3 h-[440px] md:h-[480px]"
    >
      <div class="flex flex-col pr-2">
        <button
          v-for="row in rows"
          :key="row.id"
          type="button"
          data-ahead
          aria-haspopup="dialog"
          class="grid min-h-[60px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg px-3 py-2 text-left outline-ring hover:bg-foreground/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
          @click="open(row, $event)"
        >
          <span class="flex min-w-0 flex-col gap-0.5">
            <span class="text-[15px] font-semibold leading-5">{{ row.label }}</span>
            <span class="text-[13px] leading-[18px] text-muted-foreground [text-wrap:pretty]">{{
              row.sub
            }}</span>
          </span>
          <span
            class="flex flex-col items-end gap-0.5 whitespace-nowrap text-[13px] leading-[18px] tabular-nums"
          >
            <span data-ahead-date class="font-semibold">{{ row.date }}</span>
            <span data-ahead-in class="text-muted-foreground">{{ row.in }}</span>
          </span>
        </button>

        <!-- the next page is being worked out: two rows in the loaded rows' shape -->
        <div v-if="loading" data-ahead-loading aria-hidden="true" class="flex flex-col">
          <div
            v-for="i in 2"
            :key="i"
            class="grid min-h-[60px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-3 py-2"
          >
            <span class="flex flex-col gap-2"
              ><Skeleton class="h-3.5 w-40" /><Skeleton class="h-2.5 w-56 max-w-full"
            /></span>
            <span class="flex flex-col items-end gap-2"
              ><Skeleton class="h-3 w-24" /><Skeleton class="h-2.5 w-14"
            /></span>
          </div>
        </div>
        <div ref="sentinel" data-ahead-sentinel class="h-px" />
        <button
          v-if="!done && !loading"
          type="button"
          data-ahead-more
          class="mx-3 mb-2 mt-1 h-9 self-start rounded-full px-3 text-sm font-semibold text-primary outline-ring hover:bg-foreground/5 focus-visible:outline focus-visible:outline-2"
          @click="loadMore"
        >
          {{ $t('sky.ahead.more') }}
        </button>
        <p
          v-if="done"
          data-ahead-end
          class="px-3 pb-2 pt-1 text-xs leading-4 text-muted-foreground"
        >
          {{
            $t('sky.ahead.end', { date: skyDate(horizon, tz, { month: 'long', year: 'numeric' }) })
          }}
        </p>
      </div>
    </ScrollArea>
    <p role="status" class="sr-only">{{ loading ? $t('sky.ahead.loading') : '' }}</p>

    <DetailModalShell
      ref="shell"
      :value="selected"
      :opener="opener"
      history-key="tidySkyEvent"
      @close="onClosed"
    >
      <template #default="{ value }">
        <SkyEventDetail
          :event="value.event"
          :label="value.label"
          :sub="value.sub"
          :place-name="placeName"
          :tz="tz"
          :now="now"
          :sky="sky"
          @jump="jump"
        />
      </template>
    </DetailModalShell>
  </DashboardCard>
</template>

<script>
import DashboardCard from '@/components/common/DashboardCard.vue'
import DetailModalShell from '@/components/common/DetailModalShell.vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import skyMixin from '@/mixins/skyMixin'
import skyEventMixin from '@/mixins/skyEventMixin'
import { EVENT_PAGE } from '@/utils/sky'
import SkyEventDetail from './SkyEventDetail.vue'

export default {
  name: 'ComingUp',
  components: { DashboardCard, DetailModalShell, ScrollArea, Skeleton, SkyEventDetail },
  mixins: [skyMixin, skyEventMixin],
  props: {
    tz: { type: String, required: true },
    /** the real clock: "in N days" counts from today, not from the chosen day */
    now: { type: Number, required: true },
    /** createSky() for the place, and the start of the chosen local day */
    sky: { type: Object, required: true },
    ds: { type: Number, required: true },
    /** where we are, for "visible from …" */
    placeName: { type: String, required: true },
    lat: { type: Number, required: true }
  },
  emits: ['commit'],
  data() {
    return { items: [], done: false, loading: false, horizon: 0, selected: null, opener: null }
  },
  computed: {
    rows() {
      return this.items.map((event) => ({
        id: event.id,
        event,
        ...this.describe(event),
        date: this.eventDate(event.t),
        in: this.eventIn(event.t)
      }))
    }
  },
  watch: {
    sky() {
      this.reset()
    },
    ds() {
      this.reset()
    }
  },
  created() {
    this.reset()
  },
  mounted() {
    // the next page loads when the end of the list scrolls into view
    if (typeof IntersectionObserver === 'undefined') return
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) this.loadMore()
      },
      { rootMargin: '0px 0px 120px 0px' }
    )
    this.observer.observe(this.$refs.sentinel)
  },
  beforeUnmount() {
    this.observer?.disconnect()
    clearTimeout(this.pageTimer)
  },
  methods: {
    // a day's feed is cached by createSky, so coming back to a day keeps what was loaded
    reset() {
      clearTimeout(this.pageTimer)
      this.loading = false
      this.feed = this.sky.events(this.ds)
      if (!this.feed.items.length) this.feed.more(EVENT_PAGE)
      this.sync()
    },
    sync() {
      this.items = this.feed.items.slice()
      this.done = this.feed.done
      this.horizon = this.feed.horizon
    },
    // the work runs after the skeleton rows have painted, so scrolling never stalls
    loadMore() {
      if (this.done || this.loading) return
      this.loading = true
      const feed = this.feed
      this.pageTimer = setTimeout(() => {
        if (feed !== this.feed) return
        feed.more(EVENT_PAGE)
        this.loading = false
        this.sync()
      }, 0)
    },
    open(row, event) {
      this.opener = event?.currentTarget ?? null
      this.selected = { event: row.event, label: row.label, sub: row.sub }
    },
    // the URL changes only once the surface has closed, and on a phone taken its history
    // step with it: sooner would race that step (as with the station finder)
    jump(t) {
      this.pendingJump = t
      this.$refs.shell.requestClose()
    },
    onClosed() {
      this.selected = null
      const t = this.pendingJump
      this.pendingJump = null
      if (t != null) this.$emit('commit', t)
    }
  }
}
</script>
