/// <reference types="cypress" />
// @ts-check

// https://github.com/bahmutov/cypress-cdp
import 'cypress-cdp'

// const { loadRecord, saveRecord } = require('./file-save')
const getSaveLoadFunctions = require('./init-storage')
const { diff } = require('./diff')
const { name, version } = require('../package.json')

const label = 'cypress-magic-backend'
const ModeNames = {
  RECORDING: 'recording',
  PLAYBACK: 'playback',
  PLAYBACK_ONLY: 'playback-only',
  INSPECT: 'inspect',
}
const StorageModeNames = {
  /** @type {MagicBackend.StorageMode} */
  LOCAL: 'local',
  /** @type {MagicBackend.StorageMode} */
  REMOTE: 'remote',
}

/**
 * We want the user to not worry about the exact precise keywords
 * used to set the mode to "recording" or "playback".
 * Thus we allow the user to say the mode to "record" or "play"
 * and simply normalize the mode to "recording" or "playback".
 */
function normalizeBackendMode() {
  let pluginConfig = Cypress.env('magicBackend')
  if (!pluginConfig) {
    pluginConfig = {}
    Cypress.env('magicBackend', pluginConfig)
  }

  const mode =
    pluginConfig?.mode ||
    Cypress.env('magic_backend_mode') ||
    window?.top?.magicBackendModeOverride
  // console.log('**magic_backend_mode**', mode)

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
    case 'playback-only':
      Cypress.env('magic_backend_mode', ModeNames.PLAYBACK_ONLY)
      break
    case 'inspect':
    case 'inspecting':
    case 'observe':
    case 'observing':
      Cypress.env('magic_backend_mode', ModeNames.INSPECT)
      break
  }

  const store = pluginConfig?.store || StorageModeNames.LOCAL
  const validStoreNames = Object.values(StorageModeNames)
  if (!validStoreNames.includes(store)) {
    throw new Error(`${label}: Invalid store "${store}"`)
  }
  pluginConfig.store = store
}

function warnOnRequestDiff(partialUrl, req, apiCall) {
  if (Cypress._.isEqual(req.body, apiCall.request)) {
    // exact match
  } else {
    const requestDiff = diff(apiCall.request, req.body)
    if (requestDiff) {
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

  let $recordModeToggle = Cypress.$('#record-mode-toggle', doc)
  let $replayModeToggle = Cypress.$('#replay-mode-toggle', doc)
  let $inspectModeToggle = Cypress.$('#inspect-mode-toggle', doc)

  const updateToggles = () => {
    const mode = window?.top?.magicBackendLockedMode
    $recordModeToggle.prop('checked', mode === ModeNames.RECORDING)
    $replayModeToggle.prop('checked', mode === ModeNames.PLAYBACK)
    $inspectModeToggle.prop('checked', mode === ModeNames.INSPECT)
  }

  if (window.top) {
    updateToggles()
    const mode = window.top?.magicBackendLockedMode
    if (mode) {
      window.top.magicBackendModeOverride = mode
    }
  }

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
    if (window.top) {
      window.top.magicBackendModeOverride = ModeNames.RECORDING
    }
    restartTests()
  }

  const onClickReplayButton = () => {
    console.log('replaying the API calls')
    if (window.top) {
      window.top.magicBackendModeOverride = ModeNames.PLAYBACK
    }
    restartTests()
  }

  const onClickInspectButton = () => {
    console.log('inspecting the API calls')
    if (window.top) {
      window.top.magicBackendModeOverride = ModeNames.INSPECT
    }
    restartTests()
  }

  const styles = 'border: 1px solid #2e3247; border-radius: 4px;'
  const toggleStyles = 'margin-right: 5px; background-color: #1b1e2e;'
  const $controls = Cypress.$('.reporter header', doc)

  if (!$recordButton.length) {
    $recordButton = Cypress.$(
      `<span style="${styles}">
        <button aria-label="Record API calls" title="${label} Record API calls" id="record-api-calls">🪄 🎥</button>
        <input type="checkbox" title="lock record mode" style="${toggleStyles}" id="record-mode-toggle" />
      </span>`,
    )
    $controls.append($recordButton)
    $recordModeToggle = Cypress.$('#record-mode-toggle', doc)
  }
  if (!$replayButton.length) {
    $replayButton = Cypress.$(
      `<span style="${styles}">
        <button aria-label="Replay API calls" title="${label} Replay API calls"   id="replay-api-calls">🪄 🎞️</button>
        <input type="checkbox" title="lock replay mode" style="${toggleStyles}" id="replay-mode-toggle" />
      </span>`,
    )
    $controls.append($replayButton)
    $replayModeToggle = Cypress.$('#replay-mode-toggle', doc)
  }
  if (!$inspectButton.length) {
    $inspectButton = Cypress.$(
      `<span style="${styles}">
        <button aria-label="Inspect API calls" title="${label} Inspect API calls" id="inspect-api-calls">🪄 🧐</button>
        <input type="checkbox" title="lock inspect mode" style="${toggleStyles}" id="inspect-mode-toggle" />
      </span>`,
    )
    $controls.append($inspectButton)
    $inspectModeToggle = Cypress.$('#inspect-mode-toggle', doc)
  }

  $recordButton.on('click', onClickRecordButton)
  $replayButton.on('click', onClickReplayButton)
  $inspectButton.on('click', onClickInspectButton)

  updateToggles()

  $recordModeToggle.on('click', (e) => {
    e.stopPropagation()
    if (window.top) {
      if (window.top.magicBackendLockedMode === ModeNames.RECORDING) {
        window.top.magicBackendLockedMode = null
      } else {
        window.top.magicBackendLockedMode = ModeNames.RECORDING
      }
    }
    updateToggles()
  })
  $replayModeToggle.on('click', (e) => {
    e.stopPropagation()
    if (window.top) {
      if (window.top.magicBackendLockedMode === ModeNames.PLAYBACK) {
        window.top.magicBackendLockedMode = null
      } else {
        window.top.magicBackendLockedMode = ModeNames.PLAYBACK
      }
    }
    updateToggles()
  })
  $inspectModeToggle.on('click', (e) => {
    e.stopPropagation()
    if (window.top) {
      if (window.top.magicBackendLockedMode === ModeNames.INSPECT) {
        window.top.magicBackendLockedMode = null
      } else {
        window.top.magicBackendLockedMode = ModeNames.INSPECT
      }
    }
    updateToggles()
  })
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
  if (
    Array.isArray(apiCallsToIntercept) &&
    apiCallsToIntercept.length === 0
  ) {
    // do nothing; the user has set an empty array
    return
  }

  const storageMode = pluginConfig.store || StorageModeNames.LOCAL
  const { loadRecord } = getSaveLoadFunctions(storageMode)

  apiCallsInThisTest.length = 0

  const baseUrl = Cypress.config('baseUrl')

  const mode = Cypress.env('magic_backend_mode')
  backendModeInTheCurrentTest = mode

  switch (mode) {
    case ModeNames.RECORDING:
      {
        cy.log(
          `**${label}** Recording mode, storage is ${storageMode}`,
        )

        const recordOne = (interceptDefinition, alias) => {
          cy.intercept(interceptDefinition, (req) => {
            const started = +new Date()
            req.continue((res) => {
              const finished = +new Date()
              const duration = finished - started // ms

              const partialUrl =
                baseUrl && req.url.startsWith(baseUrl)
                  ? req.url.replace(baseUrl, '')
                  : req.url

              apiCallsInThisTest.push({
                method: req.method,
                url: partialUrl,
                request: req.body,
                response: res.body,
                duration,
              })
            })
          }).as(alias)
        }

        if (Array.isArray(apiCallsToIntercept)) {
          apiCallsToIntercept.forEach(
            (interceptDefinition, index) => {
              recordOne(interceptDefinition, `🪄 🎥 ${index + 1}`)
            },
          )
        } else {
          recordOne(apiCallsToIntercept, '🪄 🎥')
        }
      }

      break
    case ModeNames.PLAYBACK:
      {
        cy.log(`**${label}** Playback mode from ${storageMode}`)
        loadRecord(Cypress.spec, Cypress.currentTest).then(
          (loaded) => {
            if (Array.isArray(loaded)) {
              // for now, take the last successful test recording
              loaded = loaded.findLast(
                (record) => record.testState === 'passed',
              )
            }

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

            const interceptOne = (interceptDefinition, alias) => {
              cy.intercept(interceptDefinition, (req) => {
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

                const partialUrl =
                  baseUrl && req.url.startsWith(baseUrl)
                    ? req.url.replace(baseUrl, '')
                    : req.url
                if (partialUrl !== apiCall.url) {
                  throw new Error(
                    `Inspect: expected URL ${apiCall.url} but got ${partialUrl}`,
                  )
                }

                warnOnRequestDiff(partialUrl, req, apiCall)
                req.reply(apiCall.response)
              }).as(alias)
            }

            if (Array.isArray(apiCallsToIntercept)) {
              apiCallsToIntercept.forEach(
                (interceptDefinition, index) => {
                  interceptOne(
                    interceptDefinition,
                    `🪄 🎞️ ${index + 1}`,
                  )
                },
              )
            } else {
              interceptOne(apiCallsToIntercept, '🪄 🎞️')
            }
          },
        )
      }
      break
    case ModeNames.PLAYBACK_ONLY:
      {
        cy.log(`**${label}** Playback only mode from ${storageMode}`)
        loadRecord(Cypress.spec, Cypress.currentTest).then(
          (loaded) => {
            if (!loaded) {
              cy.log(
                `**${label}** ⚠️ No recorded API calls found for this test`,
              )
              // we still allow running the test
              // but it will fail if even a single API call is made
              const fullTitle =
                Cypress.currentTest.titlePath.join(' / ')

              const blockOneIntercept = (interceptDefinition) => {
                cy.intercept(interceptDefinition, (req) => {
                  throw new Error(
                    `Playback only: intercepted an unexpected API call ${req.method} ${req.url} but test "${fullTitle}" has no recorded API calls`,
                  )
                })
              }

              if (Array.isArray(apiCallsToIntercept)) {
                apiCallsToIntercept.forEach((interceptDefinition) => {
                  blockOneIntercept(interceptDefinition)
                })
              } else {
                blockOneIntercept(apiCallsToIntercept)
              }
            } else {
              const apiCalls = loaded.apiCallsInThisTest

              let apiCallIndex = 0

              const playBackOne = (interceptDefinition, alias) => {
                cy.intercept(interceptDefinition, (req) => {
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

                  const partialUrl =
                    baseUrl && req.url.startsWith(baseUrl)
                      ? req.url.replace(baseUrl, '')
                      : req.url
                  if (partialUrl !== apiCall.url) {
                    throw new Error(
                      `Inspect: expected URL ${apiCall.url} but got ${partialUrl}`,
                    )
                  }

                  warnOnRequestDiff(partialUrl, req, apiCall)
                  req.reply(apiCall.response)
                }).as(alias)
              }

              if (Array.isArray(apiCallsToIntercept)) {
                apiCallsToIntercept.forEach(
                  (interceptDefinition, index) => {
                    playBackOne(
                      interceptDefinition,
                      `🪄 🎞️ only ${index + 1}`,
                    )
                  },
                )
              } else {
                playBackOne(apiCallsToIntercept, '🪄 🎞️ only')
              }
            }
          },
        )
      }
      break
    case ModeNames.INSPECT:
      {
        cy.log(`**${label}** Inspect mode from ${storageMode}`)
        const magicBackend = Cypress.env('magicBackend') || {}
        const apiCallDurationDifferenceThreshold =
          magicBackend.apiCallDurationDifferenceThreshold || 500 // ms
        loadRecord(Cypress.spec, Cypress.currentTest).then(
          (loaded) => {
            if (!loaded) {
              cy.log(
                `**${label}** No recorded API calls found for this test`,
              )
              cy.log(`**${label}** Running normal test`)
              // remove the mode so we do not intercept any calls
              Cypress.env('magic_backend_mode', undefined)
              return
            }
            if (Array.isArray(loaded)) {
              // for now take the last passing test result
              loaded = loaded.findLast(
                (record) => record.testState === 'passed',
              )
            }

            const apiCalls = loaded.apiCallsInThisTest

            let apiCallIndex = 0

            const inspectOne = (interceptDefinition, alias) => {
              cy.intercept(interceptDefinition, (req) => {
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

                const partialUrl =
                  baseUrl && req.url.startsWith(baseUrl)
                    ? req.url.replace(baseUrl, '')
                    : req.url

                // we might have unique parts in the URLs
                // if (partialUrl !== apiCall.url) {
                //   throw new Error(
                //     `Expected URL ${apiCall.url} but got ${req.url}`,
                //   )
                // }
                const started = +new Date()
                warnOnRequestDiff(partialUrl, req, apiCall)

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
                    const name =
                      apiCall.duration > duration ? '🏎️' : '🚨 🐢'
                    const durationLabel =
                      apiCall.duration > duration
                        ? 'faster'
                        : 'slower'
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
                  const responseDiff = diff(
                    apiCall.response,
                    res.body,
                  )
                  if (responseDiff) {
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
              }).as(alias)
            }

            if (Array.isArray(apiCallsToIntercept)) {
              apiCallsToIntercept.forEach(
                (interceptDefinition, index) => {
                  inspectOne(
                    interceptDefinition,
                    `🪄 🧐 ${index + 1}`,
                  )
                },
              )
            } else {
              inspectOne(apiCallsToIntercept, '🪄 🧐')
            }
          },
        )
      }
      break
  }
})

// use the function callback syntax
// so we can get the current test's state (passed / failed)
afterEach(function () {
  // restore the original mode, just in case we had to change it
  // for a particular test
  Cypress.env('magic_backend_mode', backendModeInTheCurrentTest)

  const pluginConfig = Cypress.env('magicBackend')
  // console.log(pluginConfig)
  const storageMode = pluginConfig.store || StorageModeNames.LOCAL
  const { saveRecord } = getSaveLoadFunctions(storageMode)

  switch (backendModeInTheCurrentTest) {
    case ModeNames.RECORDING:
      const state = this.currentTest?.state
      // should we always record... Not sure yet
      if (state === 'passed') {
        const specName = Cypress.spec.relative
        const title = Cypress.currentTest.titlePath.join('_')
        if (apiCallsInThisTest.length === 0) {
          cy.log(`Zero API calls for ${specName} test "${title}"`)
        } else {
          cy.log(
            `Recording ${apiCallsInThisTest.length} API calls to ${storageMode} storage for ${specName} test "${title}"`,
          )
          saveRecord(
            Cypress.spec,
            Cypress.currentTest,
            name,
            version,
            apiCallsInThisTest,
          )
        }
      }
      break
    case ModeNames.INSPECT:
      if (storageMode === StorageModeNames.REMOTE) {
        // save the recording, even if the test failed
        const state = this.currentTest?.state
        if (state === 'passed' || state === 'failed') {
          const specName = Cypress.spec.relative
          const title = Cypress.currentTest.titlePath.join('_')
          if (apiCallsInThisTest.length === 0) {
            cy.log(`Zero API calls for ${specName} test "${title}"`)
          } else {
            cy.log(
              `Saving ${apiCallsInThisTest.length} API calls to ${storageMode} storage for ${specName} test "${title}" that ${state}`,
            )
            saveRecord(
              Cypress.spec,
              Cypress.currentTest,
              name,
              version,
              apiCallsInThisTest,
              state,
            )
          }
        }
      }
      break
    // for the playback mode we could check that all API calls were used
  }
})
