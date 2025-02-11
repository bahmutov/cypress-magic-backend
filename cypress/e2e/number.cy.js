/// <reference types="cypress" />

it('reflects the sent number', () => {
  cy.visit('/number.html')
  cy.get('#num').should('have.value', 0).clear().type('101')
  cy.contains('button', 'Send number').click()
  cy.get('#answer').should('have.text', 'server response: 101')
})
