<template>
  <!-- planetary info -->
  <div
    class="w-full md:w-auto md:min-w-[15rem] lg:flex-none lg:w-[32%] md:min-h-[20rem] flex flex-col gap-3 md:gap-4"
  >
    <SunArc />
    <MoonArc />
  </div>
</template>

<script>
import SunArc from './SunArc.vue'
import MoonArc from './MoonArc.vue'

export default {
  name: 'PlanetaryInfo',
  components: { SunArc, MoonArc }
}
</script>
