/// <reference path="./index.d.ts" />
// @ts-check

const { request } = require('undici')
const debug = require('debug')('cypress-magic-backend')

const label = 'cypress-magic-backend'
// local testing
// const magicBackendAtUrl = 'http://localhost:3600/api/magic-backend'
// production remote
const magicBackendAtUrl = 'https://cypress.tips/api/magic-backend'

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
  const testState = data.testState || 'passed'

  // send data to the remote server
  // using apiKey
  console.log(
    '%s: saving recorded data for spec "%s" test "%s" that "%s"',
    label,
    data.specName,
    data.testName,
    testState,
  )

  const apiKey = getApiKey()
  const url = `${magicBackendAtUrl}/records`
  debug('saving the recording to %s', url)

  const body = {
    specName: data.specName,
    testTitle: data.testName,
    apiCalls: data.apiCallsInThisTest,
    testState,
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
  console.log(
    '%s: %d API call(s) saved',
    label,
    data.apiCallsInThisTest?.length,
  )

  return null
}

/**
 * Finds recorded API calls for the current spec / test.
 * @param {MagicBackend.LoadRecordFindInfo} searchInfo
 * @returns {Promise<MagicBackend.TestApiRecordData|MagicBackend.TestApiRecordData[]|null>}
 */
async function loadRemoteData(searchInfo) {
  console.log(
    '%s: loading recorded data for spec "%s" test "%s" all records? %s',
    label,
    searchInfo.specName,
    searchInfo.testName,
    searchInfo.allRecords,
  )

  const apiKey = getApiKey()
  let url = `${magicBackendAtUrl}/records`
  if (searchInfo.allRecords) {
    url += '?all=true'
  }

  const requestBody = {
    specName: searchInfo.specName,
    testTitle: searchInfo.testName,
  }

  const { statusCode, body } = await request(url, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'x-magic-backend-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
  })
  if (statusCode !== 200) {
    // no big deal, just return null
    return null
  }
  if (searchInfo.allRecords) {
    // TODO: specify type for json object
    const recordings = await body.json()
    if (!recordings.length) {
      console.log(
        '%s: could not find any previous API recordings',
        label,
      )
      return null
    }

    console.log(
      '%s: %d API recordings found',
      label,
      recordings.length,
    )
    const results = recordings.map((json) => {
      // console.log(json)
      return {
        pluginName: json.meta.plugin,
        pluginVersion: json.meta.version,
        specName: searchInfo.specName,
        testName: searchInfo.testName,
        apiCallsInThisTest: json.apiCalls,
        testState: json.testState,
      }
    })
    return results
  } else {
    // a single test recording
    // TODO: specify type for json object
    const json = await body.json()
    console.log(
      '%s: %d API calls loaded',
      label,
      json.apiCalls.length,
    )
    const result = {
      pluginName: json.meta.pluginName,
      pluginVersion: json.meta.pluginVersion,
      specName: json.specName,
      testName: json.testTitle,
      apiCallsInThisTest: json.apiCalls,
    }
    return result
  }
}

/**
 * Normalizes the config object to ensure that the magicBackend config
 * is what the user wants it to be.
 * 1. if the env object includes both magicBackend and magicBackendAdd
 * then the result is the original config with the magicBackendAdd spread
 */
function addAnyConfigs(config) {
  const { magicBackend, magicBackendAdd } = config.env
  debug('magic backend config %o', magicBackend)
  debug('magic backend config add %o', magicBackendAdd)
  if (!magicBackend) {
    if (magicBackendAdd) {
      config.env.magicBackend = magicBackendAdd
      return
    }
  }
  if (magicBackend && magicBackendAdd) {
    debug('spreading the additional options')
    config.env.magicBackend = {
      ...magicBackend,
      ...magicBackendAdd,
    }
  }
}

function printTextToTerminal(text) {
  console.log(text)
  // Cypress tasks must return some value (including null)
  // to signal that there is no subject to yield
  return null
}

/**
 * Finds recorded API calls for the current spec / test.
 * @param {MagicBackend.SaveVisitedUrlsOptions} saveUrlOptions
 */
async function saveVisitedUrls(saveUrlOptions) {
  const { specName, testName, urls, pluginName, pluginVersion } =
    saveUrlOptions

  debug(
    'magic backend, saving %d visited urls for %s %s',
    urls.length,
    specName,
    testName,
  )

  const apiKey = getApiKey()
  const url = `${magicBackendAtUrl}/visited-urls`

  const body = {
    specName,
    testTitle: testName,
    urls,
    meta: {
      plugin: pluginName,
      version: pluginVersion,
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
      `${label}: Could not save visited urls, status code ${statusCode}`,
    )
  }
  console.log('%s: %d visited urls saved', label, urls.length)

  return null
}

function registerMagicBackend(on, config) {
  addAnyConfigs(config)
  const { magicBackend } = config.env

  if (!magicBackend) {
    return
  }

  debug('final plugin options %o', magicBackend)

  // common tasks
  on('task', {
    'magic-backend:terminal': printTextToTerminal,
  })

  if (magicBackend.store === 'remote') {
    getApiKey()

    config.env['magic-backend-remote-registered'] = true
    on('task', {
      'magic-backend:store': saveRemoteData,
      'magic-backend:load': loadRemoteData,
      'magic-backend:save-visited-urls': saveVisitedUrls,
    })
    // IMPORTANT: the user should return the config object
    // from their setupNodeEvents function
  }
}

module.exports = registerMagicBackend
