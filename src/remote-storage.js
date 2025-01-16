/// <reference types="cypress" />
// @ts-check

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
