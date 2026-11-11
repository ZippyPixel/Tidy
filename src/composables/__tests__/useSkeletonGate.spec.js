import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { MIN_SKELETON_MS, useSkeletonGate } from '@/composables/useSkeletonGate'

describe('useSkeletonGate', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('shows the skeleton from the first frame when there is nothing to show', () => {
    const { showSkeleton, fadeClass } = useSkeletonGate(() => true)
    expect(showSkeleton.value).toBe(true)
    expect(fadeClass.value).toBe('')
  })

  it('keeps content without a fade when it was there from the start', () => {
    const { showSkeleton, fadeClass } = useSkeletonGate(() => false)
    expect(showSkeleton.value).toBe(false)
    expect(fadeClass.value).toBe('')
  })

  it('holds the skeleton for at least MIN_SKELETON_MS, then fades content in', async () => {
    const loading = ref(true)
    const { showSkeleton, fadeClass } = useSkeletonGate(() => loading.value)
    vi.advanceTimersByTime(50)
    loading.value = false
    await nextTick()
    expect(showSkeleton.value).toBe(true)
    vi.advanceTimersByTime(MIN_SKELETON_MS - 51)
    expect(showSkeleton.value).toBe(true)
    vi.advanceTimersByTime(1)
    expect(showSkeleton.value).toBe(false)
    expect(fadeClass.value).toBe('tidy-fade-in')
  })

  it('hides at once when the skeleton has already been up long enough', async () => {
    const loading = ref(true)
    const { showSkeleton } = useSkeletonGate(() => loading.value)
    vi.advanceTimersByTime(MIN_SKELETON_MS + 100)
    loading.value = false
    await nextTick()
    expect(showSkeleton.value).toBe(false)
  })

  it('stays up if loading starts again during the minimum', async () => {
    const loading = ref(true)
    const { showSkeleton } = useSkeletonGate(() => loading.value)
    loading.value = false
    await nextTick()
    loading.value = true
    await nextTick()
    vi.advanceTimersByTime(MIN_SKELETON_MS * 2)
    expect(showSkeleton.value).toBe(true)
  })

  it('shows again when a later load starts', async () => {
    const loading = ref(false)
    const { showSkeleton } = useSkeletonGate(() => loading.value)
    loading.value = true
    await nextTick()
    expect(showSkeleton.value).toBe(true)
  })
})
