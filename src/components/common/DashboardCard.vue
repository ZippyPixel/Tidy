<template>
  <section
    class="flex min-w-0 flex-col gap-4 rounded-card border bg-card p-4 text-card-foreground md:p-6"
    :aria-labelledby="titleId"
  >
    <!-- V3 card shell: 20px radius, hairline border, 16/24 padding, muted 14px title -->
    <div v-if="title || $slots.actions" class="flex min-h-6 flex-wrap items-center justify-between gap-3">
      <h2 :id="titleId" class="text-sm font-medium leading-6 text-muted-foreground">{{ title }}</h2>
      <slot name="actions" />
    </div>
    <slot />
  </section>
</template>

<script>
let uid = 0

export default {
  name: 'DashboardCard',
  props: {
    title: { type: String, default: '' }
  },
  data() {
    return { titleId: `card-title-${++uid}` }
  }
}
</script>
