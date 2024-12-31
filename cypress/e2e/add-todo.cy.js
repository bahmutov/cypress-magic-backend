/// <reference types="cypress" />

it('adds a todo', () => {
  cy.visit('/')
  cy.get('.new-todo').type('item 1{enter}')
  cy.get('li.todo').should('have.length', 1)
  cy.get('.new-todo').type('item 2{enter}')
  cy.get('li.todo').should('have.length', 2)
})
