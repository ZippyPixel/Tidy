<template>
  <article
    ref="card"
    class="about-card grid items-center gap-6 rounded-[28px] border bg-[linear-gradient(165deg,hsl(var(--card))_25%,hsl(var(--accent))_100%)] px-6 py-8 md:grid-cols-[260px_minmax(0,1fr)] md:gap-12 md:bg-[linear-gradient(100deg,hsl(var(--card))_25%,hsl(var(--accent))_100%)] md:p-10 xl:px-16 xl:py-14"
    :class="{ 'is-revealed': revealed }"
  >
    <!-- design/TidyAbout(Responsive): illustration above the copy on phones (×1.2),
         beside it from md (×1.8); sunny skies get the design's soft glow behind -->
    <div class="relative h-[132px] w-36 md:h-[198px] md:w-[216px]">
      <div
        v-if="glow"
        aria-hidden="true"
        class="absolute -right-10 -top-12 size-[220px] rounded-full bg-[radial-gradient(circle,hsl(var(--sun)/0.35),hsl(var(--sun)/0)_65%)] md:-right-12 md:-top-14 md:size-60"
      />
      <!-- the art's soft halos run past its canvas; feather the edges so the canvas
           never reads as a box on the plain card (it was painted for full-bleed skies) -->
      <img :src="illustration" alt="" aria-hidden="true" class="illustration relative size-full object-contain" />
    </div>

    <div class="min-w-0">
      <p class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground md:mb-3.5">{{ eyebrow }}</p>
      <h2 class="text-[clamp(1.625rem,1.25rem+1.6vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.02em]">
        {{ titleLead }} <span class="font-light text-muted-foreground">{{ titleTail }}</span>
      </h2>
      <p class="mt-3.5 max-w-[440px] text-base leading-relaxed text-muted-foreground [text-wrap:pretty] md:mt-4">{{ body }}</p>
    </div>
  </article>
</template>

<script>
export default {
  name: 'AboutCard',
  props: {
    /** Illustration URL (decorative; the copy carries the meaning) */
    illustration: { type: String, required: true },
    /** warm sun glow behind the illustration (sunny skies only) */
    glow: { type: Boolean, default: false },
    eyebrow: { type: String, required: true },
    titleLead: { type: String, required: true },
    titleTail: { type: String, required: true },
    body: { type: String, required: true }
  },
  data() {
    return { revealed: false, observer: null }
  },
  mounted() {
    // rise in once on first scroll into view; the server render and reduced-motion
    // users get the card in place (see the CSS: hidden only once JS has marked it)
    const staticEntrance =
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (staticEntrance) {
      this.revealed = true
      return
    }
    this.$refs.card.classList.add('is-pending')
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

<style scoped>
.illustration {
  mask-image: radial-gradient(farthest-side, #000 74%, transparent 100%);
  -webkit-mask-image: radial-gradient(farthest-side, #000 74%, transparent 100%);
}

.about-card.is-pending:not(.is-revealed) {
  opacity: 0;
  transform: translateY(1.5rem);
}

.about-card.is-pending {
  transition: opacity 700ms cubic-bezier(0.2, 0, 0, 1), transform 700ms cubic-bezier(0.2, 0, 0, 1);
}
</style>
