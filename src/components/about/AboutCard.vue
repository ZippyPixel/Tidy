<template>
  <article
    ref="card"
    class="relative flex flex-col items-center gap-6 overflow-visible rounded-[28px] px-6 py-9 ring-1 transition-[opacity,transform] duration-700 ease-out sm:px-9 md:flex-row md:gap-10 md:px-12 md:py-10"
    :class="[
      sky.surface,
      sky.ring,
      flip ? 'md:flex-row-reverse' : '',
      revealed ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
    ]"
  >
    <div
      class="w-[230px] max-w-full shrink-0 sm:w-[280px] md:w-[38%] md:max-w-[300px]"
      :class="flip ? 'md:-mr-4 lg:-mr-6' : 'md:-ml-4 lg:-ml-6'"
    >
      <img :src="illustration" alt="" aria-hidden="true" class="block w-full" />
    </div>

    <div class="w-full md:flex-1">
      <p class="text-[11px] font-medium uppercase tracking-[0.32em]" :class="sky.eyebrow">
        {{ eyebrow }}
      </p>
      <h2 class="mt-4 text-3xl leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.6rem]">
        <span :class="leadClass">{{ titleLead }}</span> <span :class="tailClass">{{ titleTail }}</span>
      </h2>
      <p class="mt-5 max-w-[48ch] text-[15px] leading-relaxed md:text-base" :class="sky.body">
        {{ body }}
      </p>
    </div>
  </article>
</template>

<script>
/**
 * A card is painted as the sky its feature describes — daylight panels read
 * light, sun/moon and air panels read dark — which is what makes the page
 * alternate rather than decoration.
 *
 * Keep the full Tailwind class strings inline: the JIT compiler scans this file
 * for them, so they cannot be assembled from fragments.
 */
const SKIES = {
  day: {
    surface: 'bg-[linear-gradient(100deg,#FDFEFF_0%,#EDF6FB_40%,#BEDEF0_100%)]',
    ring: 'ring-white/70',
    eyebrow: 'text-slate-500/80',
    strong: 'font-semibold text-slate-900',
    soft: 'font-light text-slate-500',
    body: 'text-slate-600'
  },
  overcast: {
    surface: 'bg-[linear-gradient(100deg,#FBFCFD_0%,#EDF2F6_40%,#C3D4E1_100%)]',
    ring: 'ring-white/70',
    eyebrow: 'text-slate-500/80',
    strong: 'font-semibold text-slate-900',
    soft: 'font-light text-slate-500',
    body: 'text-slate-600'
  },
  night: {
    surface: 'bg-[linear-gradient(100deg,#000000_0%,#101014_38%,#55565C_100%)]',
    ring: 'ring-white/10',
    eyebrow: 'text-white/45',
    strong: 'font-semibold text-white',
    soft: 'font-light text-white/50',
    body: 'text-white/65'
  },
  haze: {
    surface: 'bg-[linear-gradient(100deg,#08080A_0%,#151210_40%,#5A4E42_100%)]',
    ring: 'ring-white/10',
    eyebrow: 'text-white/45',
    strong: 'font-semibold text-white',
    soft: 'font-light text-white/50',
    body: 'text-white/65'
  }
}

// Light skies lead with the emphasis, dark skies land on it — the two card
// treatments in the design read in opposite directions.
const LEAD_EMPHASIS = ['day', 'overcast']

export default {
  name: 'AboutCard',
  props: {
    /** Which sky this card is painted in */
    tone: {
      type: String,
      required: true,
      validator: (v) => v in SKIES
    },
    /** Illustration URL */
    illustration: { type: String, required: true },
    /** Puts the illustration on the right */
    flip: { type: Boolean, default: false },
    eyebrow: { type: String, required: true },
    titleLead: { type: String, required: true },
    titleTail: { type: String, required: true },
    body: { type: String, required: true }
  },
  data() {
    return {
      revealed: false,
      observer: null
    }
  },
  computed: {
    sky() {
      return SKIES[this.tone]
    },
    emphasizesLead() {
      return LEAD_EMPHASIS.includes(this.tone)
    },
    leadClass() {
      return this.emphasizesLead ? this.sky.strong : this.sky.soft
    },
    tailClass() {
      return this.emphasizesLead ? this.sky.soft : this.sky.strong
    }
  },
  mounted() {
    const staticEntrance =
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (staticEntrance) {
      this.revealed = true
      return
    }

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        this.revealed = true
        this.observer.disconnect()
      },
      { rootMargin: '0px 0px -12% 0px' }
    )
    this.observer.observe(this.$refs.card)
  },
  beforeUnmount() {
    this.observer?.disconnect()
  }
}
</script>
