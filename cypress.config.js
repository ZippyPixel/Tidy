const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    // nuxt dev and nuxt preview both serve on 3000
    baseUrl: 'http://localhost:3000'
  }
})
