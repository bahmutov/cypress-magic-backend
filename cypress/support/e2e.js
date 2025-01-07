/// <reference types="cypress" />
// @ts-check

import '../../src'

beforeEach(() => {
  const mode = Cypress.env('magic_backend_mode')
  if (mode === 'recording' || mode === 'inspect') {
    // use the cy.CDP command to disable the network caching
    // https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-setCacheDisabled
    cy.CDP('Network.setCacheDisabled', {
      cacheDisabled: true,
    })
  }
})
