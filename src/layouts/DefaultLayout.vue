<template>
  <div>
    <AppHeader />
    <main>
      <RouterView />
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