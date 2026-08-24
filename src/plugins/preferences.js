import { computed } from 'vue'
import { createI18nInstance, setActiveI18n, resolveLocale, LOCALE_COOKIE_KEY } from '@/i18n'
import { THEME_COOKIE_KEY } from '@/utils/preferences'
import useThemeStore from '@/stores/theme'
import useLocaleStore from '@/stores/locale'

// Runs on both server and client before the app renders, so the very first paint
// already has the right language and theme. Replaces the localStorage reads that
// used to happen in app.vue's mounted() hook.
export default defineNuxtPlugin((nuxtApp) => {
  const themeCookie = useCookie(THEME_COOKIE_KEY)
  const localeCookie = useCookie(LOCALE_COOKIE_KEY)

  // a fresh vue-i18n instance per request keeps SSR from sharing locale state
  const locale = resolveLocale(localeCookie.value)
  const i18n = createI18nInstance(locale)
  setActiveI18n(i18n)
  nuxtApp.vueApp.use(i18n)

  // pass $pinia explicitly: plugin order relative to @pinia/nuxt is not guaranteed
  const localeStore = useLocaleStore(nuxtApp.$pinia)
  const themeStore = useThemeStore(nuxtApp.$pinia)

  localeStore.setInitialLocale(locale)

  if (themeCookie.value === 'dark' || themeCookie.value === 'light') {
    themeStore.setInitialTheme(themeCookie.value === 'dark')
  } else if (import.meta.client) {
    // no stored preference: fall back to the OS setting, matching the inline
    // no-flash script in nuxt.config.js
    themeStore.setInitialTheme(window.matchMedia('(prefers-color-scheme: dark)').matches)
  }

  // drives <html class="dark"> and <html lang>, on the server and reactively after
  useHead({
    htmlAttrs: {
      lang: computed(() => localeStore.locale),
      class: computed(() => (themeStore.isDark ? 'dark' : ''))
    }
  })
})
