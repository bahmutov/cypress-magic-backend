const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    env: {
      magicBackend: {
        // API endpoints to intercept using an array definition
        apiCallsToIntercept: [
          { method: 'GET', pathname: '/todos' },
          { method: 'POST', pathname: '/todos' },
          { method: 'DELETE', pathname: '/todos/*' },
        ],
      },
    },
    baseUrl: 'http://localhost:3000',
    video: true,
  },
})
