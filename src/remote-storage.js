/// <reference path="./index.d.ts" />
// @ts-check

const remoteConfigured = Cypress.env(
  'magic-backend-remote-registered',
)
if (!remoteConfigured) {
  throw new Error(
    'cypress-magic-backend: you have not configured the remote storage, see https://github.com/bahmutov/cypress-magic-backend',
  )
}

/**
 * @type {MagicBackend.LoadRecord}
 */
function loadRecord(currentSpec, currentTest) {
  return cy.wrap(null)
}

/**
 * Saves the API calls made during the test to a file.
 *
 * @type {MagicBackend.SaveRecord}
 */
function saveRecord(
  currentSpec,
  currentTest,
  pluginName,
  pluginVersion,
  apiCallsInThisTest,
) {
  /** @type {MagicBackend.TestApiRecordData} */
  const data = {
    pluginName: pluginName,
    pluginVersion: pluginVersion,
    specName: currentSpec.relative,
    testName: currentTest.titlePath.join(' / '),
    apiCallsInThisTest,
  }
  return cy.wrap(null)
}

module.exports = {
  loadRecord,
  saveRecord,
}
