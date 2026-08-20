import { config } from '@vue/test-utils'

// floating-ui (under reka-ui popovers) calls `new ResizeObserver(...)`, so this has
// to be a real constructor — `vi.fn(() => ({...}))` is an arrow function and throws.
// Defined here so it wins over the per-spec `if (!window.ResizeObserver)` guards.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub
}

if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

// Nuxt auto-imports <ClientOnly>; unit tests mount components outside the Nuxt
// runtime, so register a pass-through that just renders the default slot.
config.global.components = {
  ClientOnly: {
    name: 'ClientOnly',
    setup(_props, { slots }) {
      return () => slots.default?.()
    }
  }
}
