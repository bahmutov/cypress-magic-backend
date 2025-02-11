/// <reference types="cypress" />

it('reflects the sent number', () => {
  cy.visit('/number.html')
  const random = Cypress._.random(-3, 30)
  cy.get('#num').should('have.value', 0).clear().type(random)
  cy.contains('button', 'Send number').click()

  const mode = Cypress.env('magic_backend_mode')
  if (mode === 'playback') {
    // the response is mocked and we cannot access it easily
    // but it won't be the random number we sent
    cy.contains('#answer', /server response: \d+/)
  } else {
    cy.get('#answer').should(
      'have.text',
      `server response: ${random}`,
    )
  }
})
