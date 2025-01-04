/// <reference types="cypress" />

beforeEach(() => {
  const mode = Cypress.env('magic_backend_mode')
  cy.log(`during the test the mode is "${mode}"`)
  if (mode !== 'playback') {
    cy.request('POST', '/reset', { todos: [] })
  }
})

it('adds a todo', () => {
  cy.visit('/')
  cy.log('**confirm the items are loaded**')
  cy.get('.loaded')
  cy.get('.new-todo').type('item 1{enter}')
  cy.get('li.todo').should('have.length', 1)
  cy.get('.new-todo').type('item 2{enter}')
  cy.get('li.todo').should('have.length', 2)
  cy.log('**confirm the items are saved**')
  cy.reload()
  cy.get('li.todo').should('have.length', 2)
})
