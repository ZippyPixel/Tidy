import { computed, getCurrentInstance, onBeforeUnmount, ref, watch } from 'vue'

// Once shown, a skeleton stays at least this long so a fast response doesn't flash it.
export const MIN_SKELETON_MS = 300

/**
 * The one rule for when a card shows its skeleton (design/Tidy Loading, section 05).
 *
 * `isLoading` is a getter that is true while the card has nothing to show for the
 * place on screen (first load, or a new city or station). The skeleton appears at
 * once, stays at least MIN_SKELETON_MS, then the content fades in over 200ms
 * (`fadeClass`, opacity only; the CSS drops it under reduced motion). Content that was
 * there from the first frame never fades.
 */
export function useSkeletonGate(isLoading) {
  const showSkeleton = ref(!!isLoading())
  const revealed = ref(false)
  let shownAt = showSkeleton.value ? Date.now() : 0
  let timer = null

  const clear = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }

  const hide = () => {
    timer = null
    showSkeleton.value = false
    revealed.value = true
  }

  watch(
    () => !!isLoading(),
    (loading) => {
      if (loading) {
        clear()
        if (!showSkeleton.value) {
          showSkeleton.value = true
          shownAt = Date.now()
        }
        return
      }
      if (!showSkeleton.value || timer) return
      const wait = MIN_SKELETON_MS - (Date.now() - shownAt)
      if (wait > 0) timer = setTimeout(hide, wait)
      else hide()
    }
  )

  if (getCurrentInstance()) onBeforeUnmount(clear)

  const fadeClass = computed(() => (revealed.value && !showSkeleton.value ? 'tidy-fade-in' : ''))

  return { showSkeleton, fadeClass }
}

export default useSkeletonGate
