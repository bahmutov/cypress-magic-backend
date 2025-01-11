const { defineConfig } = require('cypress')

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
    },
  },
  e2e: {
    baseUrl: 'http://localhost:3000',
    video: true,
  },
})
