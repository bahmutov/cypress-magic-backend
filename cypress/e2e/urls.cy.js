/// <reference types="cypress" />

const mode = Cypress.env('magic_backend_mode')
if (mode) {
  // do not run this test when recording / replaying / etc
  // since there are no API calls
  return
}

it('collects urls visited during the test', () => {
  cy.visit('/')
  cy.get('.loaded')
  cy.visit('/number.html')
  cy.go('back')
  cy.get('.loaded')

  const collect = Cypress.env('magicBackend')?.collectVisitedUrls
  if (collect) {
    cy.log('**verify collected urls**').then(() => {
      const set = Cypress.env('visitedUrls')
      expect(set, 'set object').to.be.an.instanceOf(Set)
      const urls = set.values().toArray()
      expect(urls, 'urls').deep.equal(['/', '/number.html'])
    })
  } else {
    cy.log('**not collecting visited URLs**').then(() => {
      expect(Cypress.env('visitedUrls')).to.be.undefined
    })
  }
})
