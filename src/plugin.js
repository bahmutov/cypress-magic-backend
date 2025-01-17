/// <reference path="./index.d.ts" />

const label = 'cypress-magic-backend'

/**
 * @param {MagicBackend.TestApiRecordData} data
 */
function saveRemoteData(data) {
  // send data to the remote server
  // using apiKey
  console.log(
    '%s: saving recorded data for spec "%s" test "%s"',
    label,
    data.specName,
    data.testName,
  )
  return data
}

/**
 * Finds recorded API calls for the current spec / test.
 * @param {MagicBackend.LoadRecord} searchInfo
 */
function loadRemoteData(searchInfo) {
  console.log(
    '%s: loading recorded data for spec "%s" test "%s"',
    label,
    searchInfo.specName,
    searchInfo.testName,
  )
  return null
}

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
      'magic-backend:store': saveRemoteData,
      'magic-backend:load': loadRemoteData,
    })
    // IMPORTANT: the user should return the config object
    // from their setupNodeEvents function
  }
}

module.exports = registerMagicBackend
