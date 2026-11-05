<template>
  <div>
    <AppHeader />
    <main
      class="page-gutter mx-auto w-full max-w-7xl pb-[calc(3rem+env(safe-area-inset-bottom))] pt-4 md:pt-6 xl:pt-8"
    >
      <slot />
    </main>
  </div>
</template>

<script>
import AppHeader from '@/components/layout/AppHeader.vue'

export default {
  name: 'DefaultLayout',
  components: {
    AppHeader
  }
}
</script>
