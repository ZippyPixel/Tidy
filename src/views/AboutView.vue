<template>
  <!-- overflow-x-clip: the illustrations deliberately break past the card edges -->
  <div class="w-full overflow-x-clip pb-20">
    <div class="container mx-auto px-4">
      <!-- hero -->
      <header class="max-w-3xl pt-10 md:pt-20">
        <p
          class="text-[11px] font-medium uppercase tracking-[0.32em] text-slate-500 dark:text-night-muted"
        >
          {{ $t('about.eyebrow') }}
        </p>
        <h1
          class="mt-5 text-4xl leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem] text-slate-900 dark:text-night-text"
        >
          <span class="block font-semibold">{{ $t('about.titleLead') }}</span>
          <span class="block font-light text-slate-400 dark:text-night-muted">
            {{ $t('about.titleTail') }}
          </span>
        </h1>
        <p
          class="mt-6 max-w-[54ch] text-base leading-relaxed text-slate-600 dark:text-night-muted md:text-lg"
        >
          {{ $t('about.intro') }}
        </p>
      </header>

      <!-- one card per panel on the home screen -->
      <div class="mt-14 flex flex-col gap-6 md:mt-20 md:gap-8">
        <AboutCard
          v-for="card in cards"
          :key="card.key"
          :tone="card.tone"
          :illustration="card.illustration"
          :flip="card.flip"
          :eyebrow="$t(`about.cards.${card.key}.eyebrow`)"
          :title-lead="$t(`about.cards.${card.key}.titleLead`)"
          :title-tail="$t(`about.cards.${card.key}.titleTail`)"
          :body="$t(`about.cards.${card.key}.body`)"
        />
      </div>

      <!-- everything that lives in Settings rather than on a panel -->
      <footer class="mt-14 border-t border-slate-200 pt-8 dark:border-white/10 md:mt-20">
        <p class="max-w-[60ch] text-[15px] leading-relaxed text-slate-600 dark:text-night-muted">
          {{ $t('about.settingsNote') }}
        </p>
        <p class="mt-4 text-[13px] text-slate-400 dark:text-night-muted/70">
          {{ $t('about.dataSource') }}
        </p>
      </footer>
    </div>
  </div>
</template>

<script>
import AboutCard from '@/components/about/AboutCard.vue'
import skyNow from '@/assets/about/sky-now.svg'
import skyNight from '@/assets/about/sky-night.svg'
import skyWeek from '@/assets/about/sky-week.svg'
import skyAir from '@/assets/about/sky-air.svg'
import skyHours from '@/assets/about/sky-hours.svg'

// Ordered to match the home screen, and alternating so no two skies touch.
const CARDS = [
  { key: 'now', tone: 'day', illustration: skyNow, flip: false },
  { key: 'night', tone: 'night', illustration: skyNight, flip: true },
  { key: 'week', tone: 'overcast', illustration: skyWeek, flip: false },
  { key: 'air', tone: 'haze', illustration: skyAir, flip: true },
  { key: 'hours', tone: 'day', illustration: skyHours, flip: false }
]

export default {
  name: 'AboutView',
  components: { AboutCard },
  data() {
    return { cards: CARDS }
  }
}
</script>
