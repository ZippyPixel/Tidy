// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-08-18',
  devtools: { enabled: true },

  // app code stays in src/ (Nuxt 4 defaults to app/), so the '@' alias and every
  // existing '@/components/...' import keep resolving exactly as they did under Vite
  srcDir: 'src',

  css: ['~/assets/style.css'],

  modules: ['@pinia/nuxt'],

  // vue-i18n ships the esm-bundler build, which references Vue's compile-time flags
  // (__VUE_PROD_DEVTOOLS__) as bare identifiers and expects the bundler to replace them.
  // Nitro externalises node_modules by default, so on the server that file is loaded
  // as-is and the flag stays undefined. The guard reads
  //   if (process.env.NODE_ENV !== 'production' || __VUE_PROD_DEVTOOLS__)
  // which short-circuits in dev but *evaluates* the identifier once NODE_ENV=production
  // — i.e. on any real deploy — and throws ReferenceError inside `vueApp.use(i18n)`.
  // The plugin then aborts before $t is injected and every template dies with
  // "_ctx.$t is not a function". Transpiling pulls vue-i18n into the bundle so Vite
  // substitutes the flags. This is what @nuxtjs/i18n does; pinia needs no such help
  // because it guards its own flag reads with `typeof`.
  build: { transpile: ['vue-i18n'] },

  // shadcn-vue ships a barrel index.js beside each component, which collides with
  // Nuxt's file-name-derived auto-import names. Everything under ui/ is imported
  // explicitly from those barrels, so keep it out of the scan entirely.
  components: [{ path: '~/components', pathPrefix: false, ignore: ['ui/**'] }],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },

  runtimeConfig: {
    // private: server-only. Filled from NUXT_WEATHER_API_KEY / NUXT_WEATHER_API_BASE at
    // runtime and never serialised into the client bundle — see server/api/*.get.js
    weatherApiKey: '',
    // the default keeps the app working with only a key configured; override per
    // environment to point at a mock or a proxy
    weatherApiBase: 'https://api.weatherapi.com/v1'
  },

  app: {
    head: {
      title: 'Tidy',
      htmlAttrs: { lang: 'en' },
      bodyAttrs: { class: 'bg-gray-100 dark:bg-night-bg dark:text-night-text font-sans' },
      meta: [
        { charset: 'UTF-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700'
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@300;400;500;700&display=swap'
        }
      ],
      script: [
        {
          // Paint the saved theme before first paint. Without this a dark-mode user
          // with no cookie yet gets a light flash, because the server has no way to
          // read prefers-color-scheme. plugins/preferences.js takes over on hydration.
          innerHTML:
            "try{var m=document.cookie.match(/(?:^|; )tidy-theme=(dark|light)/);var d=m?m[1]==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}",
          tagPosition: 'head'
        }
      ]
    }
  }
})
