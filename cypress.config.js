const { defineConfig } = require('cypress')
const registerMagicBackend = require('./src/plugin')

module.exports = defineConfig({
  env: {
    magicBackend: {
      // null - do not intercept any API calls
      // recording - record all API calls, see "apiCallsToIntercept" setting
      // playback - mock all API calls using previously recorded JSON fixtures
      // inspect - magic 🪄
      mode: null,
      // which calls to intercept?, for example
      // to intercept all XHR calls
      // { method: '*', resourceType: 'xhr'}
      // a single object definition
      apiCallsToIntercept: { method: '*', pathname: '/todos{/*,}' },
      apiCallDurationDifferenceThreshold: 500,
    },
  },
  e2e: {
    baseUrl: 'http://localhost:3000',
    video: true,
    setupNodeEvents(on, config) {
      registerMagicBackend(on, config)
      // IMPORTANT: return the config object
      // because it might be modified by the plugin function
      return config
    },
  },
})
