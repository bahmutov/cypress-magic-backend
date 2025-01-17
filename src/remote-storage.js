/// <reference path="./index.d.ts" />
// @ts-check

function checkPluginWasRegistered() {
  const remoteConfigured = Cypress.env(
    'magic-backend-remote-registered',
  )
  if (!remoteConfigured) {
    throw new Error(
      'cypress-magic-backend: you have not configured the remote storage, see https://github.com/bahmutov/cypress-magic-backend',
    )
  }
}
checkPluginWasRegistered()

/**
 * @type {MagicBackend.LoadRecord}
 */
function loadRecord(currentSpec, currentTest) {
  checkPluginWasRegistered()

  /** @type {MagicBackend.LoadRecordFindInfo} */
  const findRecordData = {
    specName: currentSpec.relative,
    testName: currentTest.titlePath.join(' / '),
  }
  // @ts-ignore
  return cy.task('magic-backend:load', findRecordData, { log: false })
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
  checkPluginWasRegistered()

  /** @type {MagicBackend.TestApiRecordData} */
  const data = {
    pluginName: pluginName,
    pluginVersion: pluginVersion,
    specName: currentSpec.relative,
    testName: currentTest.titlePath.join(' / '),
    apiCallsInThisTest,
  }

  return cy.task('magic-backend:store', data, { log: false })
}

module.exports = {
  loadRecord,
  saveRecord,
}
