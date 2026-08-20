import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { configDefaults, defineConfig } from 'vitest/config'

// Standalone config: Nuxt owns the app build now, so there is no vite.config.js
// to merge from. This only has to be good enough to compile SFCs for jsdom.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  define: {
    // Nuxt replaces these at build time; unit tests always take the browser branch
    'import.meta.client': 'true',
    'import.meta.server': 'false'
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    exclude: [...configDefaults.exclude, 'e2e/*', '.nuxt/**', '.output/**', 'cypress/**'],
    root: fileURLToPath(new URL('./', import.meta.url))
  }
})
