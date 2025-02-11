const { defineConfig } = require('cypress')
const registerMagicBackend = require('./src/plugin')

module.exports = defineConfig({
  defaultBrowser: 'electron',
  e2e: {
    env: {
      /** @type {Partial<MagicBackend.UserConfig>} */
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
        apiCallsToIntercept: [
          { method: '*', pathname: '/todos{/*,}' },
          { method: 'POST', pathname: '/reflect' },
        ],
        // warn about API calls that change their duration
        apiCallDurationDifferenceThreshold: 500,
        // where to store recorded API calls?
        // local: store all API calls locally in JSON files
        // remote: send API calls to a remote server at cypress.tips
        store: 'local',
      },
    },
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
