<template>
  <section
    :aria-label="$t('share.banner.label')"
    data-share-banner
    class="relative mb-4 flex flex-wrap items-start gap-3 rounded-tile border border-primary/[0.22] bg-accent/70 py-3 pl-3 pr-2 sm:items-center sm:gap-4 sm:pl-4 sm:pr-3 md:mb-6"
  >
    <!-- design/TidyShareBanner: above LocationHeading when the dashboard opens from a share
         link. "Show my weather" goes back to the visitor's own location and drops the link's
         params; the X only hides the banner. -->
    <span
      aria-hidden="true"
      class="flex size-9 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground"
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="1.9"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="M2 12c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2 M2 17c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2 M12 3v4 M9.5 5.5 12 3l2.5 2.5"
        />
      </svg>
    </span>
    <div class="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5 pr-10 sm:pr-0">
      <span class="text-xs font-semibold leading-4 text-accent-foreground">{{
        $t('share.banner.kicker')
      }}</span>
      <i18n-t
        :keypath="date ? 'share.banner.body' : 'share.banner.bodyNoDate'"
        tag="span"
        class="text-sm leading-5 [text-wrap:pretty]"
      >
        <template #place>
          <b class="font-semibold">{{ place }}</b>
        </template>
        <template v-if="date" #date>{{ date }}</template>
      </i18n-t>
    </div>
    <div class="ml-12 flex flex-none items-center gap-1 sm:ml-auto">
      <button
        type="button"
        data-share-mine
        class="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/30 bg-card px-3.5 text-sm font-semibold outline-ring hover:bg-card/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        @click="$emit('mine')"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M2 12h3 M19 12h3 M12 2v3 M12 19v3 M12 5a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z"
          />
        </svg>
        {{ $t('share.banner.mine') }}
      </button>
      <button
        type="button"
        data-share-dismiss
        :aria-label="$t('share.banner.dismiss')"
        class="absolute right-1 top-1 flex size-10 items-center justify-center rounded-full text-accent-foreground outline-ring hover:bg-foreground/[0.06] focus-visible:outline focus-visible:outline-2 sm:static"
        @click="$emit('dismiss')"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 6 6 18 M6 6l12 12" />
        </svg>
      </button>
    </div>
  </section>
</template>

<script>
export default {
  name: 'ShareBanner',
  props: {
    place: { type: String, required: true },
    /** the shared day, formatted; empty when the link had none */
    date: { type: String, default: '' }
  },
  emits: ['mine', 'dismiss']
}
</script>
