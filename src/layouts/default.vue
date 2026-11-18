<template>
  <div>
    <AppHeader />
    <main
      class="page-gutter mx-auto w-full max-w-7xl pb-[calc(3rem+env(safe-area-inset-bottom))] pt-4 md:pt-6 xl:pt-8"
    >
      <slot />
    </main>
    <!-- the share composer: its own chunk, loaded the first time someone shares -->
    <ShareComposer v-if="everOpened" :site-origin="siteOrigin" @close="closeShare" />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import { mapActions, mapState } from 'pinia'
import AppHeader from '@/components/layout/AppHeader.vue'
import useShareStore from '@/stores/share'

export default {
  name: 'DefaultLayout',
  components: {
    AppHeader,
    ShareComposer: defineAsyncComponent(() => import('@/components/share/ShareComposer.vue'))
  },
  setup() {
    // public runtime config (NUXT_PUBLIC_SITE_URL): the site the share card links back to
    return { siteOrigin: useRuntimeConfig().public.siteUrl || '' }
  },
  computed: {
    ...mapState(useShareStore, ['everOpened'])
  },
  methods: {
    ...mapActions(useShareStore, ['closeShare'])
  }
}
</script>
