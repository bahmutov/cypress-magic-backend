/// <reference types="cypress" />

describe('deleting todo items', () => {
  it('adds two todo items', () => {
    const mode = Cypress.env('magic_backend_mode')
    mode && cy.log(`during the test the mode is "${mode}"`)

    if (!mode?.startsWith('playback')) {
      cy.request('POST', '/reset', { todos: [] })
    }

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

  it('deletes a todo item', () => {
    // we want to continue testing from the previous test
    cy.visit('/')
    cy.get('li.todo').should('have.length', 2)

    // we can even spy on the same mocked network calls
    cy.intercept('DELETE', '/todos/*').as('delete')
    cy.contains('li.todo', 'item 2')
      .find('.destroy')
      .click({ force: true })
    cy.wait('@delete')

    cy.get('li.todo').should('have.length', 1)
  })
})
