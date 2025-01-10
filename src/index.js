/// <reference types="cypress" />
// @ts-check

// https://github.com/bahmutov/cypress-cdp
import 'cypress-cdp'

const { diff } = require('./diff')
const { name, version } = require('../package.json')

const label = 'cypress-magic-backend'
const ModeNames = {
  RECORDING: 'recording',
  PLAYBACK: 'playback',
  INSPECT: 'inspect',
}

// todo: could be the user config value
const apiCallDurationDifferenceThreshold = 500 // ms

/**
 * We want the user to not worry about the exact precise keywords
 * used to set the mode to "recording" or "playback".
 * Thus we allow the user to say the mode to "record" or "play"
 * and simply normalize the mode to "recording" or "playback".
 */
function normalizeBackendMode() {
  const pluginConfig = Cypress.env('magicBackend')
  const mode =
    pluginConfig?.mode ||
    Cypress.env('magic_backend_mode') ||
    window?.top?.magicBackendModeOverride
  console.log('**magic_backend_mode**', mode)

  switch (mode) {
    case 'record':
    case 'recording':
      Cypress.env('magic_backend_mode', ModeNames.RECORDING)
      break
    case 'play':
    case 'replay':
    case 'playback':
      Cypress.env('magic_backend_mode', ModeNames.PLAYBACK)
      break
    case 'inspect':
    case 'inspecting':
    case 'observe':
    case 'observing':
      Cypress.env('magic_backend_mode', ModeNames.INSPECT)
      break
  }
}

const apiCallsInThisTest = []
let backendModeInTheCurrentTest = null

//
// start of plugin's hooks
//

beforeEach(() => {
  normalizeBackendMode()
  // TODO: check if we cannot do a mode for some reason
  // and set the mode to null
})

beforeEach(() => {
  const mode = Cypress.env('magic_backend_mode')
  if (mode === ModeNames.RECORDING || mode === ModeNames.INSPECT) {
    // use the cy.CDP command to disable the network caching
    // https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-setCacheDisabled
    cy.CDP('Network.setCacheDisabled', {
      cacheDisabled: true,
    })
  }
})

before(() => {
  const doc = window.top?.document
  let $recordButton = Cypress.$('#record-api-calls', doc)
  let $replayButton = Cypress.$('#replay-api-calls', doc)
  let $inspectButton = Cypress.$('#inspect-api-calls', doc)

  const restartTests = () => {
    let $restartButton = Cypress.$('button.restart', doc)
    if (!$restartButton.length) {
      // the tests might be running already, stop them first
      const $stopButton = Cypress.$('button.stop', doc)
      $stopButton.trigger('click')
      $restartButton = Cypress.$('button.restart', doc)
    }
    if (!$restartButton.length) {
      throw new Error('Missing the test restart button')
    }
    $restartButton.trigger('click')
  }

  const onClickRecordButton = () => {
    console.log('running the tests and recording the API calls')
    if (window.top) {
      window.top.magicBackendModeOverride = 'recording'
    }
    restartTests()
  }

  const onClickReplayButton = () => {
    console.log('replaying the API calls')
    if (window.top) {
      window.top.magicBackendModeOverride = 'playback'
    }
    restartTests()
  }

  const onClickInspectButton = () => {
    console.log('inspecting the API calls')
    if (window.top) {
      window.top.magicBackendModeOverride = 'inspect'
    }
    restartTests()
  }

  const styles = 'border: 1px solid #2e3247; border-radius: 4px;'
  const $controls = Cypress.$('.reporter header', doc)

  if (!$recordButton.length) {
    $recordButton = Cypress.$(
      `<span style="${styles}"><button aria-label="Record API calls" title="${label} Record API calls" id="record-api-calls">🪄 🎥</button></span>`,
    )
    $controls.append($recordButton)
  }
  if (!$replayButton.length) {
    $replayButton = Cypress.$(
      `<span style="${styles}"><button aria-label="Replay API calls" title="${label} Replay API calls" id="replay-api-calls">🪄 🎞️</button></span>`,
    )
    $controls.append($replayButton)
  }
  if (!$inspectButton.length) {
    $inspectButton = Cypress.$(
      `<span style="${styles}"><button aria-label="Inspect API calls" title="${label} Inspect API calls" id="inspect-api-calls">🪄 🧐</button></span>`,
    )
    $controls.append($inspectButton)
  }

  $recordButton.on('click', onClickRecordButton)
  $replayButton.on('click', onClickReplayButton)
  $inspectButton.on('click', onClickInspectButton)
})

after(() => {
  window.top.magicBackendModeOverride = null
  backendModeInTheCurrentTest = null
})

beforeEach(() => {
  // which calls to intercept?
  const pluginConfig = Cypress.env('magicBackend')
  const apiCallsToIntercept = pluginConfig?.apiCallsToIntercept

  if (!apiCallsToIntercept) {
    // do nothing; the user has not set any API calls to intercept
    return
  }

  apiCallsInThisTest.length = 0

  const mode = Cypress.env('magic_backend_mode')
  backendModeInTheCurrentTest = mode

  switch (mode) {
    case ModeNames.RECORDING:
      cy.log(`**${label}** Recording mode`)
      cy.intercept(apiCallsToIntercept, (req) => {
        const started = +new Date()
        req.continue((res) => {
          const finished = +new Date()
          const duration = finished - started // ms
          apiCallsInThisTest.push({
            method: req.method,
            url: req.url,
            request: req.body,
            response: res.body,
            duration,
          })
        })
      }).as('🪄 🎥')
      break
    case ModeNames.PLAYBACK:
      {
        cy.log(`**${label}** Playback mode`)
        const filename = formTestRecordingFilename(
          Cypress.spec,
          Cypress.currentTest,
        )
        // for now assuming the file exists
        cy.readFile(filename)
          .should(Cypress._.noop)
          .then((loaded) => {
            if (!loaded) {
              cy.log(
                `**${label}** No recorded API calls found for this test`,
              )
              cy.log(`**${label}** Running normal test`)
              // remove the mode so we do not intercept any calls
              Cypress.env('magic_backend_mode', undefined)
              return
            }
            const apiCalls = loaded.apiCallsInThisTest

            let apiCallIndex = 0
            cy.intercept(apiCallsToIntercept, (req) => {
              const apiCall = apiCalls[apiCallIndex]
              if (!apiCall) {
                throw new Error(
                  `Ran out of recorded API calls at index ${apiCallIndex}`,
                )
              }
              apiCallIndex += 1
              if (req.method !== apiCall.method) {
                throw new Error(
                  `Expected method ${apiCall.method} but got ${req.method}`,
                )
              }
              if (req.url !== apiCall.url) {
                throw new Error(
                  `Expected URL ${apiCall.url} but got ${req.url}`,
                )
              }
              // todo: check the request body
              req.reply(apiCall.response)
            })
          })
          .as('🪄 🎞️')
      }
      break
    case ModeNames.INSPECT:
      {
        cy.log(`**${label}** Inspect mode`)
        const filename = formTestRecordingFilename(
          Cypress.spec,
          Cypress.currentTest,
        )
        // for now assuming the file exists
        cy.readFile(filename)
          .should(Cypress._.noop)
          .then((loaded) => {
            if (!loaded) {
              cy.log(
                `**${label}** No recorded API calls found for this test`,
              )
              cy.log(`**${label}** Running normal test`)
              // remove the mode so we do not intercept any calls
              Cypress.env('magic_backend_mode', undefined)
              return
            }
            const apiCalls = loaded.apiCallsInThisTest

            let apiCallIndex = 0
            cy.intercept(apiCallsToIntercept, (req) => {
              const apiCall = apiCalls[apiCallIndex]
              if (!apiCall) {
                throw new Error(
                  `Ran out of recorded API calls at index ${apiCallIndex}`,
                )
              }
              apiCallIndex += 1
              if (req.method !== apiCall.method) {
                throw new Error(
                  `Expected method ${apiCall.method} but got ${req.method}`,
                )
              }
              // we might have unique parts in the URLs
              // if (req.url !== apiCall.url) {
              //   throw new Error(
              //     `Expected URL ${apiCall.url} but got ${req.url}`,
              //   )
              // }
              const started = +new Date()
              if (req.body === apiCall.request) {
              } else {
                const requestDiff = diff(apiCall.request, req.body)
                if (requestDiff) {
                  const baseUrl = Cypress.config('baseUrl')
                  const partialUrl = baseUrl
                    ? req.url.replace(baseUrl, '')
                    : req.url
                  console.warn(
                    `${label} request "${req.method} ${partialUrl}" ${requestDiff}`,
                  )
                  console.warn('recorded request body')
                  console.warn(apiCall.request)
                  console.warn('current request body')
                  console.warn(req.body)

                  // report the difference in the Command Log
                  Cypress.log({
                    name: '🔺',
                    message: `${req.method} ${partialUrl} ${requestDiff}`,
                    type: 'parent',
                    consoleProps() {
                      return {
                        plugin: label,
                        call: `${req.method} ${partialUrl} request body`,
                        recorded: apiCall.request,
                        request: req.body,
                        diff: requestDiff,
                      }
                    },
                  })
                }
              }

              req.continue((res) => {
                const finished = +new Date()
                const duration = finished - started // ms
                // console.log({
                //   call: `${req.method} ${req.url}`,
                //   recordedDuration: apiCall.duration,
                //   currentDuration: duration,
                // })
                if (
                  Math.abs(duration - apiCall.duration) >
                  apiCallDurationDifferenceThreshold
                ) {
                  // report the difference in the Command Log
                  const baseUrl = Cypress.config('baseUrl')
                  const partialUrl = baseUrl
                    ? req.url.replace(baseUrl, '')
                    : req.url

                  const name =
                    apiCall.duration > duration ? '🏎️' : '🚨 🐢'
                  const durationLabel =
                    apiCall.duration > duration ? 'faster' : 'slower'
                  Cypress.log({
                    name,
                    message: `${req.method} ${partialUrl} time went from ${apiCall.duration}ms to ${duration}ms`,
                    type: 'parent',
                    consoleProps() {
                      return {
                        plugin: label,
                        call: `${req.method} ${partialUrl} duration became ${durationLabel}`,
                        previously: `${apiCall.duration}ms`,
                        currently: `${duration}ms`,
                        diff: Math.abs(duration - apiCall.duration),
                      }
                    },
                  })
                }

                // todo: inspect the response
                const responseDiff = diff(apiCall.response, res.body)
                if (responseDiff) {
                  const baseUrl = Cypress.config('baseUrl')
                  const partialUrl = baseUrl
                    ? req.url.replace(baseUrl, '')
                    : req.url
                  console.warn(
                    `${label} response "${req.method} ${partialUrl}" ${responseDiff}`,
                  )
                  console.warn('recorded response body')
                  console.warn(apiCall.response)
                  console.warn('current response body')
                  console.warn(res.body)
                  // report the difference in the Command Log
                  Cypress.log({
                    name: '🔻',
                    message: `${req.method} ${partialUrl} ${responseDiff}`,
                    type: 'parent',
                    consoleProps() {
                      return {
                        plugin: label,
                        call: `${req.method} ${partialUrl} response body`,
                        recorded: apiCall.response,
                        response: res.body,
                        diff: responseDiff,
                      }
                    },
                  })
                }
                return res.body
              })
            })
          })
          .as('🪄 🧐')
      }
      break
  }
})

function formTestRecordingFilename(currentSpec, currentTest) {
  const specName = Cypress.spec.relative
  const title = Cypress.currentTest.titlePath
    .join('_')
    .replaceAll(' ', '_')
  return `cypress/magic-backend/${specName}_${title}_api_calls.json`
}

afterEach(() => {
  // restore the original mode, just in case we had to change it
  // for a particular test
  Cypress.env('magic_backend_mode', backendModeInTheCurrentTest)
  switch (backendModeInTheCurrentTest) {
    case ModeNames.RECORDING:
      const specName = Cypress.spec.relative
      const title = Cypress.currentTest.titlePath.join('_')
      cy.log(
        `Recording ${apiCallsInThisTest.length} API calls for ${specName} "${title}"`,
      )
      const filename = formTestRecordingFilename(
        Cypress.spec,
        Cypress.currentTest,
      )
      const data = {
        name,
        version,
        testName: Cypress.currentTest.titlePath.join(' / '),
        apiCallsInThisTest,
      }
      cy.writeFile(filename, data)
      break
    // for the playback mode we could check that all API calls were used
  }
})
