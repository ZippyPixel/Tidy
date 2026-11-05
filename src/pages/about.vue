<template>
  <div class="pt-6 md:pt-10 xl:pt-14">
    <!-- design/TidyAboutResponsive: page padding 40 / 64 / 88 including <main>'s own -->
    <header class="max-w-3xl">
      <p class="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground md:mb-5">
        {{ $t('about.eyebrow') }}
      </p>
      <h1
        class="text-[clamp(2.125rem,1.5rem+3.2vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.025em] [text-wrap:balance]"
      >
        {{ $t('about.titleLead') }}<br />
        <span class="font-light text-muted-foreground">{{ $t('about.titleTail') }}</span>
      </h1>
      <p class="mt-6 max-w-[620px] text-base leading-relaxed text-muted-foreground [text-wrap:pretty] md:mt-7 md:text-lg">
        {{ $t('about.intro') }}
      </p>
    </header>

    <!-- one card per panel, in home-screen order -->
    <div class="mt-10 flex flex-col gap-6 md:mt-16 md:gap-8">
      <AboutCard
        v-for="card in cards"
        :key="card.key"
        :illustration="card.illustration"
        :glow="card.glow"
        :eyebrow="$t(`about.cards.${card.key}.eyebrow`)"
        :title-lead="$t(`about.cards.${card.key}.titleLead`)"
        :title-tail="$t(`about.cards.${card.key}.titleTail`)"
        :body="$t(`about.cards.${card.key}.body`)"
      />
    </div>

    <!-- what lives in Settings rather than on a panel -->
    <footer class="mt-10 border-t pt-8 md:mt-16">
      <p class="max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">{{ $t('about.settingsNote') }}</p>
      <p class="mt-4 text-[13px] text-muted-foreground">{{ $t('about.dataSource') }}</p>
    </footer>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'
import AboutCard from '@/components/about/AboutCard.vue'
import skyNow from '@/assets/about/sky-now.svg'
import skyHours from '@/assets/about/sky-hours.svg'
import skyWeek from '@/assets/about/sky-week.svg'
import skyNight from '@/assets/about/sky-night.svg'
import skyAir from '@/assets/about/sky-air.svg'

// same order as the phone dashboard: Current → Hourly → Forecast → Sun & Moon → Details
const CARDS = [
  { key: 'now', illustration: skyNow, glow: true },
  { key: 'hours', illustration: skyHours, glow: true },
  { key: 'week', illustration: skyWeek, glow: false },
  { key: 'night', illustration: skyNight, glow: false },
  { key: 'air', illustration: skyAir, glow: true }
]

export default {
  name: 'AboutView',
  components: { AboutCard },
  setup() {
    const { t } = useI18n()
    useHead({ title: () => `${t('about.eyebrow')} · Tidy` })
  },
  data() {
    return { cards: CARDS }
  }
}
</script>
