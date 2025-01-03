/// <reference types="cypress" />
// @ts-check

const label = 'cypress-magic-backend'
// Cypress.env('magic_backend_mode', 'recording')
// Cypress.env('magic_backend_mode', 'playback')

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
      Cypress.env('magic_backend_mode', 'recording')
      break
    case 'play':
    case 'playback':
      Cypress.env('magic_backend_mode', 'playback')
      break
  }
}

const apiCallsInThisTest = []

before(() => {
  const doc = window.top?.document
  let $recordButton = Cypress.$('#record-api-calls', doc)

  const restartTests = () => {
    const $restartButton = Cypress.$('button.restart', doc)
    if (!$restartButton.length) {
      throw new Error('Missing the test restart button')
    }
    $restartButton.trigger('click')
  }

  const onClickRecordButton = () => {
    console.log('running the tests and recording the API calls')
    console.log('window.top', window.top)
    if (window.top) {
      window.top.magicBackendModeOverride = 'recording'
      console.log('set the recording mode')
    }
    restartTests()
  }

  if ($recordButton.length) {
    $recordButton.on('click', onClickRecordButton)
    return
  }

  const styles = 'border: 1px solid #2e3247; border-radius: 4px;'

  $recordButton = Cypress.$(
    `<span style="${styles}"><button aria-label="Record API calls" title="Record API calls" id="record-api-calls">🎥 Record</button></span>`,
  )
  $recordButton.on('click', onClickRecordButton)

  const $replayButton = Cypress.$(
    `<span style="${styles}"><button aria-label="Replay API calls" title="Replay API calls" id="replay-api-calls">🎞️ Replay API</button></span>`,
  )

  const $controls = Cypress.$('.reporter header', doc)
  $controls.append($recordButton).append($replayButton)
})

after(() => {
  window.top.magicBackendModeOverride = null
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
  switch (mode) {
    case 'record':
    case 'recording':
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
      })
      break
    case 'play':
    case 'playback':
      cy.log(`**${label}** Playback mode`)
      const filename = formTestRecordingFilename(
        Cypress.spec,
        Cypress.currentTest,
      )
      // for now assuming the file exists
      cy.readFile(filename).then((apiCalls) => {
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
  const mode = Cypress.env('magic_backend_mode')
  switch (mode) {
    case 'record':
    case 'recording':
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
