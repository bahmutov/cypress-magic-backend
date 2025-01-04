/// <reference types="cypress" />
// @ts-check

const label = 'cypress-magic-backend'
const ModeNames = {
  RECORDING: 'recording',
  PLAYBACK: 'playback',
  INSPECT: 'inspect',
}

/**
 * We want the user to not worry about the exact precise keywords
 * used to set the mode to "recording" or "playback".
 * Thus we allow the user to say the mode to "record" or "play"
 * and simply normalize the mode to "recording" or "playback".
 */
function normalizeBackendMode() {
  const mode =
    Cypress.env('magic_backend_mode') ||
    window?.top?.magicBackendModeOverride
  console.log('**magic_backend_mode**', mode)
  switch (mode) {
    case 'record':
    case 'recording':
      Cypress.env('magic_backend_mode', ModeNames.RECORDING)
      break
    case 'play':
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
      `<span style="${styles}"><button aria-label="Record API calls" title="Record API calls" id="record-api-calls">🪄 🎥</button></span>`,
    )
    $controls.append($recordButton)
  }
  if (!$replayButton.length) {
    $replayButton = Cypress.$(
      `<span style="${styles}"><button aria-label="Replay API calls" title="Replay API calls" id="replay-api-calls">🪄 🎞️</button></span>`,
    )
    $controls.append($replayButton)
  }
  if (!$inspectButton.length) {
    $inspectButton = Cypress.$(
      `<span style="${styles}"><button aria-label="Inspect API calls" title="Inspect API calls" id="inspect-api-calls">🪄 🧐</button></span>`,
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
  normalizeBackendMode()

  // which calls to intercept?
  const apiCallsToIntercept = {
    method: '*',
    resourceType: 'xhr',
  }

  apiCallsInThisTest.length = 0

  const mode = Cypress.env('magic_backend_mode')
  backendModeInTheCurrentTest = mode

  switch (mode) {
    case ModeNames.RECORDING:
      cy.log(`**${label}** Recording mode`)
      cy.intercept(apiCallsToIntercept, (req) => {
        req.continue((res) => {
          apiCallsInThisTest.push({
            method: req.method,
            url: req.url,
            request: req.body,
            response: res.body,
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
          .then((apiCalls) => {
            if (!apiCalls) {
              cy.log(
                `**${label}** No recorded API calls found for this test`,
              )
              cy.log(`**${label}** Running normal test`)
              // remove the mode so we do not intercept any calls
              Cypress.env('magic_backend_mode', undefined)
              return
            }

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
          .then((apiCalls) => {
            if (!apiCalls) {
              cy.log(
                `**${label}** No recorded API calls found for this test`,
              )
              cy.log(`**${label}** Running normal test`)
              // remove the mode so we do not intercept any calls
              Cypress.env('magic_backend_mode', undefined)
              return
            }

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
              if (req.body === apiCall.request) {
              } else {
                // todo: inspect the sent request
                // and intelligently report differences
                // in values vs types
                console.log('app sending request')
                console.log(req.body)
                console.log('previously recorded request body')
                console.log(apiCall.request)
              }

              req.continue((res) => {
                // todo: inspect the response
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
      cy.writeFile(filename, apiCallsInThisTest)
      break
    // for the playback mode we could check that all API calls were used
  }
})
