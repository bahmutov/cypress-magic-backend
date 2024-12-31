/// <reference types="cypress" />
// @ts-check

const label = 'cypress-magic-backend'
// Cypress.env('magic_backend_mode', 'recording')
// Cypress.env('magic_backend_mode', 'playback')

const apiCallsInThisTest = []

beforeEach(() => {
  apiCallsInThisTest.length = 0

  const mode = Cypress.env('magic_backend_mode')
  switch (mode) {
    case 'recording':
      cy.log(`**${label}** Recording mode`)
      cy.intercept(
        {
          method: '*',
          path: '/todos',
        },
        (req) => {
          req.continue((res) => {
            apiCallsInThisTest.push({
              method: req.method,
              url: req.url,
              request: req.body,
              response: res.body,
            })
          })
        },
      )
      break
    case 'playback':
      cy.log(`**${label}** Playback mode`)
      const filename = formTestRecordingFilename(
        Cypress.spec,
        Cypress.currentTest,
      )
      // for now assuming the file exists
      cy.readFile(filename).then((apiCalls) => {
        let apiCallIndex = 0
        cy.intercept(
          {
            method: '*',
            path: '/todos',
          },
          (req) => {
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
          },
        )
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
