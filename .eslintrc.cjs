/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  ignorePatterns: ['.nuxt/', '.output/', 'dist/', 'node_modules/'],
  overrides: [
    {
      files: ['cypress/e2e/**/*.{cy,spec}.{js,ts,jsx,tsx}'],
      extends: ['plugin:cypress/recommended']
    },
    {
      files: ['src/components/ui/**/*.vue'],
      rules: {
        'vue/multi-word-component-names': 'off'
      }
    },
    {
      // Nitro auto-imports h3 helpers and everything in server/utils
      files: ['server/**/*.js'],
      globals: {
        defineEventHandler: 'readonly',
        getQuery: 'readonly',
        createError: 'readonly',
        useRuntimeConfig: 'readonly',
        FORECAST_DAYS: 'readonly',
        weatherApiBase: 'readonly',
        weatherApiKey: 'readonly',
        rethrowUpstream: 'readonly'
      }
    }
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  env: {
    node: true,
    es2022: true
  },
  globals: {
    // Nuxt auto-imports these into app code
    defineNuxtConfig: 'readonly',
    defineNuxtPlugin: 'readonly',
    useCookie: 'readonly',
    useHead: 'readonly',
    useRuntimeConfig: 'readonly',
    useNuxtApp: 'readonly',
    $fetch: 'readonly'
  }
}
