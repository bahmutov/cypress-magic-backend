/// <reference types="cypress" />

it(
  'reflects the sent number',
  { viewportHeight: 300, viewportWidth: 300 },
  () => {
    cy.visit('/number.html')
    const random = Cypress._.random(3, 30)
    cy.get('#num').should('have.value', 0).clear().type(random)
    cy.contains('button', 'Send number').click()

    const mode = Cypress.env('magic_backend_mode')
    if (mode === 'playback' || mode === 'playback-only') {
      // the response is mocked and we cannot access it easily
      // but it won't be the random number we sent
      cy.contains('#answer', /server response: \d+/)
    } else {
      cy.get('#answer', { timeout: 500 }).should(
        'have.text',
        `server response: ${random}`,
      )
    }
  },
)
