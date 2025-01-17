const label = 'cypress-magic-backend'

function registerMagicBackend(on, config) {
  const { magicBackend } = config.env
  if (!magicBackend) {
    return
  }

  if (magicBackend.store === 'remote') {
    const apiKey = process.env.MAGIC_BACKEND_API_KEY
    if (!apiKey) {
      const message = [
        'cypress-magic-backend plugin: you set the store option to "remote",',
        'but are missing the MAGIC_BACKEND_API_KEY environment variable',
      ].join('\n')
      throw new Error(message)
    }
    config.env['magic-backend-remote-registered'] = true
    on('task', {
      'magic-backend:store': (data) => {
        // send data to the remote server
        // using apiKey
        console.log('%s: saving recorded data')
        return data
      },
      'magic-backend:load': () => {
        // load data from the remote server
        // using apiKey
        console.log('%s: loading recorded data')
        return {}
      },
    })
    // IMPORTANT: the user should return the config object
    // from their setupNodeEvents function
  }
}

module.exports = registerMagicBackend
