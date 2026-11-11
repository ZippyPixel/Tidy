<script>
import { useSkeletonGate } from '@/composables/useSkeletonGate'

// Renderless adapter for useSkeletonGate, for a template whose "loading" is a computed
// that doesn't exist yet in setup():
//   <SkeletonGate v-slot="{ showSkeleton, fadeClass }" :loading="state === 'loading'">
export default {
  name: 'SkeletonGate',
  props: {
    loading: { type: Boolean, default: false }
  },
  setup(props, { slots }) {
    const { showSkeleton, fadeClass } = useSkeletonGate(() => props.loading)
    return () => slots.default?.({ showSkeleton: showSkeleton.value, fadeClass: fadeClass.value })
  }
}
</script>
