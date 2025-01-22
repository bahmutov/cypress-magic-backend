/// <reference path="./index.d.ts" />

const { request } = require('undici')

const label = 'cypress-magic-backend'
// const magicBackendAtUrl = 'https://cypress.tips/api/magic-backend'
const magicBackendAtUrl = 'http://localhost:3600/api/magic-backend'

function getApiKey() {
  const apiKey = process.env.MAGIC_BACKEND_API_KEY
  if (!apiKey) {
    const message = [
      'cypress-magic-backend plugin: you set the store option to "remote",',
      'but are missing the MAGIC_BACKEND_API_KEY environment variable',
    ].join('\n')
    throw new Error(message)
  }
  return apiKey
}

/**
 * @param {MagicBackend.TestApiRecordData} data
 */
async function saveRemoteData(data) {
  // send data to the remote server
  // using apiKey
  console.log(
    '%s: saving recorded data for spec "%s" test "%s"',
    label,
    data.specName,
    data.testName,
  )

  const apiKey = getApiKey()
  const url = `${magicBackendAtUrl}/records`

  const body = {
    specName: data.specName,
    testTitle: data.testName,
    apiCalls: data.apiCallsInThisTest,
    meta: {
      plugin: data.pluginName,
      version: data.pluginVersion,
      date: new Date().toISOString(),
    },
  }

  const { statusCode } = await request(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-magic-backend-api-key': apiKey,
    },
    body: JSON.stringify(body),
  })
  if (statusCode !== 201) {
    throw new Error(
      `${label}: Could not save data, status code ${statusCode}`,
    )
  }
  console.log('%s: API calls saved', label)

  return null
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
    getApiKey()

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
