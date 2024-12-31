/// <reference types="cypress" />
// @ts-check

Cypress.env('cypress-magic-backend.mode', 'recording')

const apiCallsInThisTest = []

beforeEach(() => {
  apiCallsInThisTest.length = 0

  const mode = Cypress.env('cypress-magic-backend.mode')
  switch (mode) {
    case 'recording':
      cy.log('Recording mode')
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
      ).as('todos')
      break
  }
})

afterEach(() => {
  const mode = Cypress.env('cypress-magic-backend.mode')
  switch (mode) {
    case 'recording':
      const specName = Cypress.spec.relative
      const title = Cypress.currentTest.titlePath.join('_')
      cy.log(
        `Recording ${apiCallsInThisTest.length} API calls for ${specName} "${title}"`,
      )
      cy.writeFile(
        `cypress/magic-backend/${specName}_${title}_api_calls.json`,
        apiCallsInThisTest,
      )
      break
  }
})
